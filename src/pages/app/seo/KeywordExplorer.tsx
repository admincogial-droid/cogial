import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Keyword } from '@/types';
import { Search, Plus, Trash2, Loader2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function KeywordExplorer() {
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [researching, setResearching] = useState(false);

  useEffect(() => {
    if (!workspace) return;
    supabase.from('keywords').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false })
      .then(({ data }) => { setKeywords((data ?? []) as Keyword[]); setLoading(false); });
  }, [workspace]);

  const research = async () => {
    if (!searchTerm.trim() || !workspace || !user) return;
    setResearching(true);
    try {
      // Call edge function for keyword data
      const { data, error } = await supabase.functions.invoke('seo-keywords', {
        body: { keyword: searchTerm.trim(), workspaceId: workspace.id },
      });
      if (error || !data?.success) {
        // Fallback: save keyword without metrics
        const { data: kw } = await supabase.from('keywords').insert({
          workspace_id: workspace.id, user_id: user.id, keyword: searchTerm.trim(),
        }).select().single();
        if (kw) { setKeywords(prev => [kw as Keyword, ...prev]); toast.success('Keyword saved (SEO API not configured — metrics unavailable)'); }
      } else {
        const kw = data.data as Keyword;
        setKeywords(prev => [kw, ...prev]);
        toast.success('Keyword researched!');
      }
    } catch {
      toast.error('Research failed');
    }
    setResearching(false);
    setSearchTerm('');
  };

  const deleteKw = async (id: string) => {
    await supabase.from('keywords').delete().eq('id', id);
    setKeywords(prev => prev.filter(k => k.id !== id));
  };

  const intentColor = (intent: string | null) => {
    const m: Record<string, string> = { informational: 'text-blue-500', commercial: 'text-orange-500', transactional: 'text-green-500', navigational: 'text-purple-500' };
    return m[intent ?? ''] ?? 'text-muted-foreground';
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <div className="mb-6"><h1 className="text-2xl font-bold">Keyword Explorer</h1><p className="text-muted-foreground text-sm mt-1">Research and track target keywords.</p></div>
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && research()}
              placeholder="Enter a keyword to research…"
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button onClick={research} disabled={researching || !searchTerm.trim()}
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {researching ? <Loader2 size={14} className="animate-spin" /> : <><TrendingUp size={14} /> Research</>}
          </button>
        </div>

        {loading ? <div className="space-y-2">{Array.from({length:4}).map((_,i)=><div key={i} className="h-12 bg-muted animate-pulse rounded-xl"/>)}</div> :
          keywords.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-16 text-center">
              <Search size={28} className="mx-auto text-muted-foreground/40 mb-3" />
              <p className="font-medium mb-1">No keywords yet</p>
              <p className="text-sm text-muted-foreground">Search for a keyword above to get started.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Keyword</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">Volume</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Difficulty</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">CPC</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Intent</th>
                    <th className="px-4" />
                  </tr>
                </thead>
                <tbody>
                  {keywords.map(k => (
                    <tr key={k.id} className="border-b border-border/50 last:border-0 hover:bg-accent/20 transition-colors">
                      <td className="px-4 py-2.5 font-medium">{k.keyword}</td>
                      <td className="px-4 py-2.5 hidden sm:table-cell text-muted-foreground text-xs">{k.volume ? k.volume.toLocaleString() : '—'}</td>
                      <td className="px-4 py-2.5 hidden md:table-cell text-xs">
                        {k.difficulty != null ? (
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${k.difficulty}%` }} />
                            </div>
                            <span className="text-muted-foreground">{k.difficulty}</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-2.5 hidden lg:table-cell text-muted-foreground text-xs">{k.cpc ? `$${k.cpc.toFixed(2)}` : '—'}</td>
                      <td className={`px-4 py-2.5 text-xs capitalize font-medium ${intentColor(k.intent)}`}>{k.intent ?? '—'}</td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => deleteKw(k.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </DashboardLayout>
  );
}
