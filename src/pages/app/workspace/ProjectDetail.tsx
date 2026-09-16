import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useProject } from '@/hooks/useProjects';
import { useContents } from '@/hooks/useContent';
import { supabase } from '@/lib/supabase';
import { formatNumber, formatRelativeTime } from '@/lib/utils';
import {
  ArrowLeft,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Globe,
  Archive,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { workspace } = useWorkspace();
  const { data: project, isLoading: loadingProject } = useProject(id);

  const { data: contentData, isLoading: loadingContent, refetch } = useContents(workspace?.id, {
    projectId: id,
    pageSize: 50,
  });

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState('');

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setDomain(project.domain || '');
    }
  }, [project]);

  const contents = contentData?.contents || [];
  const draftCount = contents.filter(c => c.status !== 'published').length;
  const publishedCount = contents.filter(c => c.status === 'published').length;
  const totalWords = contents.reduce((acc, c) => acc + (c.word_count || 0), 0);

  const saveDetails = async () => {
    if (!id || !name.trim()) return;
    const { error } = await supabase
      .from('projects')
      .update({
        name: name.trim(),
        description: description.trim() || null,
        domain: domain.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update project');
    } else {
      toast.success('Project updated');
      setEditing(false);
    }
  };

  const deleteProject = async () => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this project? Associated content will be unassigned.')) return;

    // Unassign content
    await supabase.from('contents').update({ project_id: null }).eq('project_id', id);
    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete project');
    } else {
      toast.success('Project deleted');
      navigate('/dashboard/projects');
    }
  };

  if (loadingProject) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-32 bg-muted animate-pulse rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto text-center py-20 bg-card border border-border rounded-xl">
          <Layers size={36} className="mx-auto text-muted-foreground/30 mb-3" />
          <h2 className="font-bold text-lg">Project not found</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-4">The project may have been deleted or moved.</p>
          <Link to="/dashboard/projects" className="text-xs font-semibold text-primary hover:underline">
            ← Return to Projects
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb & Actions */}
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/dashboard/projects"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} /> Back to Projects
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(v => !v)}
              className="h-8 px-3 rounded-lg border border-border text-xs font-medium hover:bg-accent flex items-center gap-1.5 transition-colors"
            >
              <Edit2 size={12} /> {editing ? 'Cancel' : 'Edit Project'}
            </button>
            <button
              onClick={deleteProject}
              className="h-8 px-3 rounded-lg border border-border text-xs font-medium hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center gap-1.5 transition-colors"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>

        {/* Project Header Info */}
        <div className="p-6 bg-card border border-border rounded-2xl shadow-sm space-y-4">
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Project Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm font-semibold outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Description</label>
                <input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Domain / Website URL</label>
                <input
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  placeholder="e.g. mysite.com"
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                onClick={saveDetails}
                className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
              >
                Save Changes
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <Layers size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">{project.name}</h1>
                  {project.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{project.description}</p>
                  )}
                </div>
              </div>

              {project.domain && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Globe size={13} className="text-primary" />
                  <a href={`https://${project.domain.replace(/^https?:\/\//, '')}`} target="_blank" rel="noreferrer" className="hover:underline">
                    {project.domain}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Project Metrics Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border">
            <div className="p-3 bg-muted/20 border border-border/70 rounded-xl">
              <span className="text-[11px] text-muted-foreground">Total Content</span>
              <p className="text-lg font-bold mt-0.5">{contents.length}</p>
            </div>
            <div className="p-3 bg-muted/20 border border-border/70 rounded-xl">
              <span className="text-[11px] text-muted-foreground">Published</span>
              <p className="text-lg font-bold mt-0.5 text-green-600">{publishedCount}</p>
            </div>
            <div className="p-3 bg-muted/20 border border-border/70 rounded-xl">
              <span className="text-[11px] text-muted-foreground">Drafts</span>
              <p className="text-lg font-bold mt-0.5 text-amber-600">{draftCount}</p>
            </div>
            <div className="p-3 bg-muted/20 border border-border/70 rounded-xl">
              <span className="text-[11px] text-muted-foreground">Total Words</span>
              <p className="text-lg font-bold mt-0.5">{formatNumber(totalWords)}</p>
            </div>
          </div>
        </div>

        {/* Content in Project */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight">Project Content</h2>
            <Link
              to="/dashboard/ai-writer"
              className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
            >
              <Plus size={13} /> Draft in Project
            </Link>
          </div>

          {loadingContent ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : contents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center bg-card">
              <FileText size={28} className="mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm font-semibold">No content assigned to this project yet</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                Create new articles in AI Writer and assign them to this project.
              </p>
              <Link
                to="/dashboard/ai-writer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                <Plus size={13} /> Create Article Now
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm divide-y divide-border/60">
              {contents.map(c => (
                <div
                  key={c.id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-accent/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/dashboard/content/${c.id}`}
                      className="text-xs font-semibold hover:text-primary transition-colors truncate block"
                    >
                      {c.title}
                    </Link>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {formatNumber(c.word_count)} words · {formatRelativeTime(c.updated_at)}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize ${
                      c.status === 'published'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
