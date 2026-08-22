import DashboardLayout from '@/components/layout/DashboardLayout';
import { useState, useEffect } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { KeywordCluster } from '@/types';
import { Plus, Trash2, Loader2, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function KeywordClustering() {
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const [clusters, setClusters] = useState<KeywordCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', primary_keyword: '', keywords: '', intent: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!workspace) return;
    supabase.from('keyword_clusters').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false })
      .then(({ data }) => { setClusters((data ?? []) as KeywordCluster[]); setLoading(false); });
  }, [workspace]);

  const save = async () => {
    if (!workspace || !user || !form.name || !form.primary_keyword) { toast.error('Fill required fields'); return; }
    setSaving(true);
    const kws = form.keywords.split(',').map(k => k.trim()).filter(Boolean);
    const { data, error } = await supabase.from('keyword_clusters').insert({
      workspace_id: workspace.id, user_id: user.id,
      name: form.name, primary_keyword: form.primary_keyword,
      keywords: kws, intent: form.intent || null, priority: 0,
    }).select().single();
    if (error) toast.error(error.message);
    else { setClusters(prev => [data as KeywordCluster, ...prev]); setShowForm(false); setForm({ name: '', primary_keyword: '', keywords: '', intent: '' }); toast.success('Cluster created'); }
    setSaving(false);
  };

  const del = async (id: string) => {
    await supabase.from('keyword_clusters').delete().eq('id', id);
    setClusters(prev => prev.filter(c => c.id !== id));
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold">Keyword Clusters</h1><p className="text-muted-foreground text-sm mt-1">Group related keywords into content clusters.</p></div>
          <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus size={14} /> New Cluster
          </button>
        </div>
        {showForm && (
          <div className="rounded-xl border border-border bg-card p-5 mb-6 space-y-3">
            <h3 className="text-sm font-semibold">New Cluster</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Cluster Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="e.g. Home Coffee Setup"
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Primary Keyword *</label>
                <input value={form.primary_keyword} onChange={e => setForm(p => ({...p, primary_keyword: e.target.value}))} placeholder="best espresso machine"
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1">Related Keywords (comma-separated)</label>
                <input value={form.keywords} onChange={e => setForm(p => ({...p, keywords: e.target.value}))} placeholder="home espresso machine, espresso machine reviews, ..."
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Intent</label>
                <select value={form.intent} onChange={e => setForm(p => ({...p, intent: e.target.value}))} className="w-full h-9 px-2 rounded-lg border border-input bg-background text-sm focus:outline-none">
                  <option value="">— none —</option>
                  {['informational','commercial','transactional','navigational'].map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={save} disabled={saving} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {saving ? 'Creating…' : 'Create'}
              </button>
              <button onClick={() => setShowForm(false)} className="h-9 px-4 rounded-lg border border-border text-sm hover:bg-accent">Cancel</button>
            </div>
          </div>
        )}
        {loading ? <div className="space-y-2">{Array.from({length:3}).map((_,i)=><div key={i} className="h-20 bg-muted animate-pulse rounded-xl"/>)}</div> :
          clusters.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-16 text-center">
              <Target size={28} className="mx-auto text-muted-foreground/40 mb-3" />
              <p className="font-medium mb-1">No keyword clusters yet</p>
              <p className="text-sm text-muted-foreground">Create a cluster to organize your content strategy.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clusters.map(c => (
                <div key={c.id} className="rounded-xl border border-border bg-card p-4 flex gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{c.name}</p>
                      {c.intent && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary capitalize">{c.intent}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Primary: <span className="text-foreground font-medium">{c.primary_keyword}</span></p>
                    <div className="flex flex-wrap gap-1">
                      {(c.keywords as string[]).slice(0, 8).map((k, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border">{k}</span>
                      ))}
                      {(c.keywords as string[]).length > 8 && <span className="text-[10px] text-muted-foreground">+{(c.keywords as string[]).length - 8}</span>}
                    </div>
                  </div>
                  <button onClick={() => del(c.id)} className="p-1.5 h-fit rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </DashboardLayout>
  );
}
