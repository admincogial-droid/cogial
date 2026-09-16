import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Template } from '@/types';

export function useTemplates(workspaceId: string | undefined, category?: string) {
  return useQuery<Template[]>({
    queryKey: ['templates', workspaceId, category],
    queryFn: async () => {
      if (!workspaceId) return [];
      let query = supabase
        .from('templates')
        .select('*')
        .or(`workspace_id.eq.${workspaceId},is_public.eq.true`)
        .order('is_favorite', { ascending: false })
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Template[];
    },
    enabled: Boolean(workspaceId),
  });
}
