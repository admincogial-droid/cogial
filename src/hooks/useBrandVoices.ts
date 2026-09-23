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

export function useBrandVoice(voiceId: string | undefined) {
  return useQuery<BrandVoice | null>({
    queryKey: ['brand_voice', voiceId],
    queryFn: async () => {
      if (!voiceId) return null;
      const { data, error } = await supabase
        .from('brand_voices')
        .select('*')
        .eq('id', voiceId)
        .single();

      if (error) throw error;
      return data as BrandVoice;
    },
    enabled: Boolean(voiceId),
  });
}

export function useUpdateBrandVoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BrandVoice> }) => {
      const { data, error } = await supabase
        .from('brand_voices')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as BrandVoice;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['brand_voice', data.id] });
      queryClient.invalidateQueries({ queryKey: ['brand_voices', data.workspace_id] });
    },
  });
}

export function useDeleteBrandVoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await supabase.from('brand_voices').delete().eq('id', id);
      if (error) throw error;
      return { id, workspaceId };
    },
    onSuccess: ({ workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['brand_voices', workspaceId] });
    },
  });
}
