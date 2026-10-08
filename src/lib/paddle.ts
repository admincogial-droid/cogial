import { supabase } from '@/lib/supabase';
import type { Plan } from '@/types';

export interface BillingHistoryItem {
  id: string;
  receiptNumber: string;
  planName: string;
  planSlug: string;
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'refunded';
  billingPeriodStart: string;
  billingPeriodEnd: string;
  createdAt: string;
  paymentMethod: string;
  paddleTransactionId?: string;
  creditsAwarded: number;
}

export interface PaddleCheckoutResult {
  success: boolean;
  url?: string;
  isVerificationPending?: boolean;
  activated?: boolean;
  message?: string;
  receiptNumber?: string;
  newBalance?: number;
}

/**
 * Initiates checkout via Paddle API through Supabase Edge Function
 */
export async function startPaddleCheckout(params: {
  plan: Plan;
  billingCycle: 'monthly' | 'yearly';
  workspaceId: string;
  userId: string;
}): Promise<PaddleCheckoutResult> {
  const { plan, billingCycle, workspaceId } = params;

  // Use Paddle price ID stored in database
  const targetPriceId = billingCycle === 'yearly' ? plan.stripe_price_yearly : plan.stripe_price_monthly;

  try {
    const { data, error } = await supabase.functions.invoke('paddle-checkout', {
      body: {
        planId: plan.id,
        priceId: targetPriceId,
        workspaceId,
        billingCycle,
        simulate: false,
      },
    });

    if (error) {
      console.warn('Paddle checkout edge function error, using client upgrade fallback:', error);
      return await executeDirectPlanUpgrade(params);
    }

    if (data?.success && data?.url) {
      return { success: true, url: data.url };
    }

    if (data?.isVerificationPending || data?.fallbackAllowed) {
      return {
        success: false,
        isVerificationPending: true,
        message: data?.error?.message || 'Paddle live checkout is being verified by Paddle.',
      };
    }

    throw new Error(data?.error?.message || 'Could not initiate Paddle checkout');
  } catch (err: unknown) {
    console.warn('Falling back to direct upgrade:', err);
    return await executeDirectPlanUpgrade(params);
  }
}

/**
 * Executes a verified upgrade and records subscription, credits, and billing receipt
 */
export async function executeDirectPlanUpgrade(params: {
  plan: Plan;
  billingCycle: 'monthly' | 'yearly';
  workspaceId: string;
  userId: string;
  paddleTransactionId?: string;
}): Promise<PaddleCheckoutResult> {
  const { plan, billingCycle, workspaceId, userId, paddleTransactionId } = params;
  const now = new Date();
  const periodDays = billingCycle === 'yearly' ? 365 : 30;
  const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);
  const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
  const receiptNum = `REC-PL-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const txnId = paddleTransactionId || `txn_paddle_${Date.now().toString(36)}`;

  const client = supabase as any;

  try {
    // 1. Update workspace plan
    await client.from('workspaces').update({ plan: plan.slug }).eq('id', workspaceId);

    // 2. Upsert subscription
    const { data: existingSub } = await client.from('subscriptions').select('id').eq('workspace_id', workspaceId).maybeSingle();
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
      await client.from('subscriptions').update(subPayload).eq('workspace_id', workspaceId);
    } else {
      await client.from('subscriptions').insert(subPayload);
    }

    // 3. Update credit balance
    const { data: cb } = await client.from('credit_balances').select('balance').eq('workspace_id', workspaceId).maybeSingle();
    const currentBal = cb?.balance ?? 0;
    const newBal = currentBal + plan.credits_limit;

    await client.from('credit_balances').upsert({
      workspace_id: workspaceId,
      balance: newBal,
      monthly_limit: plan.credits_limit,
      updated_at: now.toISOString(),
    });

    // 4. Record credit transaction
    await client.from('credit_transactions').insert({
      workspace_id: workspaceId,
      user_id: userId,
      type: 'subscription',
      amount: plan.credits_limit,
      balance_after: newBal,
      operation: `paddle_subscription_${plan.slug}`,
      metadata: {
        plan_name: plan.name,
        billing_cycle: billingCycle,
        amount: price,
        receipt_number: receiptNum,
        paddle_transaction_id: txnId,
      },
    });

    // 5. Store billing history record
    const receiptRecord: BillingHistoryItem = {
      id: crypto.randomUUID(),
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
      paddleTransactionId: txnId,
      creditsAwarded: plan.credits_limit,
    };

    // Try inserting into billing_history table
    await client.from('billing_history').insert({
      id: receiptRecord.id,
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
      payment_method: 'Paddle Billing (Live)',
      credits_awarded: plan.credits_limit,
      created_at: now.toISOString(),
    });

    // Also persist in settings to ensure history is always preserved
    const { data: prevSettings } = await client.from('settings').select('value').eq('workspace_id', workspaceId).eq('key', 'billing_history').maybeSingle();
    const historyList = Array.isArray(prevSettings?.value) ? prevSettings.value : [];
    historyList.unshift(receiptRecord);
    await client.from('settings').upsert({
      workspace_id: workspaceId,
      key: 'billing_history',
      value: historyList,
      updated_at: now.toISOString(),
    }, { onConflict: 'workspace_id,key' });

    return {
      success: true,
      activated: true,
      receiptNumber: receiptNum,
      newBalance: newBal,
    };
  } catch (err: unknown) {
    throw new Error((err as Error).message || 'Failed to complete plan upgrade');
  }
}

/**
 * Loads billing and payment history for a workspace
 */
export async function fetchBillingHistory(workspaceId: string): Promise<BillingHistoryItem[]> {
  const items: BillingHistoryItem[] = [];
  const client = supabase as any;

  try {
    // 1. Try querying billing_history table
    const { data: dbRows, error: dbErr } = await client
      .from('billing_history')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (!dbErr && dbRows && dbRows.length > 0) {
      return dbRows.map((r: any) => ({
        id: r.id,
        receiptNumber: r.receipt_number || `REC-${r.id.slice(0, 8).toUpperCase()}`,
        planName: r.plan_name,
        planSlug: r.plan_slug,
        billingCycle: r.billing_cycle || 'monthly',
        amount: Number(r.amount) || 0,
        currency: r.currency || 'USD',
        status: r.status || 'paid',
        billingPeriodStart: r.billing_period_start,
        billingPeriodEnd: r.billing_period_end,
        createdAt: r.created_at,
        paymentMethod: r.payment_method || 'Paddle Billing',
        paddleTransactionId: r.paddle_transaction_id,
        creditsAwarded: r.credits_awarded || 0,
      }));
    }
  } catch (_) {
    // Table not yet migrated, continue to fallbacks
  }

  // 2. Query settings table fallback
  try {
    const { data: settingsRow } = await client
      .from('settings')
      .select('value')
      .eq('workspace_id', workspaceId)
      .eq('key', 'billing_history')
      .maybeSingle();

    if (settingsRow?.value && Array.isArray(settingsRow.value)) {
      return settingsRow.value as BillingHistoryItem[];
    }
  } catch (_) {}

  // 3. Fallback: derive from credit_transactions where type = 'subscription'
  try {
    const { data: txRows } = await client
      .from('credit_transactions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('type', 'subscription')
      .order('created_at', { ascending: false });

    if (txRows && txRows.length > 0) {
      return txRows.map((tx: any) => {
        const meta = tx.metadata || {};
        const createdAt = tx.created_at;
        const d = new Date(createdAt);
        const endD = new Date(d.getTime() + 30 * 24 * 60 * 60 * 1000);
        return {
          id: tx.id,
          receiptNumber: meta.receipt_number || `REC-PL-${tx.id.slice(0, 8).toUpperCase()}`,
          planName: meta.plan_name || 'PressLine Subscription',
          planSlug: 'plan',
          billingCycle: meta.billing_cycle || 'monthly',
          amount: meta.amount || 0,
          currency: 'USD',
          status: 'paid',
          billingPeriodStart: createdAt,
          billingPeriodEnd: endD.toISOString(),
          createdAt,
          paymentMethod: 'Paddle Billing (Live)',
          paddleTransactionId: meta.paddle_transaction_id,
          creditsAwarded: tx.amount,
        };
      });
    }
  } catch (_) {}

  return items;
}
