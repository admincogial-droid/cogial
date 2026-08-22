import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatNumber, formatRelativeTime } from '@/lib/utils';
import type { Content, Generation } from '@/types';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Sparkles, FileText, Globe, Link2, Zap, TrendingUp, Plus, ArrowRight, Loader2
} from 'lucide-react';

interface Stats {
  totalContent: number;
  wordsGenerated: number;
  published: number;
  affiliateClicks: number;
}

interface UsageDay { date: string; credits: number; items: number; }

export default function DashboardHome() {
  const { profile } = useAuth();
  const { workspace, credits, subscription } = useWorkspace();
  const [stats, setStats] = useState<Stats>({ totalContent: 0, wordsGenerated: 0, published: 0, affiliateClicks: 0 });
  const [recentContent, setRecentContent] = useState<Content[]>([]);
  const [recentGens, setRecentGens] = useState<Generation[]>([]);
  const [usageData, setUsageData] = useState<UsageDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspace) return;
    const load = async () => {
      setLoading(true);
      const [contentRes, genRes, clickRes] = await Promise.all([
        supabase.from('contents').select('id, word_count, status, title, type, created_at, updated_at, project_id, user_id, workspace_id, seo_score, readability_score, meta_title, meta_description, slug, tags, is_favorite')
          .eq('workspace_id', workspace.id).order('created_at', { ascending: false }).limit(100),
        supabase.from('generations').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('affiliate_clicks').select('id, created_at').in('link_id',
          (await supabase.from('affiliate_links').select('id').eq('workspace_id', workspace.id)).data?.map(l => l.id) ?? []),
      ]);

      const contents = (contentRes.data ?? []) as Content[];
      const gens = (genRes.data ?? []) as Generation[];

      setStats({
        totalContent: contents.length,
        wordsGenerated: contents.reduce((s, c) => s + c.word_count, 0),
        published: contents.filter(c => c.status === 'published').length,
        affiliateClicks: clickRes.data?.length ?? 0,
      });
      setRecentContent(contents.slice(0, 5));
      setRecentGens(gens.slice(0, 5));

      // Build 7-day usage chart
      const days: UsageDay[] = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const ds = d.toISOString().slice(0, 10);
        const dayGens = gens.filter(g => g.created_at.slice(0, 10) === ds);
        return { date: ds.slice(5), credits: dayGens.reduce((s, g) => s + g.credits_used, 0), items: dayGens.length };
      });
      setUsageData(days);
      setLoading(false);
    };
    load();
  }, [workspace]);

  const statCards = [
    { label: 'AI Credits Left', value: credits, icon: Sparkles, color: 'text-violet-500', link: '/dashboard/billing' },
    { label: 'Content Created', value: stats.totalContent, icon: FileText, color: 'text-blue-500', link: '/dashboard/content' },
    { label: 'Words Generated', value: formatNumber(stats.wordsGenerated), icon: TrendingUp, color: 'text-green-500', link: '/dashboard/analytics' },
    { label: 'Published Articles', value: stats.published, icon: Globe, color: 'text-indigo-500', link: '/dashboard/content' },
    { label: 'Affiliate Clicks', value: stats.affiliateClicks, icon: Link2, color: 'text-orange-500', link: '/dashboard/affiliate' },
  ];

  const quickActions = [
    { label: 'New Article', to: '/dashboard/ai-writer/article', icon: Zap, desc: 'AI-generated full article' },
    { label: 'AI Writer', to: '/dashboard/ai-writer', icon: Sparkles, desc: 'Open the AI workspace' },
    { label: 'Product Review', to: '/dashboard/ai-writer/review', icon: FileText, desc: 'Generate a review' },
    { label: 'Bulk Generate', to: '/dashboard/bulk', icon: Loader2, desc: 'Multiple articles at once' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},
            {' '}{profile?.full_name?.split(' ')[0] ?? 'there'} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {workspace?.name} · {subscription?.status === 'active' ? 'Active' : 'Free'} plan
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {statCards.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={s.link} className="block rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-accent/30 transition-all group">
                  <div className="flex items-center justify-between mb-3">
                    <Icon size={16} className={s.color} />
                    <ArrowRight size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {loading ? (
                    <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                  ) : (
                    <p className="text-xl font-bold">{typeof s.value === 'number' ? formatNumber(s.value) : s.value}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Usage Chart */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold text-sm mb-4">AI Credits Usage — Last 7 Days</h2>
            {loading ? (
              <div className="h-40 bg-muted animate-pulse rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={usageData}>
                  <defs>
                    <linearGradient id="gradC" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="credits" stroke="#8B5CF6" strokeWidth={2} fill="url(#gradC)" name="Credits used" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold text-sm mb-4">Quick Create</h2>
            <div className="space-y-2">
              {quickActions.map(a => {
                const Icon = a.icon;
                return (
                  <Link key={a.to} to={a.to}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-accent/40 transition-all group">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Icon size={15} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">{a.label}</p>
                      <p className="text-[11px] text-muted-foreground">{a.desc}</p>
                    </div>
                    <ArrowRight size={13} className="ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Content */}
        <div className="mt-6 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Recent Content</h2>
            <Link to="/dashboard/content" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
            ))}</div>
          ) : recentContent.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <FileText size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No content yet</p>
              <Link to="/dashboard/ai-writer" className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                <Plus size={12} /> Create your first article
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentContent.map(c => (
                <Link key={c.id} to={`/dashboard/content/${c.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/40 transition-colors group">
                  <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText size={14} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.word_count} words · {formatRelativeTime(c.created_at)}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                    c.status === 'published' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' :
                    c.status === 'draft' ? 'bg-muted text-muted-foreground border-border' :
                    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                  }`}>
                    {c.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
