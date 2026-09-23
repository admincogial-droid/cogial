import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Template } from '@/types';

export function useTemplate(templateId: string | undefined) {
  return useQuery<Template | null>({
    queryKey: ['template', templateId],
    queryFn: async () => {
      if (!templateId) return null;
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      return data as Template;
    },
    enabled: Boolean(templateId),
  });
}

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

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<Template> & { workspace_id: string; name: string }) => {
      const { data, error } = await supabase
        .from('templates')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data as Template;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['templates', variables.workspace_id] });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Template> }) => {
      const { data, error } = await supabase
        .from('templates')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Template;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['template', data.id] });
      queryClient.invalidateQueries({ queryKey: ['templates', data.workspace_id] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await supabase.from('templates').delete().eq('id', id);
      if (error) throw error;
      return { id, workspaceId };
    },
    onSuccess: ({ workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['templates', workspaceId] });
    },
  });
}
