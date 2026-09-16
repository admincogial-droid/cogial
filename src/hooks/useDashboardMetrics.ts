import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DashboardMetrics } from '@/types';

export function useDashboardMetrics(workspaceId: string | undefined, timeframe: string = '7d') {
  return useQuery<DashboardMetrics>({
    queryKey: ['dashboard', workspaceId, timeframe],
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace selected');
      }

      // @ts-ignore
      const { data, error } = await supabase.rpc('get_dashboard_metrics', {
        p_workspace_id: workspaceId,
        p_timeframe: timeframe,
      });

      if (!error && data) {
        return data as unknown as DashboardMetrics;
      }

      console.warn('Dashboard RPC not available, executing optimized fallback query', error);

      // Graceful fallback if migration not run yet
      const [balRes, contentsRes, publishedRes, clicksRes, recentContentsRes, recentGensRes] = await Promise.all([
        supabase.from('credit_balances').select('*').eq('workspace_id', workspaceId).single(),
        supabase.from('contents').select('word_count, created_at').eq('workspace_id', workspaceId),
        supabase.from('contents').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('status', 'published'),
        supabase.from('affiliate_links').select('click_count').eq('workspace_id', workspaceId),
        supabase.from('contents').select('id, title, type, status, word_count, created_at, updated_at, published_at').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(5),
        supabase.from('ai_generations').select('id, tool_id, model, status, credits_used, created_at').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(5),
      ]);

      const contents = contentsRes.data || [];
      const totalWords = contents.reduce((acc, c: any) => acc + (c.word_count || 0), 0);
      const totalClicks = (clicksRes.data || []).reduce((acc, l: any) => acc + (l.click_count || 0), 0);

      // Generate 7-day points
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          date: d.toISOString().slice(5, 10),
          credits: 0,
          generations: 0,
        };
      });

      return {
        credits_remaining: balRes.data?.balance ?? 100,
        credits_used: 0,
        credits_limit: (balRes.data as any)?.monthly_limit ?? 100,
        content_created: contents.length,
        words_generated: totalWords,
        published_articles: publishedRes.count ?? 0,
        affiliate_clicks: totalClicks,
        daily_credit_usage: days,
        recent_content: (recentContentsRes.data || []) as any,
        recent_generations: (recentGensRes.data || []) as any,
      };
    },
    enabled: Boolean(workspaceId),
    staleTime: 60 * 1000, // 1 minute
  });
}
