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
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const body = await req.json();
    const eventType = body.event_type;
    const data = body.data;

    console.log(`[Paddle Webhook] Received event: ${eventType}`);

    if (eventType === 'transaction.completed') {
      const customData = data.custom_data || {};
      const workspaceId = customData.workspace_id;
      const planSlug = customData.plan_slug;
      const billingCycle = customData.billing_cycle || 'monthly';
      const txnId = data.id;

      if (workspaceId && planSlug) {
        const { data: plan } = await supabase.from('plans').select('*').eq('slug', planSlug).single();
        if (plan) {
          const now = new Date();
          const periodDays = billingCycle === 'yearly' ? 365 : 30;
          const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);
          const receiptNum = `REC-PL-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

          // Update workspace
          await supabase.from('workspaces').update({ plan: plan.slug, updated_at: now.toISOString() }).eq('id', workspaceId);

          // Update subscription
          await supabase.from('subscriptions').upsert({
            workspace_id: workspaceId,
            plan_id: plan.id,
            status: 'active',
            credits_limit: plan.monthly_credits,
            credits_used: 0,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            updated_at: now.toISOString(),
          });

          // Add credits
          const { data: cb } = await supabase.from('credit_balances').select('balance').eq('workspace_id', workspaceId).maybeSingle();
          const currentBal = cb?.balance ?? 0;
          const newBal = currentBal + plan.monthly_credits;

          await supabase.from('credit_balances').upsert({
            workspace_id: workspaceId,
            balance: newBal,
            monthly_limit: plan.monthly_credits,
            updated_at: now.toISOString(),
          });

          // Insert transaction ledger
          await supabase.from('credit_transactions').insert({
            workspace_id: workspaceId,
            user_id: customData.user_id || null,
            type: 'subscription',
            amount: plan.monthly_credits,
            balance_after: newBal,
            reference_type: 'paddle_webhook',
            reference_id: txnId,
            description: `Paddle payment completed: ${plan.name}`,
            created_at: now.toISOString(),
          });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};
