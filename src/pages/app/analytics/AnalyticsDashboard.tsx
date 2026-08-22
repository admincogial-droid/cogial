import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useWorkspace } from '@/context/WorkspaceContext';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, FileText, Sparkles, Link2, Globe } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export default function AnalyticsDashboard() {
  const { workspace } = useWorkspace();
  const [data, setData] = useState({ contentByDay: [] as {date:string;count:number}[], creditsByDay: [] as {date:string;credits:number}[], contentByType: [] as {name:string;value:number}[], totals: { content: 0, words: 0, generations: 0, clicks: 0 } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspace) return;
    const load = async () => {
      const [contents, gens, clicks] = await Promise.all([
        supabase.from('contents').select('created_at, word_count, type').eq('workspace_id', workspace.id),
        supabase.from('generations').select('created_at, credits_used').eq('workspace_id', workspace.id),
        supabase.from('affiliate_links').select('click_count').eq('workspace_id', workspace.id),
      ]);
      const c = contents.data ?? [];
      const g = gens.data ?? [];
      const days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (29 - i));
        const ds = d.toISOString().slice(0, 10);
        return {
          date: ds.slice(5),
          count: c.filter(x => x.created_at.slice(0, 10) === ds).length,
          credits: g.filter(x => x.created_at.slice(0, 10) === ds).reduce((s: number, x: {credits_used:number}) => s + x.credits_used, 0),
        };
      });
      const typeMap: Record<string, number> = {};
      c.forEach(x => { typeMap[x.type] = (typeMap[x.type] ?? 0) + 1; });
      setData({
        contentByDay: days.map(d => ({ date: d.date, count: d.count })),
        creditsByDay: days.map(d => ({ date: d.date, credits: d.credits })),
        contentByType: Object.entries(typeMap).map(([name, value]) => ({ name, value })),
        totals: {
          content: c.length,
          words: c.reduce((s, x) => s + x.word_count, 0),
          generations: g.length,
          clicks: (clicks.data ?? []).reduce((s, x) => s + x.click_count, 0),
        },
      });
      setLoading(false);
    };
    load();
  }, [workspace]);

  const COLORS = ['#8B5CF6', '#6366F1', '#3B82F6', '#10B981', '#F59E0B'];

  const statCards = [
    { label: 'Total Content', value: data.totals.content, icon: FileText },
    { label: 'Words Generated', value: formatNumber(data.totals.words), icon: TrendingUp },
    { label: 'AI Generations', value: data.totals.generations, icon: Sparkles },
    { label: 'Affiliate Clicks', value: data.totals.clicks, icon: Link2 },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">30-day performance overview</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl border border-border bg-card p-4">
                <Icon size={16} className="text-primary mb-2" />
                <p className="text-xl font-bold">{typeof s.value === 'number' ? formatNumber(s.value) : s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold mb-4">Content Created — Last 30 Days</h2>
            {loading ? <div className="h-48 bg-muted animate-pulse rounded" /> : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.contentByDay}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[3, 3, 0, 0]} name="Articles" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold mb-4">Credits Used — Last 30 Days</h2>
            {loading ? <div className="h-48 bg-muted animate-pulse rounded" /> : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={data.creditsByDay}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                  <Line type="monotone" dataKey="credits" stroke="#6366F1" strokeWidth={2} dot={false} name="Credits" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {data.contentByType.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold mb-4">Content by Type</h2>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={data.contentByType} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                      {data.contentByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {data.contentByType.map((t, i) => (
                    <div key={t.name} className="flex items-center gap-2 text-xs">
                      <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="capitalize">{t.name}</span>
                      <span className="text-muted-foreground ml-auto pl-2">{t.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
