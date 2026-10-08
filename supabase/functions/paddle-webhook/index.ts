import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  try {
    const body = await req.json();
    const eventType = body.event_type;
    const data = body.data;

    console.log(`[paddle-webhook] Received event: ${eventType}`);

    if (eventType === 'transaction.completed') {
      const customData = data.custom_data || {};
      const workspaceId = customData.workspace_id;
      const planSlug = customData.plan_slug;
      const billingCycle = customData.billing_cycle || 'monthly';
      const txnId = data.id;

      if (workspaceId && planSlug) {
        // Fetch plan
        const { data: plan } = await supabase.from('plans').select('*').eq('slug', planSlug).single();
        if (plan) {
          const now = new Date();
          const periodDays = billingCycle === 'yearly' ? 365 : 30;
          const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);
          const receiptNum = `REC-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

          // 1. Update workspace
          await supabase.from('workspaces').update({ plan: plan.slug }).eq('id', workspaceId);

          // 2. Update subscription
          await supabase.from('subscriptions').upsert({
            workspace_id: workspaceId,
            plan_id: plan.id,
            status: 'active',
            credits_limit: plan.credits_limit,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            cancel_at_period_end: false,
            updated_at: now.toISOString(),
          }, { onConflict: 'workspace_id' });

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

          // 4. Log transaction
          await supabase.from('credit_transactions').insert({
            workspace_id: workspaceId,
            type: 'subscription',
            amount: plan.credits_limit,
            balance_after: newBal,
            operation: `paddle_webhook_${plan.slug}`,
            metadata: {
              paddle_transaction_id: txnId,
              billing_cycle: billingCycle,
              receipt_number: receiptNum,
            },
          });

          // 5. Insert billing history
          const receiptRecord = {
            id: crypto.randomUUID(),
            workspace_id: workspaceId,
            paddle_transaction_id: txnId,
            plan_name: plan.name,
            plan_slug: plan.slug,
            billing_cycle: billingCycle,
            amount: (Number(data.details?.totals?.total || 0) / 100) || (billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly),
            currency: data.currency_code || 'USD',
            status: 'paid',
            billing_period_start: now.toISOString(),
            billing_period_end: periodEnd.toISOString(),
            receipt_number: receiptNum,
            payment_method: 'Paddle Billing',
            credits_awarded: plan.credits_limit,
            created_at: now.toISOString(),
          };

          const { error: bhErr } = await supabase.from('billing_history').insert(receiptRecord);
          if (bhErr) {
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
        }
      }
    } else if (eventType === 'subscription.canceled') {
      const workspaceId = data.custom_data?.workspace_id;
      if (workspaceId) {
        await supabase.from('subscriptions').update({
          cancel_at_period_end: true,
          status: 'canceled',
        }).eq('workspace_id', workspaceId);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    console.error('[paddle-webhook error]:', (err as Error).message);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
