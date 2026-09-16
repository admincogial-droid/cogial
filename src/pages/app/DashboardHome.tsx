import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatNumber, formatRelativeTime } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Sparkles,
  FileText,
  TrendingUp,
  Link2,
  CheckCircle,
  Plus,
  ArrowRight,
  BookTemplate,
  Layers,
  History,
} from 'lucide-react';

const TIMEFRAMES = [
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '90 Days' },
  { id: 'all', label: 'All Time' },
];

export default function DashboardHome() {
  const { profile } = useAuth();
  const { workspace } = useWorkspace();
  const [timeframe, setTimeframe] = useState('7d');

  const { data: metrics, isLoading: loading } = useDashboardMetrics(workspace?.id, timeframe);

  const creditsUsed = metrics?.credits_used ?? 0;
  const creditsLimit = metrics?.credits_limit ?? 100;
  const creditPct = creditsLimit > 0 ? Math.min((creditsUsed / creditsLimit) * 100, 100) : 0;

  const statCards = [
    {
      label: 'AI Credits Left',
      value: metrics?.credits_remaining ?? 0,
      icon: Sparkles,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
      link: '/dashboard/billing',
    },
    {
      label: 'Content Created',
      value: metrics?.content_created ?? 0,
      icon: FileText,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      link: '/dashboard/content',
    },
    {
      label: 'Words Generated',
      value: formatNumber(metrics?.words_generated ?? 0),
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      link: '/dashboard/analytics',
    },
    {
      label: 'Published Articles',
      value: metrics?.published_articles ?? 0,
      icon: CheckCircle,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      link: '/dashboard/content',
    },
    {
      label: 'Affiliate Clicks',
      value: metrics?.affiliate_clicks ?? 0,
      icon: Link2,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      link: '/dashboard/affiliate',
    },
  ];

  const quickActions = [
    { label: 'AI Writer', to: '/dashboard/ai-writer', icon: Sparkles, desc: 'Write long-form articles with AI' },
    { label: 'Bulk Generator', to: '/dashboard/bulk', icon: Layers, desc: 'Batch generate multiple articles' },
    { label: 'Content Library', to: '/dashboard/content', icon: FileText, desc: 'Manage your drafts and published work' },
    { label: 'Templates', to: '/dashboard/templates', icon: BookTemplate, desc: 'Pre-built content frameworks' },
  ];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Timeframe Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {greeting()}, {profile?.full_name?.split(' ')[0] ?? 'Creator'} 👋
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">
              {workspace?.name} · Enterprise-grade AI content workspace
            </p>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-card border border-border rounded-xl self-start sm:self-auto shadow-sm">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  timeframe === tf.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* 5 Real Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  to={card.link}
                  className="block rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm hover:bg-accent/20 transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`h-8 w-8 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                      <Icon size={16} className={card.color} />
                    </div>
                    <ArrowRight
                      size={13}
                      className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                  {loading ? (
                    <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                  ) : (
                    <p className="text-xl font-bold tracking-tight">
                      {typeof card.value === 'number' ? formatNumber(card.value) : card.value}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 font-medium">{card.label}</p>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Charts & Quick Actions Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Usage Chart */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-sm">AI Credit Usage Activity</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Aggregated consumption over period</p>
              </div>
              <Link to="/dashboard/analytics" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                Full analytics <ArrowRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="h-44 bg-muted animate-pulse rounded-lg" />
            ) : (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics?.daily_credit_usage || []}>
                    <defs>
                      <linearGradient id="presslineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="credits"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      fill="url(#presslineGrad)"
                      name="Credits Used"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Credit Quota Bar */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Monthly Credit Consumption</span>
                <span className="font-medium text-foreground">
                  {creditsUsed} / {creditsLimit} credits
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    creditPct > 80 ? 'bg-destructive' : 'bg-primary'
                  }`}
                  style={{ width: `${creditPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm flex flex-col">
            <h2 className="font-semibold text-sm mb-3">Quick Create</h2>
            <div className="space-y-2.5 flex-1">
              {quickActions.map(action => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/40 transition-all group"
                  >
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Icon size={16} className="text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold">{action.label}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{action.desc}</p>
                    </div>
                    <ArrowRight
                      size={13}
                      className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Content Table & Recent Generations Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Content */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-sm">Recent Content</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Articles and drafts created in workspace</p>
              </div>
              <Link to="/dashboard/content" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : !metrics?.recent_content?.length ? (
              <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
                <FileText size={28} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">No content created yet</p>
                <p className="text-xs text-muted-foreground mt-1">Start by drafting your first article with AI.</p>
                <Link
                  to="/dashboard/ai-writer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  <Plus size={13} /> Create Article
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5">
                {metrics.recent_content.map(c => (
                  <Link
                    key={c.id}
                    to={`/dashboard/content/${c.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/40 border border-transparent hover:border-border transition-all group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText size={15} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                        {c.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {formatNumber(c.word_count)} words · {formatRelativeTime(c.created_at)}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize flex-shrink-0 ${
                        c.status === 'published'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                          : c.status === 'draft'
                          ? 'bg-muted text-muted-foreground border-border'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent AI Generations */}
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-sm">Recent AI Runs</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Latest operations executed</p>
              </div>
              <Link to="/dashboard/history" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                History <ArrowRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : !metrics?.recent_generations?.length ? (
              <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
                <History size={26} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">No recent operations</p>
              </div>
            ) : (
              <div className="space-y-2">
                {metrics.recent_generations.map(gen => (
                  <div
                    key={gen.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background text-xs"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="font-semibold capitalize truncate">{gen.tool_id?.replace(/-/g, ' ')}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatRelativeTime(gen.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                        {gen.credits_used} cr
                      </span>
                      <span
                        className={`h-2 w-2 rounded-full ${
                          gen.status === 'completed'
                            ? 'bg-green-500'
                            : gen.status === 'failed'
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
