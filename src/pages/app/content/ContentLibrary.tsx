import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useWorkspace } from '@/context/WorkspaceContext';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import type { Content, ContentStatus } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import { FileText, Plus, Search, Filter, MoreHorizontal, Trash2, Edit, Eye, Archive, Star } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const STATUS_COLORS: Record<ContentStatus, string> = {
  draft: 'bg-muted text-muted-foreground border-border',
  generating: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  generated: 'bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800',
  editing: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  approved: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
  scheduled: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  publishing: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
  published: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
  failed: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  archived: 'bg-muted text-muted-foreground border-border',
};

const ALL_STATUSES: ContentStatus[] = ['draft','generating','generated','editing','approved','scheduled','published','failed','archived'];

export default function ContentLibrary() {
  const { workspace } = useWorkspace();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContentStatus | 'all'>('all');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    if (!workspace) return;
    setLoading(true);
    let q = supabase.from('contents').select('*', { count: 'exact' })
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (statusFilter !== 'all') q = q.eq('status', statusFilter);
    if (search.trim()) q = q.ilike('title', `%${search}%`);
    const { data, count } = await q;
    setContents((data ?? []) as Content[]);
    setTotal(count ?? 0);
    setLoading(false);
  }, [workspace, page, statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  const toggleFavorite = async (c: Content) => {
    await supabase.from('contents').update({ is_favorite: !c.is_favorite }).eq('id', c.id);
    setContents(prev => prev.map(x => x.id === c.id ? { ...x, is_favorite: !c.is_favorite } : x));
  };

  const deleteContent = async (id: string) => {
    if (!confirm('Delete this content? This cannot be undone.')) return;
    const { error } = await supabase.from('contents').delete().eq('id', id);
    if (error) toast.error('Failed to delete'); else { toast.success('Deleted'); load(); }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Content Library</h1>
            <p className="text-muted-foreground text-sm mt-1">{total} articles total</p>
          </div>
          <Link to="/dashboard/ai-writer"
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus size={15} /> New Content
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search content..." className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setStatusFilter('all')}
              className={`px-3 h-9 rounded-lg text-xs font-medium border transition-colors ${statusFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'}`}>
              All
            </button>
            {(['draft','published','generating'] as ContentStatus[]).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 h-9 rounded-lg text-xs font-medium border transition-colors capitalize ${statusFilter === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-xl" />)}</div>
        ) : contents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-16 text-center">
            <FileText size={32} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-medium mb-1">No content yet</p>
            <p className="text-sm text-muted-foreground mb-4">Start by generating your first article.</p>
            <Link to="/dashboard/ai-writer" className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus size={14} /> Create content
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Words</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Updated</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {contents.map((c, i) => (
                  <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleFavorite(c)} className={`flex-shrink-0 ${c.is_favorite ? 'text-yellow-500' : 'text-muted-foreground/30 hover:text-yellow-400'}`}>
                          <Star size={13} fill={c.is_favorite ? 'currentColor' : 'none'} />
                        </button>
                        <Link to={`/dashboard/content/${c.id}`} className="font-medium hover:text-primary transition-colors truncate max-w-xs">
                          {c.title}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground capitalize text-xs">{c.type}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground text-xs">{c.word_count.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">{formatRelativeTime(c.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Link to={`/dashboard/content/${c.id}`} className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                          <Edit size={13} />
                        </Link>
                        <button onClick={() => deleteContent(c.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {total > PAGE_SIZE && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
                <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
                    className="px-3 py-1.5 rounded border border-border hover:bg-accent disabled:opacity-40">Previous</button>
                  <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= total}
                    className="px-3 py-1.5 rounded border border-border hover:bg-accent disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
