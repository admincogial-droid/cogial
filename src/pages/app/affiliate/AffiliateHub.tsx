import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Link2, Plus, Copy, BarChart3, Loader2, ExternalLink, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';

interface AffiliateLink {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  slug: string;
  destination_url: string;
  affiliate_url: string;
  notes: string | null;
  click_count: number;
  is_active: boolean;
  created_at: string;
}

export default function AffiliateHub() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const emptyForm = { name: '', slug: '', destination_url: '', affiliate_url: '', notes: '' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!workspace) return;
    const load = async () => {
      const { data } = await supabase.from('affiliate_links')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false });
      const ls = (data ?? []) as AffiliateLink[];
      setLinks(ls);
      setTotalClicks(ls.reduce((s, l) => s + l.click_count, 0));
      setLoading(false);
    };
    load();
  }, [workspace]);

  const save = async () => {
    if (!workspace || !user) return;
    if (!form.name.trim() || !form.destination_url.trim() || !form.slug.trim()) {
      toast.error('Name, slug and destination URL are required');
      return;
    }
    setSaving(true);
    const slug = form.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const { data, error } = await supabase.from('affiliate_links').insert({
      workspace_id: workspace.id, user_id: user.id,
      name: form.name, slug, destination_url: form.destination_url,
      affiliate_url: form.affiliate_url || form.destination_url,
      notes: form.notes,
    }).select().single();
    if (error) { toast.error(error.message); }
    else {
      setLinks(prev => [data as AffiliateLink, ...prev]);
      toast.success('Link created');
      setShowForm(false);
      setForm(emptyForm);
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this affiliate link?')) return;
    await supabase.from('affiliate_links').delete().eq('id', id);
    setLinks(prev => prev.filter(l => l.id !== id));
    toast.success('Link deleted');
  };

  const toggle = async (l: AffiliateLink) => {
    await supabase.from('affiliate_links').update({ is_active: !l.is_active }).eq('id', l.id);
    setLinks(prev => prev.map(x => x.id === l.id ? { ...x, is_active: !x.is_active } : x));
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const trackingBase = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/affiliate-redirect`;

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Affiliate Hub</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage and track your affiliate links.</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus size={15} /> New Link
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Links', value: links.length, icon: Link2 },
            { label: 'Total Clicks', value: totalClicks, icon: BarChart3 },
            { label: 'Active Links', value: links.filter(l => l.is_active).length, icon: ToggleRight },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={15} className="text-primary" />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            );
          })}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}
          </div>
        ) : links.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-16 text-center">
            <Link2 size={28} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-medium mb-1">No affiliate links yet</p>
            <p className="text-sm text-muted-foreground mb-4">Create your first trackable affiliate link.</p>
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus size={14} /> Create Link
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Tracking URL</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Clicks</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4" />
                </tr>
              </thead>
              <tbody>
                {links.map(l => {
                  const trackUrl = `${trackingBase}?id=${l.id}`;
                  return (
                    <tr key={l.id} className="border-b border-border/50 last:border-0 hover:bg-accent/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm">{l.name}</p>
                        <a href={l.destination_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                          {l.destination_url.slice(0, 40)}{l.destination_url.length > 40 ? '…' : ''}
                          <ExternalLink size={10} />
                        </a>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground truncate max-w-[200px]">
                            {trackUrl.slice(0, 50)}…
                          </code>
                          <button onClick={() => copy(trackUrl, l.id)}
                            className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground">
                            <Copy size={12} className={copied === l.id ? 'text-green-500' : ''} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{l.click_count}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggle(l)}
                          className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${l.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                          {l.is_active ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                          {l.is_active ? 'Active' : 'Paused'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => remove(l.id)}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">New Affiliate Link</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Link Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Bluehost Hosting"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Slug (URL identifier) *</label>
              <input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
                placeholder="e.g. bluehost"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Destination URL *</label>
              <input value={form.destination_url} onChange={e => setForm(p => ({ ...p, destination_url: e.target.value }))}
                placeholder="https://bluehost.com"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Affiliate URL (optional)</label>
              <input value={form.affiliate_url} onChange={e => setForm(p => ({ ...p, affiliate_url: e.target.value }))}
                placeholder="Your affiliate link with tracking code"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                rows={2} placeholder="Internal notes about this link..."
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)}
                className="flex-1 h-9 rounded-lg border border-border text-sm hover:bg-accent transition-colors">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Create Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
