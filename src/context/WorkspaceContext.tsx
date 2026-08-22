import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import type { Workspace, WorkspaceMember, WorkspaceRole, Subscription } from '@/types';

interface WorkspaceContextValue {
  workspace: Workspace | null;
  workspaces: Workspace[];
  members: WorkspaceMember[];
  subscription: Subscription | null;
  credits: number;
  userRole: WorkspaceRole | null;
  loading: boolean;
  switchWorkspace: (id: string) => void;
  createWorkspace: (name: string) => Promise<Workspace>;
  refreshWorkspace: () => Promise<void>;
  canEdit: boolean;
  canAdmin: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  const userRole = members.find(m => m.user_id === user?.id)?.role ?? null;
  const canEdit = ['owner','admin','editor','member'].includes(userRole ?? '');
  const canAdmin = ['owner','admin'].includes(userRole ?? '');

  const loadWorkspaces = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('workspace_members')
      .select('workspace_id, workspaces(*)')
      .eq('user_id', user.id);

    if (data) {
      const ws = data.map((d: { workspaces: unknown }) => d.workspaces as Workspace).filter(Boolean);
      setWorkspaces(ws);
      const saved = localStorage.getItem('np_workspace_id');
      const active = ws.find(w => w.id === saved) ?? ws[0] ?? null;
      setWorkspace(active);
    }
    setLoading(false);
  }, [user]);

  const loadWorkspaceData = useCallback(async (wsId: string) => {
    const [{ data: mems }, { data: sub }, { data: bal }] = await Promise.all([
      supabase.from('workspace_members').select('*, profiles(*)').eq('workspace_id', wsId),
      supabase.from('subscriptions').select('*, plans(*)').eq('workspace_id', wsId).single(),
      supabase.from('credit_balances').select('balance').eq('workspace_id', wsId).single(),
    ]);
    if (mems) setMembers(mems as WorkspaceMember[]);
    if (sub) setSubscription(sub as Subscription);
    if (bal) setCredits(bal.balance);
  }, []);

  useEffect(() => { loadWorkspaces(); }, [loadWorkspaces]);
  useEffect(() => { if (workspace) loadWorkspaceData(workspace.id); }, [workspace, loadWorkspaceData]);

  const switchWorkspace = (id: string) => {
    const ws = workspaces.find(w => w.id === id);
    if (ws) { setWorkspace(ws); localStorage.setItem('np_workspace_id', id); }
  };

  const createWorkspace = async (name: string): Promise<Workspace> => {
    if (!user) throw new Error('Not authenticated');
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
    const { data, error } = await supabase.from('workspaces').insert({ name, slug, owner_id: user.id }).select().single();
    if (error) throw error;
    const ws = data as Workspace;
    setWorkspaces(prev => [...prev, ws]);
    setWorkspace(ws);
    localStorage.setItem('np_workspace_id', ws.id);
    return ws;
  };

  const refreshWorkspace = async () => {
    await loadWorkspaces();
    if (workspace) await loadWorkspaceData(workspace.id);
  };

  return (
    <WorkspaceContext.Provider value={{
      workspace, workspaces, members, subscription, credits,
      userRole, loading, switchWorkspace, createWorkspace, refreshWorkspace, canEdit, canAdmin,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return ctx;
}
