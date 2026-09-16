import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Plus, Mic2, Trash2, Edit2, Loader2, X } from 'lucide-react';

interface BrandVoice {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  tone: string | null;
  audience: string | null;
  do_rules: string | null;
  dont_rules: string | null;
  sample_text: string | null;
  preferred_phrases: string | null;
  forbidden_phrases: string | null;
  created_at: string;
}

const TONES = ['professional', 'friendly', 'casual', 'authoritative', 'conversational', 'witty', 'empathetic', 'bold'];

export default function BrandVoice() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const [voices, setVoices] = useState<BrandVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BrandVoice | null>(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    name: '', tone: 'professional', audience: '', do_rules: '', dont_rules: '',
    sample_text: '', preferred_phrases: '', forbidden_phrases: '',
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!workspace) return;
    supabase.from('brand_voices')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setVoices((data ?? []) as BrandVoice[]); setLoading(false); });
  }, [workspace]);

  const openNew = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };

  const openEdit = (v: BrandVoice) => {
    setEditing(v);
    setForm({
      name: v.name, tone: v.tone ?? 'professional', audience: v.audience ?? '',
      do_rules: v.do_rules ?? '', dont_rules: v.dont_rules ?? '',
      sample_text: v.sample_text ?? '', preferred_phrases: v.preferred_phrases ?? '',
      forbidden_phrases: v.forbidden_phrases ?? '',
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!workspace || !user || !form.name.trim()) {
      toast.error('Brand voice name is required');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name, tone: form.tone, audience: form.audience,
      do_rules: form.do_rules, dont_rules: form.dont_rules,
      sample_text: form.sample_text, preferred_phrases: form.preferred_phrases,
      forbidden_phrases: form.forbidden_phrases,
    };
    if (editing) {
      const { error } = await supabase.from('brand_voices').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editing.id);
      if (error) { toast.error(error.message); } else {
        setVoices(prev => prev.map(v => v.id === editing.id ? { ...v, ...payload } : v));
        toast.success('Brand voice updated');
        setShowForm(false);
      }
    } else {
      const { data, error } = await supabase.from('brand_voices').insert({
        workspace_id: workspace.id, user_id: user.id, ...payload,
      }).select().single();
      if (error) { toast.error(error.message); } else {
        setVoices(prev => [data as BrandVoice, ...prev]);
        toast.success('Brand voice created');
        setShowForm(false);
      }
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this brand voice?')) return;
    await supabase.from('brand_voices').delete().eq('id', id);
    setVoices(prev => prev.filter(v => v.id !== id));
    toast.success('Brand voice deleted');
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Brand Voice</h1>
            <p className="text-muted-foreground text-sm mt-1">Define your brand's unique communication style.</p>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus size={15} /> New Brand Voice
          </button>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : voices.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-16 text-center">
            <Mic2 size={32} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-medium mb-1">No brand voices yet</p>
            <p className="text-sm text-muted-foreground mb-4">Create a brand voice to maintain consistent AI-generated content.</p>
            <button onClick={openNew}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus size={14} /> Create Brand Voice
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {voices.map(v => (
              <div key={v.id} className="rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{v.name}</h3>
                    {v.tone && <span className="text-xs text-muted-foreground capitalize">{v.tone} tone</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => remove(v.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {v.audience && (
                  <div className="mb-2">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Audience</span>
                    <p className="text-xs mt-0.5">{v.audience}</p>
                  </div>
                )}

                {v.do_rules && (
                  <div className="mb-2">
                    <span className="text-[10px] font-medium text-green-600 uppercase tracking-wider">Do</span>
                    <p className="text-xs mt-0.5 text-muted-foreground line-clamp-2">{v.do_rules}</p>
                  </div>
                )}

                {v.dont_rules && (
                  <div className="mb-2">
                    <span className="text-[10px] font-medium text-red-500 uppercase tracking-wider">Don't</span>
                    <p className="text-xs mt-0.5 text-muted-foreground line-clamp-2">{v.dont_rules}</p>
                  </div>
                )}

                {v.sample_text && (
                  <div className="mt-3 p-2 bg-muted/50 rounded-lg">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Sample</span>
                    <p className="text-xs mt-0.5 line-clamp-2 italic">"{v.sample_text}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-2xl p-6 space-y-4 my-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{editing ? 'Edit Brand Voice' : 'New Brand Voice'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5">Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. PressLine Official"
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">Tone</label>
                <select value={form.tone} onChange={e => setForm(p => ({ ...p, tone: e.target.value }))}
                  className="w-full h-9 px-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring capitalize">
                  {TONES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5">Target Audience</label>
              <input value={form.audience} onChange={e => setForm(p => ({ ...p, audience: e.target.value }))}
                placeholder="e.g. Marketing professionals, small business owners"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-green-600">Writing Rules (Do)</label>
                <textarea value={form.do_rules} onChange={e => setForm(p => ({ ...p, do_rules: e.target.value }))}
                  rows={3} placeholder="Use active voice, include statistics, ask questions..."
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-red-500">Avoid (Don't)</label>
                <textarea value={form.dont_rules} onChange={e => setForm(p => ({ ...p, dont_rules: e.target.value }))}
                  rows={3} placeholder="Avoid jargon, don't be too formal, no passive voice..."
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5">Preferred Phrases</label>
                <textarea value={form.preferred_phrases} onChange={e => setForm(p => ({ ...p, preferred_phrases: e.target.value }))}
                  rows={2} placeholder="Words/phrases you like to use..."
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">Forbidden Phrases</label>
                <textarea value={form.forbidden_phrases} onChange={e => setForm(p => ({ ...p, forbidden_phrases: e.target.value }))}
                  rows={2} placeholder="Words/phrases to never use..."
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5">Sample Content</label>
              <textarea value={form.sample_text} onChange={e => setForm(p => ({ ...p, sample_text: e.target.value }))}
                rows={3} placeholder="Paste an example of content that perfectly matches your brand voice..."
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)}
                className="flex-1 h-9 rounded-lg border border-border text-sm hover:bg-accent transition-colors">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save Brand Voice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
