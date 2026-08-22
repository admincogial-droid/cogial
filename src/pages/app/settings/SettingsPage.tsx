import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { User, Building2, Bell, Shield, Key, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { workspace } = useWorkspace();
  const [tab, setTab] = useState<'profile' | 'workspace' | 'security'>('profile');
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [wsName, setWsName] = useState(workspace?.name ?? '');
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
    if (error) toast.error(error.message); else { await refreshProfile(); toast.success('Profile updated'); }
    setSaving(false);
  };

  const saveWorkspace = async () => {
    if (!workspace) return;
    setSaving(true);
    const { error } = await supabase.from('workspaces').update({ name: wsName }).eq('id', workspace.id);
    if (error) toast.error(error.message); else toast.success('Workspace updated');
    setSaving(false);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'workspace', label: 'Workspace', icon: Building2 },
    { id: 'security', label: 'Security', icon: Shield },
  ] as const;

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
        <div className="flex gap-1 mb-6 border-b border-border">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'profile' && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="font-semibold text-sm">Profile Information</h2>
            <div>
              <label className="block text-xs font-medium mb-1.5">Full Name</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Email</label>
              <input value={user?.email ?? ''} disabled
                className="w-full h-9 px-3 rounded-lg border border-input bg-muted text-sm text-muted-foreground cursor-not-allowed" />
            </div>
            <button onClick={saveProfile} disabled={saving}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 size={14} className="animate-spin" /> : 'Save Profile'}
            </button>
          </div>
        )}

        {tab === 'workspace' && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="font-semibold text-sm">Workspace Settings</h2>
            <div>
              <label className="block text-xs font-medium mb-1.5">Workspace Name</label>
              <input value={wsName} onChange={e => setWsName(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Workspace Slug</label>
              <input value={workspace?.slug ?? ''} disabled
                className="w-full h-9 px-3 rounded-lg border border-input bg-muted text-sm text-muted-foreground cursor-not-allowed" />
            </div>
            <button onClick={saveWorkspace} disabled={saving}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 size={14} className="animate-spin" /> : 'Save Workspace'}
            </button>
          </div>
        )}

        {tab === 'security' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold text-sm mb-1">Password</h2>
              <p className="text-xs text-muted-foreground mb-4">Change your account password.</p>
              <button onClick={() => toast.info('Use "Forgot Password" from the login page to reset.')}
                className="h-9 px-4 rounded-lg border border-border text-sm hover:bg-accent transition-colors">
                Change Password
              </button>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold text-sm mb-1 text-destructive">Danger Zone</h2>
              <p className="text-xs text-muted-foreground mb-4">Permanently delete your account and all data.</p>
              <button onClick={() => toast.error('Contact support to delete your account.')}
                className="h-9 px-4 rounded-lg border border-destructive/50 text-sm text-destructive hover:bg-destructive/10 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
