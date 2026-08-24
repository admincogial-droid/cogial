import { cn } from '@/lib/utils';
import { brand } from '@/config/brand';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCredits } from '@/lib/utils';
import {
  LayoutDashboard, PenSquare, Layers, FileText, Search, BarChart3,
  Link2, Zap, Globe, LineChart, CreditCard, Settings, HelpCircle,
  LogOut, ChevronDown, Plus, Users, ChevronRight, Sparkles,
  BookTemplate, Mic2, Cpu, X, Menu, Wrench, History,
  PenTool, Megaphone, Share2, Youtube, Video, Target, Palette, Volume2, Image as ImageIcon
} from 'lucide-react';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/dashboard/analytics', label: 'Analytics', icon: LineChart },
    ],
  },
  {
    label: 'Create',
    items: [
      { to: '/dashboard/ai-writer', label: 'AI Writer', icon: PenSquare },
      { to: '/dashboard/bulk', label: 'Bulk Generator', icon: Layers },
      { to: '/dashboard/content', label: 'Content Library', icon: FileText },
      { to: '/dashboard/templates', label: 'Templates', icon: BookTemplate },
      { to: '/dashboard/brand-voice', label: 'Brand Voice', icon: Mic2 },
    ],
  },
  {
    label: 'AI Tools',
    items: [
      { to: '/dashboard/tools', label: 'All Tools', icon: Wrench, end: true },
      { to: '/dashboard/history', label: 'History', icon: History },
      { to: '/dashboard/tools?category=writing', label: 'Writing', icon: PenTool },
      { to: '/dashboard/tools?category=marketing', label: 'Marketing', icon: Megaphone },
      { to: '/dashboard/tools?category=social', label: 'Social Media', icon: Share2 },
      { to: '/dashboard/tools?category=youtube', label: 'YouTube', icon: Youtube },
      { to: '/dashboard/tools?category=video', label: 'Video', icon: Video },
      { to: '/dashboard/tools?category=seo', label: 'SEO', icon: Target },
      { to: '/dashboard/tools?category=creative', label: 'Creative', icon: Palette },
      { to: '/dashboard/tools?category=voice', label: 'Voice', icon: Volume2 },
      { to: '/dashboard/tools?category=images', label: 'Images', icon: ImageIcon },
    ],
  },
  {
    label: 'SEO',
    items: [
      { to: '/dashboard/seo/keywords', label: 'Keyword Explorer', icon: Search },
      { to: '/dashboard/seo/clusters', label: 'Keyword Clusters', icon: BarChart3 },
      { to: '/dashboard/seo/competitors', label: 'Competitor Analysis', icon: Globe },
    ],
  },
  {
    label: 'Affiliate',
    items: [
      { to: '/dashboard/affiliate', label: 'Affiliate Hub', icon: Link2 },
    ],
  },
  {
    label: 'Automate',
    items: [
      { to: '/dashboard/automation', label: 'Automation', icon: Zap },
      { to: '/dashboard/integrations', label: 'Integrations', icon: Cpu },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { to: '/dashboard/projects', label: 'Projects', icon: Layers },
      { to: '/dashboard/team', label: 'Team', icon: Users },
      { to: '/dashboard/billing', label: 'Billing', icon: CreditCard },
      { to: '/dashboard/settings', label: 'Settings', icon: Settings },
      { to: '/dashboard/help', label: 'Help', icon: HelpCircle },
    ],
  },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, profile, signOut } = useAuth();
  const { workspace, workspaces, credits, switchWorkspace, createWorkspace, subscription } = useWorkspace();
  const [wsOpen, setWsOpen] = useState(false);
  const navigate = useNavigate();

  const creditsLimit = subscription?.credits_limit ?? 100;
  const creditsUsed = subscription?.credits_used ?? 0;
  const creditPct = creditsLimit > 0 ? Math.min((creditsUsed / creditsLimit) * 100, 100) : 0;

  const handleSignOut = async () => { await signOut(); navigate('/'); };
  const initials = (profile?.full_name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="font-bold text-sm">{brand.name}</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Workspace Selector */}
      <div className="px-3 py-3 border-b border-sidebar-border">
        <button
          onClick={() => setWsOpen(!wsOpen)}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-sidebar-accent text-sm transition-colors"
        >
          <div className="h-6 w-6 rounded bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
            {workspace?.name?.[0]?.toUpperCase() ?? 'W'}
          </div>
          <span className="flex-1 text-left truncate font-medium text-xs">{workspace?.name ?? 'Select workspace'}</span>
          <ChevronDown size={14} className={cn('transition-transform', wsOpen && 'rotate-180')} />
        </button>
        <AnimatePresence>
          {wsOpen && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="mt-1 rounded-lg border border-sidebar-border bg-sidebar-accent overflow-hidden">
              {workspaces.map(ws => (
                <button key={ws.id} onClick={() => { switchWorkspace(ws.id); setWsOpen(false); }}
                  className={cn('w-full text-left px-3 py-2 text-xs hover:bg-sidebar-accent-foreground/10 flex items-center gap-2 transition-colors',
                    ws.id === workspace?.id && 'text-primary font-medium')}>
                  <div className="h-5 w-5 rounded bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {ws.name[0].toUpperCase()}
                  </div>
                  <span className="truncate">{ws.name}</span>
                  {ws.id === workspace?.id && <ChevronRight size={12} className="ml-auto" />}
                </button>
              ))}
              <button onClick={async () => { const n = prompt('Workspace name'); if (n) { await createWorkspace(n); setWsOpen(false); } }}
                className="w-full text-left px-3 py-2 text-xs text-primary hover:bg-sidebar-accent-foreground/10 flex items-center gap-2 border-t border-sidebar-border">
                <Plus size={12} /> New workspace
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-thin">
        {navGroups.map(group => (
          <div key={group.label}>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 mb-1">{group.label}</p>
            {group.items.map(item => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} to={item.to} end={'end' in item ? item.end : false}
                  onClick={onClose}
                  className={({ isActive }) => cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  )}>
                  <Icon size={15} />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Credit Meter */}
      <div className="px-4 py-3 border-t border-sidebar-border">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="text-sidebar-foreground/60">AI Credits</span>
          <span className="font-medium text-sidebar-foreground">{formatCredits(credits)} left</span>
        </div>
        <div className="h-1.5 bg-sidebar-accent rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${100 - creditPct}%` }} />
        </div>
        {creditPct > 80 && (
          <NavLink to="/dashboard/billing"
            className="mt-2 block text-center text-[11px] py-1.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors">
            Upgrade Plan
          </NavLink>
        )}
      </div>

      {/* User */}
      <div className="px-3 py-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors">
          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{profile?.full_name || user?.email}</p>
            <p className="text-[10px] text-sidebar-foreground/50 capitalize">{profile?.plan ?? 'free'} plan</p>
          </div>
          <button onClick={handleSignOut} title="Sign out" className="text-sidebar-foreground/40 hover:text-destructive transition-colors">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden p-2 rounded-lg bg-card border border-border shadow-sm"
      >
        <Menu size={18} />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 xl:w-60 shrink-0 flex-col border-r border-border h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden" />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden">
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
