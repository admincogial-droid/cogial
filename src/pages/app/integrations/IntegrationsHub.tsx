import DashboardLayout from '@/components/layout/DashboardLayout';
import { useState, useEffect } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Integration } from '@/types';
import { Plus, Trash2, Cpu, Globe, Code2, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const INTEGRATION_TYPES = [
  { type: 'wordpress', label: 'WordPress', icon: Globe, desc: 'Publish directly to WordPress sites via REST API' },
  { type: 'blogger', label: 'Blogger', icon: Globe, desc: 'Publish to Google Blogger blogs' },
  { type: 'webhook', label: 'Webhook', icon: Code2, desc: 'Send content to any webhook URL' },
  { type: 'api', label: 'API', icon: Cpu, desc: 'Custom API endpoint integration' },
];

const statusIcon = (s: string) => ({
  connected: <CheckCircle2 size={14} className="text-green-500" />,
  disconnected: <XCircle size={14} className="text-muted-foreground" />,
  error: <AlertCircle size={14} className="text-red-500" />,
  needs_reauth: <AlertCircle size={14} className="text-yellow-500" />,
})[s] ?? null;

export default function IntegrationsHub() {
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!workspace) return;
    supabase.from('integrations').select('*').eq('workspace_id', workspace.id)
      .then(({ data }) => { setIntegrations((data ?? []) as Integration[]); setLoading(false); });
  }, [workspace]);

  const save = async () => {
    if (!workspace || !user || !adding) return;
    setSaving(true);
    const { data, error } = await supabase.from('integrations').insert({
      workspace_id: workspace.id, user_id: user.id,
      type: adding as Integration['type'],
      name: form.name || adding,
      config: form,
      status: 'connected',
    }).select().single();
    if (error) toast.error(error.message);
    else { setIntegrations(prev => [data as Integration, ...prev]); setAdding(null); setForm({}); toast.success('Integration connected'); }
    setSaving(false);
  };

  const del = async (id: string) => {
    if (!confirm('Remove this integration?')) return;
    await supabase.from('integrations').delete().eq('id', id);
    setIntegrations(prev => prev.filter(i => i.id !== id));
    toast.success('Removed');
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="mb-6"><h1 className="text-2xl font-bold">Integrations</h1><p className="text-muted-foreground text-sm mt-1">Connect NovaPilot to your publishing platforms.</p></div>

        {/* Available integrations */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {INTEGRATION_TYPES.map(t => {
            const Icon = t.icon;
            const connected = integrations.find(i => i.type === t.type);
            return (
              <div key={t.type} className={`rounded-xl border p-4 ${connected ? 'border-green-500/30 bg-green-500/5' : 'border-border bg-card'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className="text-primary" />
                    <p className="font-semibold text-sm">{t.label}</p>
                  </div>
                  {connected && statusIcon(connected.status)}
                </div>
                <p className="text-xs text-muted-foreground mb-3">{t.desc}</p>
                {connected ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium capitalize">{connected.status}</span>
                    <button onClick={() => del(connected.id)} className="text-xs text-muted-foreground hover:text-destructive transition-colors">Disconnect</button>
                  </div>
                ) : (
                  <button onClick={() => setAdding(t.type)}
                    className="w-full h-8 rounded-lg border border-border text-xs font-medium hover:border-primary/50 hover:bg-accent transition-all">
                    Connect
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Connection form */}
        {adding && (
          <div className="rounded-xl border border-border bg-card p-5 mb-6">
            <h3 className="text-sm font-semibold mb-4">Connect {INTEGRATION_TYPES.find(t => t.type === adding)?.label}</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium mb-1">Name</label>
                <input value={form.name ?? ''} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder={`My ${adding} site`}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              {adding === 'wordpress' && <>
                <div>
                  <label className="block text-xs font-medium mb-1">Site URL</label>
                  <input value={form.site_url ?? ''} onChange={e => setForm(p => ({...p, site_url: e.target.value}))} placeholder="https://yoursite.com"
                    className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Application Password</label>
                  <input type="password" value={form.app_password ?? ''} onChange={e => setForm(p => ({...p, app_password: e.target.value}))} placeholder="xxxx xxxx xxxx xxxx"
                    className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </>}
              {adding === 'webhook' && (
                <div>
                  <label className="block text-xs font-medium mb-1">Webhook URL</label>
                  <input value={form.url ?? ''} onChange={e => setForm(p => ({...p, url: e.target.value}))} placeholder="https://hooks.example.com/..."
                    className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              )}
              {(adding === 'blogger' || adding === 'api') && (
                <div>
                  <label className="block text-xs font-medium mb-1">API Key / Token</label>
                  <input type="password" value={form.api_key ?? ''} onChange={e => setForm(p => ({...p, api_key: e.target.value}))} placeholder="Your API key"
                    className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={save} disabled={saving} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                {saving ? 'Connecting…' : 'Connect'}
              </button>
              <button onClick={() => { setAdding(null); setForm({}); }} className="h-9 px-4 rounded-lg border border-border text-sm hover:bg-accent">Cancel</button>
            </div>
          </div>
        )}

        {/* Active integrations */}
        {integrations.length > 0 && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border text-sm font-semibold">Active Integrations</div>
            {integrations.map(i => (
              <div key={i.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0">
                {statusIcon(i.status)}
                <div className="flex-1">
                  <p className="text-sm font-medium">{i.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{i.type} · {i.status}</p>
                </div>
                <button onClick={() => del(i.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
