import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Plus, BookTemplate, Trash2, Edit2, Copy, Loader2, X, Star, StarOff } from 'lucide-react';

interface Template {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string;
  content: string;
  variables: Record<string, string>;
  is_public: boolean;
  is_favorite: boolean;
  use_count: number;
  created_at: string;
}

const CATEGORIES = ['general', 'blog', 'social', 'email', 'marketing', 'seo', 'product'];

export default function Templates() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState('');

  const [form, setForm] = useState({
    name: '', description: '', category: 'general', content: '', is_public: false,
  });

  useEffect(() => {
    if (!workspace) return;
    supabase.from('templates')
      .select('*')
      .or(`workspace_id.eq.${workspace.id},is_public.eq.true`)
      .order('is_favorite', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data }) => { setTemplates((data ?? []) as Template[]); setLoading(false); });
  }, [workspace]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', description: '', category: 'general', content: '', is_public: false });
    setShowForm(true);
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    setForm({ name: t.name, description: t.description ?? '', category: t.category, content: t.content, is_public: t.is_public });
    setShowForm(true);
  };

  const save = async () => {
    if (!workspace || !user || !form.name.trim() || !form.content.trim()) {
      toast.error('Name and content are required');
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('templates').update({
        name: form.name, description: form.description, category: form.category,
        content: form.content, is_public: form.is_public, updated_at: new Date().toISOString(),
      }).eq('id', editing.id);
      if (error) { toast.error(error.message); } else {
        setTemplates(prev => prev.map(t => t.id === editing.id ? { ...t, ...form } : t));
        toast.success('Template updated');
        setShowForm(false);
      }
    } else {
      const { data, error } = await supabase.from('templates').insert({
        workspace_id: workspace.id, user_id: user.id,
        name: form.name, description: form.description, category: form.category,
        content: form.content, is_public: form.is_public,
      }).select().single();
      if (error) { toast.error(error.message); } else {
        setTemplates(prev => [data as Template, ...prev]);
        toast.success('Template created');
        setShowForm(false);
      }
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    await supabase.from('templates').delete().eq('id', id);
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success('Template deleted');
  };

  const duplicate = async (t: Template) => {
    if (!workspace || !user) return;
    const { data, error } = await supabase.from('templates').insert({
      workspace_id: workspace.id, user_id: user.id,
      name: `${t.name} (Copy)`, description: t.description, category: t.category,
      content: t.content, is_public: false,
    }).select().single();
    if (error) { toast.error(error.message); } else {
      setTemplates(prev => [data as Template, ...prev]);
      toast.success('Template duplicated');
    }
  };

  const toggleFav = async (t: Template) => {
    await supabase.from('templates').update({ is_favorite: !t.is_favorite }).eq('id', t.id);
    setTemplates(prev => prev.map(x => x.id === t.id ? { ...x, is_favorite: !x.is_favorite } : x));
  };

  const filtered = templates.filter(t => !filterCat || t.category === filterCat);

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Templates</h1>
            <p className="text-muted-foreground text-sm mt-1">Reusable content templates for your workspace.</p>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus size={15} /> New Template
          </button>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          <button onClick={() => setFilterCat('')}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${!filterCat ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/40'}`}>
            All
          </button>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all capitalize ${filterCat === c ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/40'}`}>
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-16 text-center">
            <BookTemplate size={28} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-medium mb-1">No templates yet</p>
            <p className="text-sm text-muted-foreground mb-4">Create your first reusable template.</p>
            <button onClick={openNew}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus size={14} /> Create Template
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(t => (
              <div key={t.id} className="rounded-xl border border-border bg-card p-5 flex flex-col group hover:border-primary/40 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium capitalize">{t.category}</span>
                  <button onClick={() => toggleFav(t)} className="text-muted-foreground hover:text-yellow-500 transition-colors">
                    {t.is_favorite ? <Star size={14} className="text-yellow-500" /> : <StarOff size={14} />}
                  </button>
                </div>
                <h3 className="font-semibold text-sm mb-1">{t.name}</h3>
                {t.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{t.description}</p>}
                <pre className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2 mt-auto mb-4 line-clamp-3 overflow-hidden whitespace-pre-wrap">{t.content.slice(0, 120)}{t.content.length > 120 ? '...' : ''}</pre>
                <div className="flex items-center gap-1 border-t border-border pt-3">
                  <button onClick={() => openEdit(t)} className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg hover:bg-accent transition-colors">
                    <Edit2 size={12} /> Edit
                  </button>
                  <button onClick={() => duplicate(t)} className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg hover:bg-accent transition-colors">
                    <Copy size={12} /> Duplicate
                  </button>
                  <button onClick={() => remove(t.id)} className="flex items-center justify-center gap-1 text-xs p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{editing ? 'Edit Template' : 'New Template'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. SEO Blog Article"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Description</label>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Brief description of this template"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full h-9 px-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring capitalize">
                {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Content / Prompt Template *</label>
              <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                rows={6} placeholder="Enter your template content. Use {{variable}} for dynamic fields."
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_public" checked={form.is_public}
                onChange={e => setForm(p => ({ ...p, is_public: e.target.checked }))}
                className="rounded border-border" />
              <label htmlFor="is_public" className="text-xs font-medium">Share with all workspaces</label>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)}
                className="flex-1 h-9 rounded-lg border border-border text-sm hover:bg-accent transition-colors">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
