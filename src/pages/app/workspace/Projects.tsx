import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Plus, Layers, Trash2, Edit2, Loader2, X, FileText, CheckCircle, ArchiveIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatRelativeTime } from '@/lib/utils';

interface Project {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  description: string | null;
  domain: string | null;
  is_archived: boolean;
  created_at: string;
  content_count?: number;
}

export default function Projects() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const [projects, setProjects] = useState<Project[]>([]);
  const [contentCounts, setContentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const emptyForm = { name: '', description: '', domain: '' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!workspace) return;
    const load = async () => {
      const { data: ps } = await supabase.from('projects')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false });

      if (ps) {
        setProjects(ps as Project[]);
        // Get content counts per project
        const ids = ps.map((p: Project) => p.id);
        if (ids.length > 0) {
          const { data: counts } = await supabase
            .from('contents')
            .select('project_id')
            .in('project_id', ids)
            .eq('workspace_id', workspace.id);
          const map: Record<string, number> = {};
          (counts ?? []).forEach((c: { project_id: string | null }) => {
            if (c.project_id) map[c.project_id] = (map[c.project_id] ?? 0) + 1;
          });
          setContentCounts(map);
        }
      }
      setLoading(false);
    };
    load();
  }, [workspace]);

  const openNew = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };

  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description ?? '', domain: p.domain ?? '' });
    setShowForm(true);
  };

  const save = async () => {
    if (!workspace || !user || !form.name.trim()) {
      toast.error('Project name is required');
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('projects').update({
        name: form.name, description: form.description, domain: form.domain,
        updated_at: new Date().toISOString(),
      }).eq('id', editing.id);
      if (error) { toast.error(error.message); } else {
        setProjects(prev => prev.map(p => p.id === editing.id ? { ...p, ...form } : p));
        toast.success('Project updated');
        setShowForm(false);
      }
    } else {
      const { data, error } = await supabase.from('projects').insert({
        workspace_id: workspace.id, user_id: user.id,
        name: form.name, description: form.description, domain: form.domain,
      }).select().single();
      if (error) { toast.error(error.message); } else {
        setProjects(prev => [data as Project, ...prev]);
        toast.success('Project created');
        setShowForm(false);
      }
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this project? All content inside will be unassigned.')) return;
    await supabase.from('projects').delete().eq('id', id);
    setProjects(prev => prev.filter(p => p.id !== id));
    toast.success('Project deleted');
  };

  const toggleArchive = async (p: Project) => {
    await supabase.from('projects').update({ is_archived: !p.is_archived }).eq('id', p.id);
    setProjects(prev => prev.map(x => x.id === p.id ? { ...x, is_archived: !x.is_archived } : x));
    toast.success(p.is_archived ? 'Project restored' : 'Project archived');
  };

  const filtered = projects.filter(p => p.is_archived === showArchived);

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-muted-foreground text-sm mt-1">Organize your content into projects.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowArchived(!showArchived)}
              className={`flex items-center gap-2 h-9 px-3 rounded-lg text-sm border transition-all ${showArchived ? 'bg-muted border-border' : 'border-border hover:bg-accent'}`}>
              <ArchiveIcon size={14} /> {showArchived ? 'Active' : 'Archived'}
            </button>
            <button onClick={openNew}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus size={15} /> New Project
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-16 text-center">
            <Layers size={28} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-medium mb-1">{showArchived ? 'No archived projects' : 'No projects yet'}</p>
            {!showArchived && (
              <>
                <p className="text-sm text-muted-foreground mb-4">Create a project to organize your content.</p>
                <button onClick={openNew}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  <Plus size={14} /> Create Project
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => (
              <div key={p.id} className="rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Layers size={16} className="text-primary" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => toggleArchive(p)} className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" title={p.is_archived ? 'Restore' : 'Archive'}>
                      <ArchiveIcon size={12} />
                    </button>
                    <button onClick={() => remove(p.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <Link to={`/dashboard/projects/${p.id}`} className="font-semibold text-sm mb-1 truncate block hover:text-primary transition-colors">
                  {p.name}
                </Link>
                {p.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{p.description}</p>}
                {p.domain && <p className="text-[10px] text-muted-foreground mb-3">{p.domain}</p>}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FileText size={12} />
                    <span>{contentCounts[p.id] ?? 0} articles</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link to={`/dashboard/content?project=${p.id}`}
                      className="text-xs text-muted-foreground hover:text-foreground">
                      Articles
                    </Link>
                    <Link to={`/dashboard/projects/${p.id}`}
                      className="text-xs text-primary font-medium hover:underline">
                      Manage →
                    </Link>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">{formatRelativeTime(p.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{editing ? 'Edit Project' : 'New Project'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Project Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Company Blog, Product Reviews"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={2} placeholder="What is this project about?"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Domain (optional)</label>
              <input value={form.domain} onChange={e => setForm(p => ({ ...p, domain: e.target.value }))}
                placeholder="e.g. https://myblog.com"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)}
                className="flex-1 h-9 rounded-lg border border-border text-sm hover:bg-accent transition-colors">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
