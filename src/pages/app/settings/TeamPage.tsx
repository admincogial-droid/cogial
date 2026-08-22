import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { WorkspaceMember } from '@/types';
import { Plus, Trash2, Mail, Crown, Shield, Edit, User } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

const ROLE_CONFIG = {
  owner: { label: 'Owner', icon: Crown, color: 'text-yellow-500' },
  admin: { label: 'Admin', icon: Shield, color: 'text-violet-500' },
  editor: { label: 'Editor', icon: Edit, color: 'text-blue-500' },
  member: { label: 'Member', icon: User, color: 'text-green-500' },
  viewer: { label: 'Viewer', icon: User, color: 'text-muted-foreground' },
};

export default function TeamPage() {
  const { workspace, members, canAdmin } = useWorkspace();
  const { user } = useAuth();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);

  const invite = async () => {
    if (!workspace || !user || !inviteEmail.trim()) return;
    setInviting(true);
    const { error } = await supabase.from('workspace_invitations').insert({
      workspace_id: workspace.id,
      email: inviteEmail.trim(),
      role: inviteRole,
      invited_by: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    if (error) toast.error(error.message);
    else { toast.success(`Invitation sent to ${inviteEmail}`); setInviteEmail(''); }
    setInviting(false);
  };

  const removeMember = async (memberId: string) => {
    if (!confirm('Remove this member?')) return;
    const { error } = await supabase.from('workspace_members').delete().eq('id', memberId);
    if (error) toast.error(error.message);
    else { toast.success('Member removed'); window.location.reload(); }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-muted-foreground text-sm mt-1">{members.length} member{members.length !== 1 ? 's' : ''} in {workspace?.name}</p>
        </div>

        {canAdmin && (
          <div className="rounded-xl border border-border bg-card p-5 mb-6">
            <h2 className="font-semibold text-sm mb-4">Invite Team Member</h2>
            <div className="flex gap-3 flex-wrap">
              <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@company.com" type="email"
                className="flex-1 min-w-48 h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                className="h-9 px-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {['admin','editor','member','viewer'].map(r => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
              <button onClick={invite} disabled={inviting || !inviteEmail.trim()}
                className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                <Mail size={13} /> {inviting ? 'Sending…' : 'Send Invite'}
              </button>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Members</h2>
          </div>
          {members.map(m => {
            const roleConf = ROLE_CONFIG[m.role] ?? ROLE_CONFIG.member;
            const RoleIcon = roleConf.icon;
            const isMe = m.user_id === user?.id;
            return (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                  {m.user_id.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{isMe ? 'You' : m.user_id.slice(0, 8) + '…'}</p>
                  <p className="text-xs text-muted-foreground">Joined {formatDate(m.created_at)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <RoleIcon size={12} className={roleConf.color} />
                  <span className={`text-xs font-medium capitalize ${roleConf.color}`}>{roleConf.label}</span>
                </div>
                {canAdmin && !isMe && m.role !== 'owner' && (
                  <button onClick={() => removeMember(m.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
