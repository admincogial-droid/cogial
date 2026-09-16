import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useContents, useDeleteContent } from '@/hooks/useContent';
import { useProjects } from '@/hooks/useProjects';
import { supabase } from '@/lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import type { Content, ContentStatus } from '@/types';
import { formatRelativeTime, formatNumber } from '@/lib/utils';
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Edit,
  Star,
  Copy,
  Archive,
  ChevronLeft,
  ChevronRight,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground border-border',
  generating: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  generated: 'bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800',
  editing: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  approved: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  scheduled: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  publishing: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
  published: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
  failed: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  archived: 'bg-muted/70 text-muted-foreground/70 border-border',
};

const ALL_STATUSES = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Drafts' },
  { id: 'published', label: 'Published' },
  { id: 'archived', label: 'Archived' },
];

export default function ContentLibrary() {
  const { workspace } = useWorkspace();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContentStatus | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  const { data: projects = [] } = useProjects(workspace?.id);

  const { data, isLoading: loading, refetch } = useContents(workspace?.id, {
    status: statusFilter,
    search,
    projectId: projectFilter || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const deleteMutation = useDeleteContent();

  const contents = data?.contents || [];
  const total = data?.totalCount || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const toggleFavorite = async (c: Content) => {
    await supabase.from('contents').update({ is_favorite: !c.is_favorite }).eq('id', c.id);
    refetch();
  };

  const duplicateContent = async (c: Content) => {
    if (!workspace) return;
    // Fetch full body first
    const { data: full } = await supabase.from('contents').select('*').eq('id', c.id).single();
    if (!full) return toast.error('Could not duplicate');

    const { error } = await supabase.from('contents').insert({
      workspace_id: workspace.id,
      user_id: full.user_id,
      project_id: full.project_id,
      title: `${full.title} (Copy)`,
      type: full.type,
      status: 'draft',
      body: full.body,
      word_count: full.word_count,
    });

    if (error) toast.error('Duplication failed');
    else {
      toast.success('Article duplicated');
      refetch();
    }
  };

  const togglePublish = async (c: Content) => {
    const newStatus = c.status === 'published' ? 'draft' : 'published';
    const { error } = await supabase
      .from('contents')
      .update({
        status: newStatus,
        published_at: newStatus === 'published' ? new Date().toISOString() : null,
      })
      .eq('id', c.id);

    if (error) toast.error('Status update failed');
    else {
      toast.success(newStatus === 'published' ? 'Marked as published' : 'Reverted to draft');
      refetch();
    }
  };

  const toggleArchive = async (c: Content) => {
    const newStatus = c.status === 'archived' ? 'draft' : 'archived';
    await supabase.from('contents').update({ status: newStatus }).eq('id', c.id);
    toast.success(newStatus === 'archived' ? 'Moved to archive' : 'Restored from archive');
    refetch();
  };

  const handleDelete = async (id: string) => {
    if (!workspace) return;
    if (!confirm('Permanently delete this content? This cannot be undone.')) return;

    try {
      await deleteMutation.mutateAsync({ id, workspaceId: workspace.id });
      toast.success('Article deleted');
    } catch {
      toast.error('Failed to delete article');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Content Library</h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">
              {total} total articles and drafts in workspace
            </p>
          </div>
          <Link
            to="/dashboard/ai-writer"
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 self-start sm:self-auto transition-colors shadow-sm"
          >
            <Plus size={15} /> Create New Article
          </Link>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2.5 items-center flex-1 min-w-[280px]">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Search articles by title or keyword…"
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring outline-none"
              />
            </div>

            {/* Project Filter */}
            {projects.length > 0 && (
              <select
                value={projectFilter}
                onChange={e => {
                  setProjectFilter(e.target.value);
                  setPage(0);
                }}
                className="h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none"
              >
                <option value="">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex gap-1 p-1 bg-card border border-border rounded-xl shadow-sm">
            {ALL_STATUSES.map(s => (
              <button
                key={s.id}
                onClick={() => {
                  setStatusFilter(s.id as any);
                  setPage(0);
                }}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors capitalize ${
                  statusFilter === s.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Table (Low-Bandwidth Projected Rows) */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : contents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-16 text-center bg-card">
            <FileText size={36} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-semibold text-base mb-1">No articles found</p>
            <p className="text-xs text-muted-foreground mb-4">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your filters or search query.'
                : 'Start generating and managing publication-ready articles.'}
            </p>
            <Link
              to="/dashboard/ai-writer"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus size={14} /> Open AI Writer
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Type</th>
                    <th className="px-4 py-3 hidden md:table-cell">Words</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Updated</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {contents.map((c, i) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-accent/30 transition-colors group"
                    >
                      <td className="px-4 py-3 max-w-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleFavorite(c)}
                            title="Toggle favorite"
                            className={`flex-shrink-0 transition-colors ${
                              c.is_favorite ? 'text-amber-500' : 'text-muted-foreground/30 hover:text-amber-400'
                            }`}
                          >
                            <Star size={14} fill={c.is_favorite ? 'currentColor' : 'none'} />
                          </button>
                          <Link
                            to={`/dashboard/content/${c.id}`}
                            className="font-medium hover:text-primary truncate transition-colors text-foreground"
                          >
                            {c.title}
                          </Link>
                        </div>
                      </td>

                      <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground capitalize">
                        {c.type}
                      </td>

                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                        {formatNumber(c.word_count)}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize ${
                            STATUS_COLORS[c.status] || STATUS_COLORS.draft
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                        {formatRelativeTime(c.updated_at)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => togglePublish(c)}
                            title={c.status === 'published' ? 'Revert to draft' : 'Publish'}
                            className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Send size={13} />
                          </button>

                          <button
                            onClick={() => duplicateContent(c)}
                            title="Duplicate"
                            className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Copy size={13} />
                          </button>

                          <button
                            onClick={() => toggleArchive(c)}
                            title={c.status === 'archived' ? 'Restore' : 'Archive'}
                            className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Archive size={13} />
                          </button>

                          <Link
                            to={`/dashboard/content/${c.id}`}
                            title="Edit"
                            className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Edit size={13} />
                          </Link>

                          <button
                            onClick={() => handleDelete(c.id)}
                            title="Delete"
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-muted/10 text-xs">
                <span className="text-muted-foreground">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="h-7 w-7 rounded border border-border flex items-center justify-center hover:bg-accent disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="px-2 font-medium">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="h-7 w-7 rounded border border-border flex items-center justify-center hover:bg-accent disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
