import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { HelpCircle, MessageSquare, Plus, X, Loader2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';

interface Ticket {
  id: string;
  workspace_id: string;
  user_id: string;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'pending' | 'resolved' | 'closed';
  created_at: string;
}

const FAQS = [
  {
    q: 'How do AI credits work?',
    a: 'Each AI generation consumes credits based on the operation. Simple tasks like titles use 1 credit; long articles may use 5-20 credits. Credits reset monthly based on your plan.',
  },
  {
    q: 'How do I upgrade my plan?',
    a: 'Go to Dashboard → Billing and select the plan that fits your needs. Your credits and features will be updated immediately.',
  },
  {
    q: 'Can I use my own AI model?',
    a: 'PressLine uses OpenRouter to route AI requests. You can configure the preferred model in your workspace settings.',
  },
  {
    q: 'How do I invite team members?',
    a: 'Go to Dashboard → Team. You can invite members by email and assign them roles: Admin, Editor, Member, or Viewer.',
  },
  {
    q: 'Is my content stored securely?',
    a: 'All content is stored in an encrypted Supabase database with row-level security. Only your workspace members can access your content.',
  },
  {
    q: 'Can I export my content?',
    a: 'Yes! Open any content item in the editor and use the export button to download as plain text or copy to clipboard.',
  },
];

const PRIORITY_COLORS = {
  low: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  urgent: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

const STATUS_ICONS = {
  open: AlertCircle,
  pending: Clock,
  resolved: CheckCircle,
  closed: CheckCircle,
};

export default function HelpPage() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'faq' | 'tickets'>('faq');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  type TicketForm = { subject: string; category: string; priority: 'low' | 'medium' | 'high' | 'urgent'; message: string };
  const emptyForm: TicketForm = { subject: '', category: 'general', priority: 'medium', message: '' };
  const [form, setForm] = useState<TicketForm>(emptyForm);

  useEffect(() => {
    if (!user) return;
    supabase.from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setTickets((data ?? []) as Ticket[]); setLoading(false); });
  }, [user]);

  const submit = async () => {
    if (!user || !form.subject.trim() || !form.message.trim()) {
      toast.error('Subject and message are required');
      return;
    }
    setSaving(true);
    const { data: ticket, error: ticketErr } = await supabase.from('support_tickets').insert({
      workspace_id: workspace?.id,
      user_id: user.id,
      subject: form.subject,
      category: form.category,
      priority: form.priority,
    }).select().single();

    if (ticketErr) { toast.error(ticketErr.message); setSaving(false); return; }

    await supabase.from('support_messages').insert({
      ticket_id: ticket.id,
      user_id: user.id,
      body: form.message,
    });

    setTickets(prev => [ticket as Ticket, ...prev]);
    toast.success('Support ticket submitted!');
    setShowForm(false);
    setForm(emptyForm);
    setActiveTab('tickets');
    setSaving(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Help & Support</h1>
            <p className="text-muted-foreground text-sm mt-1">Get answers to common questions or contact support.</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus size={15} /> New Ticket
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {(['faq', 'tickets'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              {tab === 'faq' ? <><HelpCircle size={14} /> FAQ</> : <><MessageSquare size={14} /> My Tickets {tickets.length > 0 && `(${tickets.length})`}</>}
            </button>
          ))}
        </div>

        {activeTab === 'faq' && (
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-accent/30 transition-colors">
                  <span className="font-medium text-sm">{faq.q}</span>
                  <HelpCircle size={15} className={`text-muted-foreground transition-transform ${expandedFaq === i ? 'rotate-90' : ''}`} />
                </button>
                {expandedFaq === i && (
                  <div className="px-5 pb-4 text-sm text-muted-foreground border-t border-border pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
            <div className="rounded-xl border border-border bg-card p-5 text-center mt-4">
              <p className="text-sm text-muted-foreground mb-3">Can't find what you're looking for?</p>
              <button onClick={() => { setActiveTab('tickets'); setShowForm(true); }}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                <MessageSquare size={14} /> Contact Support
              </button>
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-16 text-center">
              <MessageSquare size={28} className="mx-auto text-muted-foreground/40 mb-3" />
              <p className="font-medium mb-1">No support tickets</p>
              <p className="text-sm text-muted-foreground mb-4">Submit a ticket and our team will get back to you.</p>
              <button onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                <Plus size={14} /> Submit Ticket
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map(t => {
                const StatusIcon = STATUS_ICONS[t.status];
                return (
                  <div key={t.id} className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <StatusIcon size={16} className={t.status === 'resolved' || t.status === 'closed' ? 'text-green-500 mt-0.5' : 'text-muted-foreground mt-0.5'} />
                        <div>
                          <p className="font-medium text-sm">{t.subject}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 capitalize">{t.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${PRIORITY_COLORS[t.priority]}`}>
                          {t.priority}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground capitalize">
                          {t.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Submit Ticket Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Submit Support Ticket</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Subject *</label>
              <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                placeholder="Brief description of your issue"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5">Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full h-9 px-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  {['general', 'billing', 'technical', 'feature-request', 'bug'].map(c => (
                    <option key={c} value={c} className="capitalize">{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">Priority</label>
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' }))}
                  className="w-full h-9 px-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring capitalize">
                  {['low', 'medium', 'high', 'urgent'].map(p => (
                    <option key={p} value={p} className="capitalize">{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Message *</label>
              <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                rows={5} placeholder="Describe your issue in detail..."
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)}
                className="flex-1 h-9 rounded-lg border border-border text-sm hover:bg-accent transition-colors">
                Cancel
              </button>
              <button onClick={submit} disabled={saving}
                className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : 'Submit Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
