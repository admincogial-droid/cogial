import DashboardLayout from '@/components/layout/DashboardLayout';
import { useState, useEffect } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Automation } from '@/types';
import { Plus, Trash2, ToggleLeft, ToggleRight, Zap, Play } from 'lucide-react';
import { toast } from 'sonner';
import { formatRelativeTime } from '@/lib/utils';

const TRIGGERS = [
  { id: 'schedule_daily', label: 'Every day' },
  { id: 'schedule_weekly', label: 'Every week' },
  { id: 'keyword_added', label: 'When keyword added' },
  { id: 'content_approved', label: 'When content approved' },
  { id: 'manual', label: 'Manual trigger' },
];

export default function AutomationPage() {
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', trigger: 'manual' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!workspace) return;
    supabase.from('automations').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false })
      .then(({ data }) => { setAutomations((data ?? []) as Automation[]); setLoading(false); });
  }, [workspace]);

  const save = async () => {
    if (!workspace || !user || !form.name) { toast.error('Name is required'); return; }
    setSaving(true);
    const { data, error } = await supabase.from('automations').insert({
      workspace_id: workspace.id, user_id: user.id,
      name: form.name, description: form.description || null,
      trigger: form.trigger, steps: [], enabled: false,
    }).select().single();
    if (error) toast.error(error.message);
    else { setAutomations(prev => [data as Automation, ...prev]); setShowForm(false); setForm({ name: '', description: '', trigger: 'manual' }); toast.success('Automation created'); }
    setSaving(false);
  };

  const toggle = async (a: Automation) => {
    await supabase.from('automations').update({ enabled: !a.enabled }).eq('id', a.id);
    setAutomations(prev => prev.map(x => x.id === a.id ? { ...x, enabled: !a.enabled } : x));
  };

  const del = async (id: string) => {
    if (!confirm('Delete this automation?')) return;
    await supabase.from('automations').delete().eq('id', id);
    setAutomations(prev => prev.filter(a => a.id !== id));
    toast.success('Deleted');
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold">Automation</h1><p className="text-muted-foreground text-sm mt-1">Automate repetitive content tasks.</p></div>
          <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus size={14} /> New Automation
          </button>
        </div>

        {showForm && (
          <div className="rounded-xl border border-border bg-card p-5 mb-6 space-y-3">
            <h3 className="text-sm font-semibold">New Automation</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="Daily article generation"
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Trigger</label>
                <select value={form.trigger} onChange={e => setForm(p => ({...p, trigger: e.target.value}))} className="w-full h-9 px-2 rounded-lg border border-input bg-background text-sm focus:outline-none">
                  {TRIGGERS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1">Description</label>
                <input value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="What does this automation do?"
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={save} disabled={saving} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                {saving ? 'Creating…' : 'Create'}
              </button>
              <button onClick={() => setShowForm(false)} className="h-9 px-4 rounded-lg border border-border text-sm hover:bg-accent">Cancel</button>
            </div>
          </div>
        )}

        {loading ? <div className="space-y-2">{Array.from({length:3}).map((_,i)=><div key={i} className="h-20 bg-muted animate-pulse rounded-xl"/>)}</div> :
          automations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-16 text-center">
              <Zap size={28} className="mx-auto text-muted-foreground/40 mb-3" />
              <p className="font-medium mb-1">No automations yet</p>
              <p className="text-sm text-muted-foreground">Create your first automation to save time.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {automations.map(a => (
                <div key={a.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
                  <div className={`h-2 w-2 rounded-full flex-shrink-0 ${a.enabled ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{TRIGGERS.find(t => t.id === a.trigger)?.label ?? a.trigger} · {a.run_count} runs {a.last_run_at ? `· Last: ${formatRelativeTime(a.last_run_at)}` : ''}</p>
                    {a.description && <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggle(a)} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                      {a.enabled ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} />}
                    </button>
                    <button onClick={() => del(a.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </DashboardLayout>
  );
}
