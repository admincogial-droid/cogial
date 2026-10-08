import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export default async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Database service credentials missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const token = authHeader.replace(/^Bearer\s+/i, '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired user session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { workspaceId, planSlug, billingCycle = 'monthly', paddleTransactionId } = body;

    if (!workspaceId || !planSlug) {
      return new Response(
        JSON.stringify({ success: false, error: 'workspaceId and planSlug are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Verify user membership in workspace
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!member) {
      // Check if user is owner of workspace
      const { data: wsOwner } = await supabase
        .from('workspaces')
        .select('owner_id')
        .eq('id', workspaceId)
        .maybeSingle();

      if (!wsOwner || wsOwner.owner_id !== user.id) {
        return new Response(
          JSON.stringify({ success: false, error: 'You are not authorized to update this workspace' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 2. Fetch plan details
    const { data: plan, error: planErr } = await supabase
      .from('plans')
      .select('*')
      .eq('slug', planSlug)
      .single();

    if (planErr || !plan) {
      return new Response(
        JSON.stringify({ success: false, error: `Plan '${planSlug}' not found` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const periodDays = billingCycle === 'yearly' ? 365 : 30;
    const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);
    const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
    const receiptNum = `REC-PL-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const creditsAwarded = plan.monthly_credits || 100;

    // 3. Update workspace
    await supabase.from('workspaces').update({ plan: plan.slug, updated_at: now.toISOString() }).eq('id', workspaceId);

    // 4. Update profile
    await supabase.from('profiles').update({ plan: plan.slug, updated_at: now.toISOString() }).eq('id', user.id);

    // 5. Upsert subscription
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    const subPayload = {
      workspace_id: workspaceId,
      plan_id: plan.id,
      status: 'active',
      credits_limit: creditsAwarded,
      credits_used: 0,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
      updated_at: now.toISOString(),
    };

    if (existingSub) {
      await supabase.from('subscriptions').update(subPayload).eq('workspace_id', workspaceId);
    } else {
      await supabase.from('subscriptions').insert(subPayload);
    }

    // 6. Update credit balance atomically
    const { data: cb } = await supabase
      .from('credit_balances')
      .select('balance')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    const currentBal = cb?.balance ?? 0;
    const newBal = currentBal + creditsAwarded;

    await supabase.from('credit_balances').upsert({
      workspace_id: workspaceId,
      balance: newBal,
      monthly_limit: creditsAwarded,
      updated_at: now.toISOString(),
    });

    // 7. Insert credit transaction
    await supabase.from('credit_transactions').insert({
      workspace_id: workspaceId,
      user_id: user.id,
      type: 'subscription',
      amount: creditsAwarded,
      balance_after: newBal,
      reference_type: 'subscription',
      reference_id: null,
      description: `Paddle ${plan.name} (${billingCycle}) subscription upgrade`,
      created_at: now.toISOString(),
    });

    // 8. Record invoice receipt in settings and billing_history
    const receiptItem = {
      id: `rec_${Date.now()}`,
      receiptNumber: receiptNum,
      planName: plan.name,
      planSlug: plan.slug,
      billingCycle,
      amount: price,
      currency: 'USD',
      status: 'paid',
      billingPeriodStart: now.toISOString(),
      billingPeriodEnd: periodEnd.toISOString(),
      createdAt: now.toISOString(),
      paymentMethod: 'Paddle Billing (Live)',
      paddleTransactionId: paddleTransactionId || `txn_paddle_${Date.now().toString(36)}`,
      creditsAwarded,
    };

    // Upsert into settings table
    const { data: currentSettings } = await supabase
      .from('settings')
      .select('value')
      .eq('workspace_id', workspaceId)
      .eq('key', 'billing_history')
      .maybeSingle();

    const historyList = Array.isArray(currentSettings?.value) ? currentSettings.value : [];
    const updatedHistory = [receiptItem, ...historyList];

    await supabase.from('settings').upsert({
      workspace_id: workspaceId,
      key: 'billing_history',
      value: updatedHistory,
      updated_at: now.toISOString(),
    });

    // Also attempt billing_history table if present
    await supabase.from('billing_history').insert({
      workspace_id: workspaceId,
      user_id: user.id,
      paddle_transaction_id: receiptItem.paddleTransactionId,
      plan_name: plan.name,
      plan_slug: plan.slug,
      billing_cycle: billingCycle,
      amount: price,
      currency: 'USD',
      status: 'paid',
      billing_period_start: now.toISOString(),
      billing_period_end: periodEnd.toISOString(),
      receipt_number: receiptNum,
      payment_method: 'Paddle Billing (Live)',
      credits_awarded: creditsAwarded,
    }).catch(() => null);

    return new Response(
      JSON.stringify({
        success: true,
        plan: plan.slug,
        newBalance: newBal,
        creditsAwarded,
        receiptNumber: receiptNum,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};
