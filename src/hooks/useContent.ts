import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Content, ContentStatus } from '@/types';

// Lightweight projection for list views — avoids downloading large body fields!
const CONTENT_METADATA_COLUMNS = 'id, workspace_id, user_id, project_id, title, slug, type, status, word_count, reading_time, is_favorite, created_at, updated_at, published_at';

export interface ContentFilters {
  status?: ContentStatus | 'all';
  search?: string;
  projectId?: string;
  page?: number;
  pageSize?: number;
}

export function useContents(workspaceId: string | undefined, filters: ContentFilters = {}) {
  const { status = 'all', search = '', projectId, page = 0, pageSize = 20 } = filters;

  return useQuery<{ contents: Content[]; totalCount: number }>({
    queryKey: ['contents', workspaceId, { status, search, projectId, page, pageSize }],
    queryFn: async () => {
      if (!workspaceId) return { contents: [], totalCount: 0 };

      let query = supabase
        .from('contents')
        .select(CONTENT_METADATA_COLUMNS, { count: 'exact' })
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      if (search.trim()) {
        query = query.ilike('title', `%${search.trim()}%`);
      }

      const { data, count, error } = await query;
      if (error) throw error;

      return {
        contents: (data || []) as unknown as Content[],
        totalCount: count ?? 0,
      };
    },
    enabled: Boolean(workspaceId),
    staleTime: 30 * 1000,
  });
}

export function useContent(contentId: string | undefined) {
  return useQuery<Content | null>({
    queryKey: ['content', contentId],
    queryFn: async () => {
      if (!contentId) return null;
      const { data, error } = await supabase
        .from('contents')
        .select('*')
        .eq('id', contentId)
        .single();

      if (error) throw error;
      return data as unknown as Content;
    },
    enabled: Boolean(contentId),
  });
}

export function useCreateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<Content> & { workspace_id: string; title: string }) => {
      const { data, error } = await supabase
        .from('contents')
        .insert({
          ...payload,
          word_count: payload.body ? payload.body.trim().split(/\s+/).filter(Boolean).length : 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Content;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contents', variables.workspace_id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', variables.workspace_id] });
    },
  });
}

export function useUpdateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Content> }) => {
      const payload: Record<string, unknown> = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      if (updates.body !== undefined) {
        const bodyStr = updates.body || '';
        payload.word_count = bodyStr.trim().split(/\s+/).filter(Boolean).length;
        payload.reading_time = Math.max(1, Math.ceil((payload.word_count as number) / 200));
        payload.character_count = bodyStr.length;
      }

      const { data, error } = await supabase
        .from('contents')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Content;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['content', data.id] });
      queryClient.invalidateQueries({ queryKey: ['contents', data.workspace_id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', data.workspace_id] });
    },
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await supabase.from('contents').delete().eq('id', id);
      if (error) throw error;
      return { id, workspaceId };
    },
    onSuccess: ({ workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['contents', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', workspaceId] });
    },
  });
}
