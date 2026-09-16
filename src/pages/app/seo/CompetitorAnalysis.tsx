import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Globe, Plus, Loader2, Trash2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface Analysis {
  id: string;
  workspace_id: string;
  user_id: string;
  domain: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result: Record<string, unknown> | null;
  created_at: string;
}

export default function CompetitorAnalysis() {
  const { user } = useAuth();
  const { workspace, credits } = useWorkspace();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [domain, setDomain] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!workspace) return;
    supabase.from('competitor_analyses')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setAnalyses((data ?? []) as Analysis[]); setLoading(false); });
  }, [workspace]);

  const analyze = async () => {
    if (!domain.trim() || !workspace || !user) return;
    if (credits < 5) { toast.error('You need at least 5 credits for competitor analysis'); return; }

    setAnalyzing(true);
    // Create record
    const { data: record, error: recErr } = await supabase.from('competitor_analyses').insert({
      workspace_id: workspace.id, user_id: user.id,
      domain: domain.trim(), status: 'processing',
    }).select().single();
    if (recErr) { toast.error(recErr.message); setAnalyzing(false); return; }

    setAnalyses(prev => [record as Analysis, ...prev]);

    try {
      // Call AI edge function for competitor analysis
      const { data: resData, error } = await supabase.functions.invoke('ai-generate', {
        body: {
          type: 'custom',
          workspaceId: workspace.id,
          systemPrompt: `You are a digital marketing analyst. Analyze the provided competitor domain and provide actionable insights. Output ONLY raw JSON without any markdown formatting. The JSON must have exactly these fields: "domain_overview" (string), "likely_content_topics" (array of strings), "content_strategy_insights" (string), "keyword_opportunities" (array of strings), "content_gaps" (array of strings), "tone_analysis" (string), "recommendations" (array of strings), "disclaimer" (string).`,
          userPrompt: `Analyze this competitor domain: ${domain.trim()}. Provide comprehensive content strategy insights.`,
          creditCost: 5,
        }
      });

      if (error || !resData?.success) {
        throw new Error(resData?.error?.message || error?.message || 'Analysis failed');
      }

      // Try parsing the returned content
      let result;
      try {
        const cleaned = resData.data.content.replace(/^```json\n?/, '').replace(/```$/, '').trim();
        result = JSON.parse(cleaned);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON', resData.data.content);
        throw new Error('AI returned an invalid format. Please try again.');
      }

      await supabase.from('competitor_analyses')
        .update({ status: 'completed', result, completed_at: new Date().toISOString() })
        .eq('id', record.id);

      setAnalyses(prev => prev.map(a => a.id === record.id ? { ...a, status: 'completed', result } : a));
      setExpandedId(record.id);
      toast.success('Analysis complete!');
    } catch (e: unknown) {
      await supabase.from('competitor_analyses')
        .update({ status: 'failed', error: (e as Error).message })
        .eq('id', record.id);
      setAnalyses(prev => prev.map(a => a.id === record.id ? { ...a, status: 'failed' } : a));
      toast.error('Analysis failed');
    }

    setAnalyzing(false);
    setDomain('');
  };

  const remove = async (id: string) => {
    await supabase.from('competitor_analyses').delete().eq('id', id);
    setAnalyses(prev => prev.filter(a => a.id !== id));
    toast.success('Removed');
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Competitor Analysis</h1>
          <p className="text-muted-foreground text-sm mt-1">AI-powered content strategy insights for competitor domains.</p>
        </div>

        {/* Note */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 mb-6 text-xs text-amber-800 dark:text-amber-400">
          <strong>Note:</strong> Analysis is AI-generated based on the domain name. This is not a live crawl. Results provide strategic content insights and opportunities, not verified traffic data.
        </div>

        {/* Input */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={domain} onChange={e => setDomain(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && analyze()}
              placeholder="Enter competitor domain e.g. competitor.com"
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button onClick={analyze} disabled={analyzing || !domain.trim()}
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {analyzing ? <><Loader2 size={14} className="animate-spin" /> Analyzing…</> : <><Sparkles size={14} /> Analyze (5 credits)</>}
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}
          </div>
        ) : analyses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-16 text-center">
            <Globe size={28} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-medium mb-1">No analyses yet</p>
            <p className="text-sm text-muted-foreground">Enter a competitor domain above to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.map(a => {
              const result = a.result as Record<string, unknown> | null;
              return (
                <div key={a.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Globe size={16} className="text-primary flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{a.domain}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${
                          a.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          a.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-700' :
                          'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700'
                        }`}>{a.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.status === 'completed' && (
                        <button onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                          className="flex items-center gap-1 text-xs text-primary hover:underline">
                          {expandedId === a.id ? <><ChevronUp size={12} /> Hide</> : <><ChevronDown size={12} /> View</>}
                        </button>
                      )}
                      <button onClick={() => remove(a.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {expandedId === a.id && result && (
                    <div className="border-t border-border p-5 space-y-4">
                      {Boolean(result.disclaimer) && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 italic">{String(result.disclaimer)}</p>
                      )}
                      {Boolean(result.domain_overview) && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Domain Overview</h4>
                          <p className="text-sm">{String(result.domain_overview)}</p>
                        </div>
                      )}
                      {Array.isArray(result.likely_content_topics) && result.likely_content_topics.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Likely Content Topics</h4>
                          <div className="flex flex-wrap gap-2">
                            {(result.likely_content_topics as string[]).map((t, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{String(t)}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {Boolean(result.content_strategy_insights) && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Content Strategy</h4>
                          <p className="text-sm text-muted-foreground">{String(result.content_strategy_insights)}</p>
                        </div>
                      )}
                      {Array.isArray(result.content_gaps) && result.content_gaps.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Content Gaps & Opportunities</h4>
                          <ul className="space-y-1">
                            {(result.content_gaps as string[]).map((g, i) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span> {String(g)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {Array.isArray(result.recommendations) && result.recommendations.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recommendations</h4>
                          <ul className="space-y-1">
                            {(result.recommendations as string[]).map((r, i) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span> {String(r)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
