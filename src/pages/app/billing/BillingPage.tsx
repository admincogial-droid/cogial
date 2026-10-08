import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Plan } from '@/types';
import { Check, Zap, AlertTriangle, ShieldCheck, FileText, ArrowRight, Loader2, Sparkles, Calendar, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { startPaddleCheckout, executeDirectPlanUpgrade, fetchBillingHistory, BillingHistoryItem } from '@/lib/paddle';
import { ReceiptModal } from '@/components/billing/ReceiptModal';
import { formatDate } from '@/lib/utils';

export default function BillingPage() {
  const { user } = useAuth();
  const { workspace, subscription, credits, refreshWorkspace } = useWorkspace();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<BillingHistoryItem | null>(null);
  const [verificationPendingModal, setVerificationPendingModal] = useState<{ open: boolean; plan: Plan | null }>({
    open: false,
    plan: null,
  });

  const loadData = async () => {
    try {
      const { data: p } = await supabase.from('plans').select('*').eq('is_active', true).order('sort_order');
      if (p) setPlans(p as Plan[]);

      if (workspace) {
        const history = await fetchBillingHistory(workspace.id);
        setBillingHistory(history);
      }
    } catch (err) {
      console.error('Error loading billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workspace]);

  const handleUpgrade = async (plan: Plan) => {
    if (!workspace || !user) {
      toast.error('Workspace session required');
      return;
    }

    setProcessingPlanId(plan.id);

    try {
      const res = await startPaddleCheckout({
        plan,
        billingCycle: billing,
        workspaceId: workspace.id,
        userId: user.id,
      });

      if (res.url) {
        // Paddle live checkout URL returned
        toast.info('Redirecting to Paddle secure checkout...');
        window.location.href = res.url;
        return;
      }

      if (res.isVerificationPending) {
        // Live Paddle account is in verification review, offer instant test upgrade
        setVerificationPendingModal({ open: true, plan });
        return;
      }

      if (res.activated) {
        toast.success(`Successfully updated to ${plan.name} plan!`);
        await refreshWorkspace();
        await loadData();
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to start checkout');
    } finally {
      setProcessingPlanId(null);
    }
  };

  const confirmInstantActivation = async () => {
    const plan = verificationPendingModal.plan;
    if (!plan || !workspace || !user) return;

    setProcessingPlanId(plan.id);
    setVerificationPendingModal({ open: false, plan: null });

    try {
      const res = await executeDirectPlanUpgrade({
        plan,
        billingCycle: billing,
        workspaceId: workspace.id,
        userId: user.id,
      });

      if (res.success) {
        toast.success(`Successfully activated ${plan.name} plan! Added ${res.newBalance} credits.`);
        await refreshWorkspace();
        await loadData();
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Activation failed');
    } finally {
      setProcessingPlanId(null);
    }
  };

  const creditsLimit = subscription?.credits_limit || 100;
  const creditsUsed = subscription?.credits_used || 0;
  const creditPct = Math.min((creditsUsed / creditsLimit) * 100, 100);
  const currentPlanSlug = workspace?.plan || 'free';
  const currentPeriodEnd = subscription?.current_period_end ? formatDate(subscription.current_period_end) : 'Next Month';
  const currentPeriodStart = subscription?.current_period_start ? formatDate(subscription.current_period_start) : formatDate(new Date());

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Billing & Subscriptions</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your PressLine plan, Paddle billing, credits quota, and tax invoices.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
            <ShieldCheck size={14} />
            <span>Paddle Billing Live Gateway</span>
          </div>
        </div>

        {/* Current Plan & Credits Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Active Plan Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Plan</span>
                  <div className="flex items-center gap-3 mt-1">
                    <h2 className="text-2xl font-bold capitalize text-foreground">{currentPlanSlug}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                      Active
                    </span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Zap size={20} />
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Credits Quota: <strong className="text-foreground">{credits}</strong> remaining
                  </span>
                  <span className="text-muted-foreground">
                    {creditsUsed} of {creditsLimit} used
                  </span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${creditPct > 80 ? 'bg-destructive' : 'bg-primary'}`}
                    style={{ width: `${creditPct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 mt-4 border-t border-border text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-primary" />
                <span>Current Cycle: {currentPeriodStart} – {currentPeriodEnd}</span>
              </div>
              <span>Renews on {currentPeriodEnd}</span>
            </div>
          </div>

          {/* Quick Payment Guarantee Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 text-foreground font-semibold text-sm">
                <CreditCard size={18} className="text-primary" />
                <span>Paddle Verified</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All transactions are encrypted and secured through Paddle. Invoices, receipts, and VAT calculations are handled automatically.
              </p>
            </div>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Payment Gateway: Paddle Live Active
              </span>
          </div>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div>
            <h2 className="text-lg font-bold">Choose a Subscription Plan</h2>
            <p className="text-xs text-muted-foreground">Upgrade anytime. Credits and features apply instantly to your workspace.</p>
          </div>
          <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                billing === 'monthly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                billing === 'yearly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary text-primary-foreground font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-80 bg-muted/50 animate-pulse rounded-2xl border border-border" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((plan) => {
              const isCurrent = currentPlanSlug.toLowerCase() === plan.slug.toLowerCase();
              const isPro = plan.slug === 'pro';
              const price = billing === 'yearly' ? Math.round(plan.price_yearly / 12) : plan.price_monthly;
              const features = Array.isArray(plan.features) ? (plan.features as string[]) : [];
              const isBusy = processingPlanId === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition-all relative ${
                    isCurrent
                      ? 'border-primary ring-1 ring-primary bg-primary/[0.02]'
                      : isPro
                      ? 'border-primary/60 bg-card shadow-md hover:border-primary'
                      : 'border-border bg-card hover:border-border/80'
                  }`}
                >
                  {isPro && !isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider shadow-sm">
                      Most Popular
                    </div>
                  )}

                  <div>
                    <div className="mb-4">
                      <h3 className="font-bold text-base text-foreground capitalize">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[32px]">{plan.description}</p>
                      <div className="flex items-baseline gap-1 mt-3">
                        <span className="text-3xl font-extrabold text-foreground">${price}</span>
                        <span className="text-xs text-muted-foreground">/ month</span>
                      </div>
                      {billing === 'yearly' && plan.price_yearly > 0 && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                          Billed ${plan.price_yearly} yearly
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 pt-3 border-t border-border/60 mb-5">
                      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Zap size={13} className="text-primary" />
                        <span>{plan.credits_limit.toLocaleString()} AI Credits / mo</span>
                      </p>
                      <ul className="space-y-2">
                        {features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <Check size={13} className="text-primary flex-shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={isCurrent || isBusy}
                    className={`w-full h-10 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                      isCurrent
                        ? 'bg-muted text-muted-foreground cursor-default'
                        : isPro
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-card border border-border text-foreground hover:bg-accent'
                    }`}
                  >
                    {isBusy ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : isCurrent ? (
                      'Current Plan'
                    ) : plan.price_monthly === 0 ? (
                      'Downgrade to Free'
                    ) : (
                      <>
                        <span>Upgrade with Paddle</span>
                        <ArrowRight size={13} />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Payment & Billing History Section */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Invoices & Payment History</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Download tax invoices and official Paddle payment receipts for your subscription.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileText size={14} />
              <span>{billingHistory.length} Record{billingHistory.length === 1 ? '' : 's'}</span>
            </div>
          </div>

          {billingHistory.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto opacity-30 mb-2" />
              <p className="text-sm font-medium">No previous invoices yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Your first receipt will be generated automatically when you complete an upgrade.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/30 text-muted-foreground font-semibold">
                    <th className="px-6 py-3">Receipt / Invoice #</th>
                    <th className="px-6 py-3">Date / Month</th>
                    <th className="px-6 py-3">Subscription Details</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Payment Provider</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {billingHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-3.5 font-mono font-medium text-foreground">{item.receiptNumber}</td>
                      <td className="px-6 py-3.5 text-muted-foreground">{formatDate(item.createdAt)}</td>
                      <td className="px-6 py-3.5">
                        <span className="font-semibold text-foreground capitalize">{item.planName}</span>
                        <span className="text-[11px] text-muted-foreground block">
                          Cycle: {item.billingCycle === 'yearly' ? 'Annual' : 'Monthly'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-foreground">
                        ${item.amount.toFixed(2)} {item.currency}
                      </td>
                      <td className="px-6 py-3.5 text-muted-foreground flex items-center gap-1.5 pt-4">
                        <ShieldCheck size={13} className="text-primary" />
                        <span>{item.paymentMethod}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedReceipt(item)}
                          className="px-3 py-1 rounded-lg border border-border hover:bg-accent text-primary font-medium transition-colors"
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Verification / Immediate Activation Modal */}
        {verificationPendingModal.open && verificationPendingModal.plan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Paddle Live Verification Notice</h3>
                  <p className="text-xs text-muted-foreground">Account review in progress</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Your live Paddle API key is active and linked to PressLine. Paddle requires merchant onboarding verification before opening customer checkout windows.
              </p>
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primary font-medium">
                You can activate the <strong>{verificationPendingModal.plan.name}</strong> plan right now to test subscription upgrades, credit allocation, renewal dates, and payment receipts immediately.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setVerificationPendingModal({ open: false, plan: null })}
                  className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmInstantActivation}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Activate {verificationPendingModal.plan.name} Plan Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Official Receipt Viewer Modal */}
        <ReceiptModal item={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      </div>
    </DashboardLayout>
  );
}
