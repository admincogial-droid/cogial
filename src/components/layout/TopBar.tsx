import { Bell, Search, Sun, Moon, Command } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { Notification } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const toggle = () => {
    document.documentElement.classList.toggle('dark');
    setDark(d => !d);
    localStorage.setItem('np_theme', dark ? 'light' : 'dark');
  };
  return (
    <button onClick={toggle} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user) return;
    supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setNotifications(data as Notification[]); });
  }, [user]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const iconColor: Record<string, string> = {
    success: 'text-green-500', info: 'text-blue-500', warning: 'text-yellow-500', error: 'text-red-500'
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
        <Bell size={16} />
        {unread > 0 && <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }} transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-popover shadow-xl z-50">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold">Notifications</h3>
              {unread > 0 && <span className="text-xs text-muted-foreground">{unread} unread</span>}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground p-6">No notifications yet</p>
              ) : notifications.map(n => (
                <button key={n.id} onClick={() => markRead(n.id)}
                  className={cn('w-full text-left p-3 hover:bg-accent border-b border-border/50 transition-colors last:border-0',
                    !n.read && 'bg-accent/50')}>
                  <p className={cn('text-xs font-semibold', iconColor[n.type])}>{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                  <p className="text-[10px] text-muted-foreground/60 mt-1">{formatRelativeTime(n.created_at)}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TopBar() {
  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-30 flex items-center px-4 md:px-6 gap-3">
      <div className="flex-1 flex items-center gap-3">
        {/* Spacer for mobile menu button */}
        <div className="w-8 lg:hidden" />
        <button className="hidden md:flex items-center gap-2 h-8 px-3 rounded-lg border border-border bg-muted/50 text-sm text-muted-foreground hover:bg-accent transition-colors w-64">
          <Search size={14} />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="flex items-center gap-1 text-[10px] bg-background border border-border rounded px-1.5 py-0.5">
            <Command size={9} /><span>K</span>
          </kbd>
        </button>
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <NotificationBell />
      </div>
    </header>
  );
}
