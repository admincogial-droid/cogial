import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { AffiliateLink, AffiliateCampaign } from '@/types';
import { toast } from 'sonner';
import { Plus, Link2, Copy, Trash2, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react';
import { formatRelativeTime, slugify } from '@/lib/utils';

export default function AffiliateLinks() {
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [campaigns, setCampaigns] = useState<AffiliateCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', destination_url: '', affiliate_url: '', campaign_id: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!workspace) return;
    Promise.all([
      supabase.from('affiliate_links').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false }),
      supabase.from('affiliate_campaigns').select('*').eq('workspace_id', workspace.id),
    ]).then(([l, c]) => {
      setLinks((l.data ?? []) as AffiliateLink[]);
      setCampaigns((c.data ?? []) as AffiliateCampaign[]);
      setLoading(false);
    });
  }, [workspace]);

  const save = async () => {
    if (!workspace || !user) return;
    if (!form.name || !form.destination_url || !form.affiliate_url) { toast.error('Fill in required fields'); return; }
    setSaving(true);
    const slug = slugify(form.name) + '-' + Date.now().toString(36);
    const { data, error } = await supabase.from('affiliate_links').insert({
      workspace_id: workspace.id, user_id: user.id,
      name: form.name, slug, destination_url: form.destination_url,
      affiliate_url: form.affiliate_url,
      campaign_id: form.campaign_id || null, notes: form.notes || null,
    }).select().single();
    if (error) toast.error(error.message);
    else { setLinks(prev => [data as AffiliateLink, ...prev]); setShowForm(false); setForm({ name: '', destination_url: '', affiliate_url: '', campaign_id: '', notes: '' }); toast.success('Link created'); }
    setSaving(false);
  };

  const toggleActive = async (link: AffiliateLink) => {
    await supabase.from('affiliate_links').update({ is_active: !link.is_active }).eq('id', link.id);
    setLinks(prev => prev.map(l => l.id === link.id ? { ...l, is_active: !l.is_active } : l));
  };

  const deleteLink = async (id: string) => {
    if (!confirm('Delete this link?')) return;
    await supabase.from('affiliate_links').delete().eq('id', id);
    setLinks(prev => prev.filter(l => l.id !== id));
    toast.success('Deleted');
  };

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success('Copied!'); };

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Affiliate Links</h1>
            <p className="text-muted-foreground text-sm mt-1">Create trackable affiliate links and monitor clicks.</p>
          </div>
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus size={14} /> New Link
          </button>
        </div>

        {showForm && (
          <div className="rounded-xl border border-border bg-card p-5 mb-6">
            <h3 className="font-semibold mb-4 text-sm">Create Affiliate Link</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium mb-1.5">Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Bluehost Hosting"
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">Campaign</label>
                <select value={form.campaign_id} onChange={e => setForm(p => ({ ...p, campaign_id: e.target.value }))}
                  className="w-full h-9 px-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">No campaign</option>
                  {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">Destination URL *</label>
                <input value={form.destination_url} onChange={e => setForm(p => ({ ...p, destination_url: e.target.value }))} placeholder="https://product.com/page"
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">Affiliate URL *</label>
                <input value={form.affiliate_url} onChange={e => setForm(p => ({ ...p, affiliate_url: e.target.value }))} placeholder="https://affiliate.com/ref=123"
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={save} disabled={saving}
                className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {saving ? 'Creating…' : 'Create Link'}
              </button>
              <button onClick={() => setShowForm(false)} className="h-9 px-4 rounded-lg border border-border text-sm hover:bg-accent">Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}</div>
        ) : links.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-16 text-center">
            <Link2 size={32} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-medium mb-1">No affiliate links yet</p>
            <p className="text-sm text-muted-foreground">Create your first trackable link above.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {links.map(link => (
              <div key={link.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-accent/20 transition-colors">
                <div className={`h-2 w-2 rounded-full flex-shrink-0 ${link.is_active ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{link.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{link.affiliate_url}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="hidden sm:block">{link.click_count} clicks</span>
                  <span className="hidden md:block">{formatRelativeTime(link.created_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => copy(link.affiliate_url)} title="Copy" className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                    <Copy size={13} />
                  </button>
                  <a href={link.affiliate_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                    <ExternalLink size={13} />
                  </a>
                  <button onClick={() => toggleActive(link)} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                    {link.is_active ? <ToggleRight size={14} className="text-green-500" /> : <ToggleLeft size={14} />}
                  </button>
                  <button onClick={() => deleteLink(link.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={13} />
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
