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
  openedOverlay?: boolean;
  activated?: boolean;
  message?: string;
  receiptNumber?: string;
  newBalance?: number;
}

// Live client-side token generated directly on Paddle Billing
const PADDLE_CLIENT_TOKEN = 'live_1df524905f8ad034fbde80a8078';

declare global {
  interface Window {
    Paddle?: {
      Environment?: {
        set: (env: 'sandbox' | 'live' | 'production') => void;
      };
      Initialize: (options: {
        token: string;
        eventCallback?: (event: any) => void;
        checkout?: any;
      }) => void;
      Checkout?: {
        open: (options: {
          items?: Array<{ priceId: string; quantity: number }>;
          transactionId?: string;
          customer?: { email?: string };
          customData?: Record<string, any>;
          settings?: Record<string, any>;
        }) => void;
      };
    };
  }
}

let isPaddleInitialized = false;

/**
 * Initializes Paddle.js v2 SDK with live token
 */
export function initPaddleJs(onPaymentSuccess?: (data: any) => void): boolean {
  if (typeof window === 'undefined') return false;

  if (window.Paddle) {
    try {
      if (!isPaddleInitialized) {
        if (window.Paddle.Environment?.set) {
          window.Paddle.Environment.set('live');
        }
        window.Paddle.Initialize({
          token: PADDLE_CLIENT_TOKEN,
          eventCallback: (event: any) => {
            console.log('[Paddle Event]', event?.name, event);
            if (event?.name === 'checkout.completed' && onPaymentSuccess) {
              onPaymentSuccess(event.data);
            }
          },
        });
        isPaddleInitialized = true;
      }
      return true;
    } catch (e) {
      console.warn('Paddle.js init warning:', e);
      return false;
    }
  }
  return false;
}

/**
 * Initiates real Paddle checkout in production
 * Opens Paddle.js overlay or server checkout URL
 */
export async function startPaddleCheckout(params: {
  plan: Plan;
  billingCycle: 'monthly' | 'yearly';
  workspaceId: string;
  userId: string;
  userEmail?: string;
  onPaymentSuccess?: () => void;
}): Promise<PaddleCheckoutResult> {
  const { plan, billingCycle, workspaceId, userId, userEmail, onPaymentSuccess } = params;
  const targetPriceId = billingCycle === 'yearly' ? plan.stripe_price_yearly : plan.stripe_price_monthly;

  if (!targetPriceId) {
    throw new Error(`Price ID not configured for ${plan.name} (${billingCycle})`);
  }

  // 1. First attempt: Launch native Paddle.js checkout overlay
  if (typeof window !== 'undefined' && window.Paddle) {
    try {
      initPaddleJs(async (paymentData) => {
        console.log('[Paddle] Payment completed successfully!', paymentData);
        await executeDirectPlanUpgrade({
          plan,
          billingCycle,
          workspaceId,
          userId,
          paddleTransactionId: paymentData?.transaction_id || paymentData?.id,
        });
        if (onPaymentSuccess) onPaymentSuccess();
      });

      if (window.Paddle.Checkout?.open) {
        window.Paddle.Checkout.open({
          items: [{ priceId: targetPriceId, quantity: 1 }],
          customer: userEmail ? { email: userEmail } : undefined,
          customData: {
            workspace_id: workspaceId,
            user_id: userId,
            plan_slug: plan.slug,
            billing_cycle: billingCycle,
          },
        });

        return {
          success: true,
          openedOverlay: true,
          message: 'Paddle checkout launched.',
        };
      }
    } catch (paddleJsErr) {
      console.warn('Paddle.js Checkout.open error, attempting API route:', paddleJsErr);
    }
  }

  // 2. Second attempt: Call serverless Netlify checkout endpoint or Supabase Edge Function
  try {
    const session = (await supabase.auth.getSession()).data.session;
    const token = session?.access_token;

    const netlifyRes = await fetch('/.netlify/functions/paddle-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        priceId: targetPriceId,
        workspaceId,
        userEmail,
        planSlug: plan.slug,
        billingCycle,
      }),
    }).catch(() => null);

    if (netlifyRes && netlifyRes.ok) {
      const netlifyData = await netlifyRes.json();
      if (netlifyData.success && netlifyData.url) {
        window.location.href = netlifyData.url;
        return { success: true, url: netlifyData.url };
      }
      if (netlifyData.isVerificationPending) {
        return {
          success: false,
          isVerificationPending: true,
          message: netlifyData.error?.message || 'Checkouts are awaiting onboarding approval in your Paddle Dashboard.',
        };
      }
    }

    // Try Supabase Edge Function
    const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('paddle-checkout', {
      body: {
        planId: plan.id,
        priceId: targetPriceId,
        workspaceId,
        billingCycle,
        userEmail,
        simulate: false,
      },
    });

    if (!edgeErr && edgeData?.success && edgeData?.url) {
      window.location.href = edgeData.url;
      return { success: true, url: edgeData.url };
    }

    if (edgeData?.isVerificationPending) {
      return {
        success: false,
        isVerificationPending: true,
        message: edgeData?.error?.message || 'Checkouts are awaiting onboarding approval in your Paddle Dashboard.',
      };
    }

    throw new Error('Unable to initialize checkout. Please ensure your Paddle live account onboarding is complete.');
  } catch (err: unknown) {
    const msg = (err as Error).message || 'Failed to start Paddle checkout';
    return {
      success: false,
      isVerificationPending: msg.includes('onboarding') || msg.includes('not_enabled'),
      message: msg,
    };
  }
}

/**
 * Server-backed execution of plan upgrade, atomically updating workspace, profile, subscription, and credits
 */
export async function executeDirectPlanUpgrade(params: {
  plan: Plan;
  billingCycle: 'monthly' | 'yearly';
  workspaceId: string;
  userId: string;
  paddleTransactionId?: string;
}): Promise<PaddleCheckoutResult> {
  const { plan, billingCycle, workspaceId, userId, paddleTransactionId } = params;

  // 1. Try serverless Netlify function first (runs with service_role credentials to bypass RLS)
  try {
    const session = (await supabase.auth.getSession()).data.session;
    const token = session?.access_token;

    const res = await fetch('/.netlify/functions/activate-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        workspaceId,
        planSlug: plan.slug,
        billingCycle,
        paddleTransactionId,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          success: true,
          activated: true,
          newBalance: data.newBalance,
          receiptNumber: data.receiptNumber,
        };
      }
    }
  } catch (netErr) {
    console.warn('Netlify activate-subscription error, trying client fallback:', netErr);
  }

  // 2. Direct client update fallback
  const now = new Date();
  const periodDays = billingCycle === 'yearly' ? 365 : 30;
  const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);
  const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
  const receiptNum = `REC-PL-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const txnId = paddleTransactionId || `txn_paddle_${Date.now().toString(36)}`;
  const creditsAwarded = (plan as any).monthly_credits || plan.credits_limit || 100;

  const client = supabase as any;

  try {
    // Update workspace plan
    await client.from('workspaces').update({ plan: plan.slug, updated_at: now.toISOString() }).eq('id', workspaceId);

    // Update profile plan
    await client.from('profiles').update({ plan: plan.slug, updated_at: now.toISOString() }).eq('id', userId);

    // Update subscription
    const { data: existingSub } = await client.from('subscriptions').select('id').eq('workspace_id', workspaceId).maybeSingle();
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
      await client.from('subscriptions').update(subPayload).eq('workspace_id', workspaceId);
    } else {
      await client.from('subscriptions').insert(subPayload);
    }

    // Attempt credit update
    const { data: cb } = await client.from('credit_balances').select('balance').eq('workspace_id', workspaceId).maybeSingle();
    const currentBal = cb?.balance ?? 0;
    const newBal = currentBal + creditsAwarded;

    await client.from('credit_balances').upsert({
      workspace_id: workspaceId,
      balance: newBal,
      monthly_limit: creditsAwarded,
      updated_at: now.toISOString(),
    });

    // Save invoice receipt
    const receiptItem: BillingHistoryItem = {
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
      paddleTransactionId: txnId,
      creditsAwarded,
    };

    const { data: currentSettings } = await client
      .from('settings')
      .select('value')
      .eq('workspace_id', workspaceId)
      .eq('key', 'billing_history')
      .maybeSingle();

    const historyList = Array.isArray(currentSettings?.value) ? currentSettings.value : [];
    await client.from('settings').upsert({
      workspace_id: workspaceId,
      key: 'billing_history',
      value: [receiptItem, ...historyList],
      updated_at: now.toISOString(),
    });

    return {
      success: true,
      activated: true,
      newBalance: newBal,
      receiptNumber: receiptNum,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Upgrade update failed',
    };
  }
}

/**
 * Retrieves billing history & tax invoices for the workspace
 */
export async function getBillingHistory(workspaceId: string): Promise<BillingHistoryItem[]> {
  const client = supabase as any;

  try {
    const { data: settingsRow } = await client
      .from('settings')
      .select('value')
      .eq('workspace_id', workspaceId)
      .eq('key', 'billing_history')
      .maybeSingle();

    if (settingsRow && Array.isArray(settingsRow.value) && settingsRow.value.length > 0) {
      return settingsRow.value as BillingHistoryItem[];
    }
  } catch (e) {
    console.warn('Could not query settings table for billing_history:', e);
  }

  try {
    const { data: txns } = await client
      .from('credit_transactions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('type', 'subscription')
      .order('created_at', { ascending: false })
      .limit(20);

    if (txns && txns.length > 0) {
      return txns.map((t: any) => ({
        id: t.id,
        receiptNumber: t.metadata?.receipt_number || `REC-${t.id.slice(0, 8).toUpperCase()}`,
        planName: t.metadata?.plan_name || 'Active Subscription',
        planSlug: 'plan',
        billingCycle: t.metadata?.billing_cycle || 'monthly',
        amount: Number(t.metadata?.amount) || 49,
        currency: 'USD',
        status: 'paid',
        billingPeriodStart: t.created_at,
        billingPeriodEnd: new Date(new Date(t.created_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: t.created_at,
        paymentMethod: 'Paddle Billing (Live)',
        paddleTransactionId: t.metadata?.paddle_transaction_id || t.reference_id,
        creditsAwarded: Math.abs(t.amount),
      }));
    }
  } catch (e) {
    console.warn('Could not query credit_transactions for billing history:', e);
  }

  return [];
}

export const fetchBillingHistory = getBillingHistory;
