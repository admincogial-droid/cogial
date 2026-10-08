import { BillingHistoryItem } from '@/lib/paddle';
import { formatDate } from '@/lib/utils';
import { Printer, Download, Sparkles, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { motion, AnimatePresence } from 'framer-motion';

interface ReceiptModalProps {
  item: BillingHistoryItem | null;
  onClose: () => void;
}

export function ReceiptModal({ item, onClose }: ReceiptModalProps) {
  const { user } = useAuth();
  const { workspace } = useWorkspace();

  if (!item) return null;

  const handlePrint = () => {
    window.print();
  };

  const downloadTextReceipt = () => {
    const text = `
==================================================
PRESSLINE AI — OFFICIAL RECEIPT
==================================================
Receipt Number: ${item.receiptNumber}
Date: ${formatDate(item.createdAt)}
Status: ${item.status.toUpperCase()}

Customer: ${user?.email || 'Valued Customer'}
Workspace: ${workspace?.name || 'Workspace'}
Payment Gateway: Paddle Billing (Live)
Transaction ID: ${item.paddleTransactionId || 'N/A'}

--------------------------------------------------
PLAN DETAILS
--------------------------------------------------
Item: PressLine ${item.planName} Plan (${item.billingCycle.toUpperCase()})
Billing Period: ${formatDate(item.billingPeriodStart)} - ${formatDate(item.billingPeriodEnd)}
Credits Included: ${item.creditsAwarded.toLocaleString()} AI Credits

--------------------------------------------------
PAYMENT SUMMARY
--------------------------------------------------
Subtotal: $${item.amount.toFixed(2)} ${item.currency}
Tax: $0.00
TOTAL PAID: $${item.amount.toFixed(2)} ${item.currency}

Payment Method: ${item.paymentMethod}
Thank you for powering your content with PressLine AI!
==================================================
`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.receiptNumber}-receipt.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-10"
        >
          {/* Receipt Header */}
          <div className="bg-primary/10 border-b border-border p-6 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">PressLine AI</h3>
                <p className="text-xs text-muted-foreground">Official Payment Receipt & Tax Invoice</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                <CheckCircle2 size={12} /> Paid
              </span>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Receipt Body */}
          <div className="p-6 space-y-6 text-sm max-h-[70vh] overflow-y-auto">
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs pb-4 border-b border-border">
              <div>
                <p className="text-muted-foreground font-medium">Receipt Number</p>
                <p className="font-mono font-semibold text-foreground mt-0.5">{item.receiptNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground font-medium">Invoice Date</p>
                <p className="font-medium text-foreground mt-0.5">{formatDate(item.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground font-medium">Billed To</p>
                <p className="font-medium text-foreground mt-0.5 truncate">{user?.email || 'Customer'}</p>
                <p className="text-[11px] text-muted-foreground truncate">{workspace?.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground font-medium">Payment Provider</p>
                <div className="flex items-center gap-1 mt-0.5 font-medium text-foreground">
                  <ShieldCheck size={14} className="text-primary" />
                  <span>Paddle Billing</span>
                </div>
                {item.paddleTransactionId && (
                  <p className="text-[10px] font-mono text-muted-foreground truncate">{item.paddleTransactionId}</p>
                )}
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex justify-between text-xs font-semibold uppercase text-muted-foreground pb-2 border-b border-border">
                <span>Description</span>
                <span>Amount</span>
              </div>
              <div className="py-3 flex justify-between items-start text-xs border-b border-border/50">
                <div>
                  <p className="font-semibold text-foreground">
                    PressLine {item.planName} ({item.billingCycle === 'yearly' ? 'Annual Plan' : 'Monthly Plan'})
                  </p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    Subscription Period: {formatDate(item.billingPeriodStart)} – {formatDate(item.billingPeriodEnd)}
                  </p>
                  <p className="text-primary text-[11px] font-medium mt-0.5">
                    Includes {item.creditsAwarded.toLocaleString()} AI generation credits
                  </p>
                </div>
                <p className="font-semibold text-foreground text-sm">
                  ${item.amount.toFixed(2)} {item.currency}
                </p>
              </div>
            </div>

            {/* Total Breakdown */}
            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${item.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax (0%)</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-border">
                <span>Total Paid</span>
                <span className="text-primary">${item.amount.toFixed(2)} {item.currency}</span>
              </div>
            </div>

            {/* Security & Support Note */}
            <div className="p-3 bg-muted/40 rounded-xl text-[11px] text-muted-foreground leading-relaxed flex items-center gap-2">
              <ShieldCheck size={16} className="text-primary shrink-0" />
              <span>Payments processed securely by Paddle.com Market Ltd. Merchant of Record.</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-end gap-2">
            <button
              onClick={downloadTextReceipt}
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-accent flex items-center gap-1.5 transition-colors"
            >
              <Download size={13} /> Download (.txt)
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer size={13} /> Print Receipt
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
