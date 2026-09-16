import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { KeywordCluster } from '@/types';
import {
  Plus,
  Trash2,
  Loader2,
  Target,
  Sparkles,
  Download,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

export default function KeywordClustering() {
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const [clusters, setClusters] = useState<KeywordCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [clustering, setClustering] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  // AI clustering input
  const [rawKeywords, setRawKeywords] = useState('');

  // Manual form
  const [manualForm, setManualForm] = useState({
    name: '',
    primary_keyword: '',
    keywords: '',
    intent: 'informational',
  });
  const [savingManual, setSavingManual] = useState(false);

  const loadClusters = async () => {
    if (!workspace) return;
    const { data } = await supabase
      .from('keyword_clusters')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false });

    if (data) setClusters(data as KeywordCluster[]);
    setLoading(false);
  };

  useEffect(() => {
    loadClusters();
  }, [workspace]);

  // AI Cluster Action
  const handleAiCluster = async () => {
    if (!rawKeywords.trim() || !workspace || !user) return;
    setClustering(true);

    try {
      const { data, error } = await supabase.functions.invoke('seo-tools', {
        body: {
          action: 'keyword_clustering',
          keywords: rawKeywords.split(/[\n,]+/).map(k => k.trim()).filter(Boolean),
          workspaceId: workspace.id,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Clustering failed');
      }

      const generatedClusters = data.data?.clusters || [];
      if (generatedClusters.length === 0) {
        toast.warning('No distinct clusters identified from keywords');
      } else {
        // Insert clusters to database
        const rowsToInsert = generatedClusters.map((c: any) => ({
          workspace_id: workspace.id,
          user_id: user.id,
          name: c.name,
          primary_keyword: c.primary_keyword,
          keywords: c.keywords || [],
          intent: c.intent || 'informational',
          priority: 0,
        }));

        const { data: savedRows, error: insertErr } = await supabase
          .from('keyword_clusters')
          .insert(rowsToInsert)
          .select();

        if (insertErr) throw insertErr;

        if (savedRows) {
          setClusters(prev => [...(savedRows as KeywordCluster[]), ...prev]);
        }
        toast.success(`Generated ${generatedClusters.length} keyword clusters!`);
        setShowAiModal(false);
        setRawKeywords('');
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Clustering failed');
    } finally {
      setClustering(false);
    }
  };

  // Manual Cluster Creation
  const handleManualSave = async () => {
    if (!workspace || !user || !manualForm.name || !manualForm.primary_keyword) {
      toast.error('Name and primary keyword are required');
      return;
    }
    setSavingManual(true);
    const kws = manualForm.keywords.split(',').map(k => k.trim()).filter(Boolean);

    const { data, error } = await supabase
      .from('keyword_clusters')
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        name: manualForm.name,
        primary_keyword: manualForm.primary_keyword,
        keywords: kws,
        intent: manualForm.intent,
        priority: 0,
      })
      .select()
      .single();

    if (error) {
      toast.error(error.message);
    } else {
      setClusters(prev => [data as KeywordCluster, ...prev]);
      setShowManualForm(false);
      setManualForm({ name: '', primary_keyword: '', keywords: '', intent: 'informational' });
      toast.success('Cluster created');
    }
    setSavingManual(false);
  };

  const deleteCluster = async (id: string) => {
    await supabase.from('keyword_clusters').delete().eq('id', id);
    setClusters(prev => prev.filter(c => c.id !== id));
    toast.success('Cluster deleted');
  };

  // Export CSV
  const exportCsv = () => {
    if (clusters.length === 0) return;
    const header = 'Cluster Name,Primary Keyword,Intent,Keywords Count,Keywords\n';
    const rows = clusters.map(c =>
      `"${c.name}","${c.primary_keyword}","${c.intent || ''}",${c.keywords?.length || 0},"${(c.keywords || []).join('; ')}"`
    ).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `keyword-clusters-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Exported clusters to CSV');
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Keyword Clusters</h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">
              Group related search queries into semantic topic clusters for content strategy.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {clusters.length > 0 && (
              <button
                onClick={exportCsv}
                className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border text-xs font-medium hover:bg-accent transition-colors"
              >
                <Download size={13} /> Export CSV
              </button>
            )}

            <button
              onClick={() => {
                setShowAiModal(true);
                setShowManualForm(false);
              }}
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Sparkles size={14} /> AI Cluster Generator
            </button>

            <button
              onClick={() => {
                setShowManualForm(v => !v);
                setShowAiModal(false);
              }}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border text-xs font-medium hover:bg-accent transition-colors"
            >
              <Plus size={14} /> Add Manual
            </button>
          </div>
        </div>

        {/* AI Cluster Modal / Form */}
        {showAiModal && (
          <div className="rounded-2xl border border-primary/40 bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Sparkles size={16} className="text-primary" /> AI Topic Cluster Engine
              </h2>
              <button onClick={() => setShowAiModal(false)} className="text-xs text-muted-foreground hover:text-foreground">✕ Close</button>
            </div>
            <p className="text-xs text-muted-foreground">
              Paste a raw list of keywords below (one per line or comma-separated). PressLine AI will analyze semantic intent, create clean thematic clusters, and assign primary keywords.
            </p>
            <textarea
              value={rawKeywords}
              onChange={e => setRawKeywords(e.target.value)}
              placeholder="e.g.&#10;best espresso machine&#10;espresso machine with grinder&#10;how to clean espresso machine&#10;cheap coffee maker vs espresso&#10;commercial espresso machine for home"
              rows={5}
              className="w-full p-3 rounded-xl border border-input bg-background text-xs focus:ring-2 focus:ring-ring outline-none font-mono"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAiModal(false)} className="h-8 px-3 rounded-lg border border-border text-xs hover:bg-accent">Cancel</button>
              <button
                onClick={handleAiCluster}
                disabled={clustering || !rawKeywords.trim()}
                className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
              >
                {clustering ? <><Loader2 size={12} className="animate-spin" /> Clustering Keywords…</> : 'Generate Clusters'}
              </button>
            </div>
          </div>
        )}

        {/* Manual Form */}
        {showManualForm && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
            <h2 className="font-semibold text-sm">New Custom Cluster</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Cluster Title</label>
                <input
                  value={manualForm.name}
                  onChange={e => setManualForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Home Espresso Guide"
                  className="w-full h-8 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Primary Keyword</label>
                <input
                  value={manualForm.primary_keyword}
                  onChange={e => setManualForm(p => ({ ...p, primary_keyword: e.target.value }))}
                  placeholder="best home espresso machine"
                  className="w-full h-8 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1">Related Keywords (comma-separated)</label>
                <input
                  value={manualForm.keywords}
                  onChange={e => setManualForm(p => ({ ...p, keywords: e.target.value }))}
                  placeholder="espresso grinder, manual espresso maker, coffee beans"
                  className="w-full h-8 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowManualForm(false)} className="h-8 px-3 rounded-lg border border-border text-xs hover:bg-accent">Cancel</button>
              <button
                onClick={handleManualSave}
                disabled={savingManual}
                className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
              >
                {savingManual ? 'Saving…' : 'Create Cluster'}
              </button>
            </div>
          </div>
        )}

        {/* Clusters List */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : clusters.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-16 text-center bg-card">
            <Target size={32} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-semibold text-base mb-1">No keyword clusters yet</p>
            <p className="text-xs text-muted-foreground mb-4">
              Group keywords automatically using our AI Cluster Generator.
            </p>
            <button
              onClick={() => setShowAiModal(true)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
            >
              <Sparkles size={14} /> Run AI Cluster Generator
            </button>
          </div>
        ) : (
          <div className="grid gap-3.5">
            {clusters.map(c => (
              <div
                key={c.id}
                className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-all shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-foreground">{c.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-primary font-medium capitalize">
                      {c.intent || 'informational'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Primary Keyword: <span className="font-medium text-foreground">{c.primary_keyword}</span>
                  </p>
                  {c.keywords && c.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {c.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="bg-accent px-2 py-0.5 rounded-md text-[11px] text-muted-foreground font-medium"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => deleteCluster(c.id)}
                    title="Delete cluster"
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
