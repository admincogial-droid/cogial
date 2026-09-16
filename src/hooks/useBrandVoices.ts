import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { BrandVoice } from '@/types';

export function useBrandVoices(workspaceId: string | undefined) {
  return useQuery<BrandVoice[]>({
    queryKey: ['brand_voices', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('brand_voices')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as BrandVoice[];
    },
    enabled: Boolean(workspaceId),
  });
}

export function useCreateBrandVoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<BrandVoice> & { workspace_id: string; name: string }) => {
      const { data, error } = await supabase
        .from('brand_voices')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data as BrandVoice;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['brand_voices', variables.workspace_id] });
    },
  });
}
