import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useWorkspace } from '@/context/WorkspaceContext';
import { supabase } from '@/lib/supabase';
import type { Plan, Subscription } from '@/types';
import { Check, CreditCard, Zap, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function BillingPage() {
  const { workspace, subscription, credits } = useWorkspace();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<{ id: string; type: string; amount: number; description: string | null; created_at: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: p } = await supabase.from('plans').select('*').eq('is_active', true).order('sort_order');
      setPlans((p ?? []) as Plan[]);
      if (workspace) {
        const { data: t } = await supabase.from('credit_transactions').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false }).limit(20);
        setTransactions(t ?? []);
      }
      setLoading(false);
    };
    load();
  }, [workspace]);

  const upgrade = async (plan: Plan) => {
    if (!isSupabaseConfigured) { toast.error('Configure Supabase and Stripe to enable billing'); return; }
    if (!workspace) return;
    const stripePrice = billing === 'yearly' ? plan.stripe_price_yearly : plan.stripe_price_monthly;
    if (!stripePrice) { toast.warning('Stripe not configured. Add STRIPE_SECRET_KEY to Edge Function secrets.'); return; }
    const { data, error } = await supabase.functions.invoke('stripe-checkout', {
      body: { planId: plan.id, priceId: stripePrice, workspaceId: workspace.id, billingCycle: billing },
    });
    if (error || !data?.url) toast.error('Could not start checkout. Ensure Stripe is configured.');
    else window.location.href = data.url;
  };

  const creditPct = subscription ? Math.min((subscription.credits_used / subscription.credits_limit) * 100, 100) : 0;

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Billing & Plans</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your subscription and credits.</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3">
            <AlertTriangle size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Billing not configured</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-0.5">Add STRIPE_SECRET_KEY to your Supabase Edge Function secrets to enable payments.</p>
            </div>
          </div>
        )}

        {/* Current Usage */}
        <div className="rounded-xl border border-border bg-card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-sm">Current Plan: <span className="text-primary capitalize">{workspace?.plan ?? 'Free'}</span></h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {subscription?.credits_used ?? 0} / {subscription?.credits_limit ?? 100} credits used
              </p>
            </div>
            <Zap size={20} className="text-primary" />
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${creditPct > 80 ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${creditPct}%` }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">{credits} credits remaining</span>
            {creditPct > 80 && <span className="text-xs text-destructive font-medium">Running low!</span>}
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setBilling('monthly')} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${billing === 'monthly' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'}`}>Monthly</button>
          <button onClick={() => setBilling('yearly')} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${billing === 'yearly' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'}`}>
            Yearly <span className="text-xs ml-1 opacity-80">Save 20%</span>
          </button>
        </div>

        {/* Plans */}
        {loading ? (
          <div className="grid sm:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />)}</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {plans.slice(0, 3).map(plan => {
              const isCurrent = workspace?.plan === plan.slug;
              const price = billing === 'yearly' ? plan.price_yearly / 12 : plan.price_monthly;
              const features = Array.isArray(plan.features) ? plan.features as string[] : [];
              return (
                <div key={plan.id} className={`rounded-xl border p-5 flex flex-col transition-all ${isCurrent ? 'border-primary bg-accent/40' : 'border-border bg-card hover:border-primary/40'}`}>
                  <div className="mb-4">
                    <p className="font-bold text-sm">{plan.name}</p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold">${price === 0 ? '0' : price.toFixed(0)}</span>
                      <span className="text-xs text-muted-foreground">/mo</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                  </div>
                  <ul className="space-y-2 flex-1 mb-4">
                    {features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <Check size={12} className="text-primary flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => upgrade(plan)} disabled={isCurrent}
                    className={`w-full h-9 rounded-lg text-sm font-medium transition-colors ${isCurrent ? 'bg-muted text-muted-foreground cursor-default' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
                    {isCurrent ? 'Current plan' : plan.price_monthly === 0 ? 'Downgrade' : 'Upgrade'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Transaction History */}
        {transactions.length > 0 && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold">Credit History</h2>
            </div>
            {transactions.map(t => (
              <div key={t.id} className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 last:border-0 text-sm">
                <div>
                  <p className="text-xs font-medium capitalize">{t.type}</p>
                  <p className="text-[11px] text-muted-foreground">{t.description}</p>
                </div>
                <span className={`text-xs font-medium ${t.amount < 0 ? 'text-destructive' : 'text-green-500'}`}>
                  {t.amount > 0 ? '+' : ''}{t.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
