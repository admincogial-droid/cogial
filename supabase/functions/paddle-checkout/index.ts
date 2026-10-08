import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const PADDLE_API_URL = 'https://api.paddle.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Missing Authorization header' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const paddleApiKey = Deno.env.get('PADDLE_API_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Invalid or expired session token' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { planId, priceId, workspaceId, billingCycle = 'monthly', simulate = false } = body;

    if (!workspaceId || (!priceId && !planId)) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'workspaceId and planId/priceId are required' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify workspace membership
    const { data: member, error: memberError } = await supabase
      .from('workspace_members')
      .select('id, role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !member) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Unauthorized workspace member' } }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Retrieve plan details from DB
    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (!plan) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Plan not found' } }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If simulation/instant test activation is requested or if priceId is not given
    if (simulate) {
      return await completeUpgrade(supabase, workspaceId, user.id, plan, billingCycle, 'SIM-TXN-' + Date.now());
    }

    // Call Paddle API to create transaction
    const targetPriceId = priceId || (billingCycle === 'yearly' ? plan.stripe_price_yearly : plan.stripe_price_monthly);

    if (!targetPriceId) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'No Paddle price configured for this plan' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paddleRes = await fetch(`${PADDLE_API_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paddleApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ price_id: targetPriceId, quantity: 1 }],
        custom_data: {
          workspace_id: workspaceId,
          user_id: user.id,
          plan_id: plan.id,
          plan_slug: plan.slug,
          billing_cycle: billingCycle,
        },
      }),
    });

    const paddleData = await paddleRes.json();

    if (paddleRes.ok && paddleData.data) {
      const checkoutUrl = paddleData.data.checkout?.url;
      const transactionId = paddleData.data.id;

      return new Response(
        JSON.stringify({
          success: true,
          url: checkoutUrl,
          transactionId,
          paddlePriceId: targetPriceId,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if error is due to live account verification pending
    const errorCode = paddleData.error?.code;
    const isVerificationPending = errorCode === 'transaction_checkout_not_enabled';

    return new Response(
      JSON.stringify({
        success: false,
        isVerificationPending,
        error: {
          code: errorCode || 'paddle_error',
          message: paddleData.error?.detail || paddleData.error?.message || 'Could not initiate Paddle checkout',
        },
        fallbackAllowed: true,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    return new Response(
      JSON.stringify({ success: false, error: { message: (err as Error).message || 'Server error' } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function completeUpgrade(supabase: any, workspaceId: string, userId: string, plan: any, billingCycle: string, txnId: string) {
  const periodDays = billingCycle === 'yearly' ? 365 : 30;
  const now = new Date();
  const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);
  const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
  const receiptNum = `REC-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // 1. Update workspace plan
  await supabase.from('workspaces').update({ plan: plan.slug }).eq('id', workspaceId);

  // 2. Update/Upsert subscription
  const { data: existingSub } = await supabase.from('subscriptions').select('id').eq('workspace_id', workspaceId).single();
  const subPayload = {
    workspace_id: workspaceId,
    plan_id: plan.id,
    status: 'active',
    credits_limit: plan.credits_limit,
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

  // 3. Update credit balance
  const { data: cb } = await supabase.from('credit_balances').select('balance').eq('workspace_id', workspaceId).single();
  const currentBal = cb?.balance ?? 0;
  const newBal = currentBal + plan.credits_limit;

  await supabase.from('credit_balances').upsert({
    workspace_id: workspaceId,
    balance: newBal,
    monthly_limit: plan.credits_limit,
    updated_at: now.toISOString(),
  });

  // 4. Log credit transaction
  await supabase.from('credit_transactions').insert({
    workspace_id: workspaceId,
    user_id: userId,
    type: 'subscription',
    amount: plan.credits_limit,
    balance_after: newBal,
    operation: `plan_upgrade_${plan.slug}`,
    metadata: {
      billing_cycle: billingCycle,
      plan_name: plan.name,
      amount: price,
      receipt_number: receiptNum,
      paddle_transaction_id: txnId,
    },
  });

  // 5. Store billing receipt
  const receiptRecord = {
    id: crypto.randomUUID(),
    workspace_id: workspaceId,
    user_id: userId,
    paddle_transaction_id: txnId,
    plan_name: plan.name,
    plan_slug: plan.slug,
    billing_cycle: billingCycle,
    amount: price,
    currency: 'USD',
    status: 'paid',
    billing_period_start: now.toISOString(),
    billing_period_end: periodEnd.toISOString(),
    receipt_number: receiptNum,
    payment_method: 'Card / Paddle Billing',
    credits_awarded: plan.credits_limit,
    created_at: now.toISOString(),
  };

  // Try inserting into billing_history if table exists, otherwise persist in settings
  const { error: bhErr } = await supabase.from('billing_history').insert(receiptRecord);
  if (bhErr) {
    // Fallback storage in settings table
    const { data: prevSettings } = await supabase.from('settings').select('value').eq('workspace_id', workspaceId).eq('key', 'billing_history').single();
    const historyList = Array.isArray(prevSettings?.value) ? prevSettings.value : [];
    historyList.unshift(receiptRecord);
    await supabase.from('settings').upsert({
      workspace_id: workspaceId,
      key: 'billing_history',
      value: historyList,
      updated_at: now.toISOString(),
    }, { onConflict: 'workspace_id,key' });
  }

  return new Response(
    JSON.stringify({
      success: true,
      activated: true,
      plan: plan.slug,
      creditsAwarded: plan.credits_limit,
      newBalance: newBal,
      receiptNumber: receiptNum,
      periodEnd: periodEnd.toISOString(),
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
