import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/context/WorkspaceContext';

export interface AIGenerationParams {
  toolId: string;
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  creditCost?: number;
  inputData?: Record<string, any>;
}

export function useAIGenerate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { workspace, refreshWorkspace } = useWorkspace();

  const generate = async (params: AIGenerationParams) => {
    if (!workspace) {
      throw new Error('No workspace selected');
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-openrouter', {
        body: {
          workspaceId: workspace.id,
          model: params.model ?? 'google/gemini-2.5-flash',
          ...params
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to communicate with AI service');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Refresh workspace data to update credits in the sidebar
      await refreshWorkspace();

      return data.result;
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { generate, loading, error };
}
