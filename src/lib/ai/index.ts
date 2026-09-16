import { supabase } from '@/lib/supabase';

export interface GenerateOptions {
  workspaceId: string;
  type?: string;
  topic?: string;
  userPrompt?: string;
  systemPrompt?: string;
  tone?: string;
  language?: string;
  audience?: string;
  length?: 'short' | 'medium' | 'long';
  instructions?: string;
  creditCost?: number;
  brandVoiceId?: string;
  generationId?: string;
  model?: string;
  responseFormatJson?: boolean;
  inputs?: Record<string, unknown>;
  signal?: AbortSignal;
}

export interface GenerateResult<T = any> {
  content: T;
  raw: string;
  outputTokens: number;
  model: string;
  durationMs: number;
  generationId?: string;
}

export class AIServiceError extends Error {
  code: string;
  constructor(message: string, code = 'ai_error') {
    super(message);
    this.name = 'AIServiceError';
    this.code = code;
  }
}

/**
 * Centralized AI Service for PressLine
 * Dispatches requests to server-side Supabase Edge Functions with OpenRouter
 */
export async function generateAI<T = any>(options: GenerateOptions): Promise<GenerateResult<T>> {
  if (!options.workspaceId) {
    throw new AIServiceError('Workspace ID is required for AI generation', 'missing_workspace');
  }

  try {
    const { data, error } = await supabase.functions.invoke('ai-generate', {
      body: {
        workspaceId: options.workspaceId,
        type: options.type || 'article',
        topic: options.topic,
        userPrompt: options.userPrompt,
        systemPrompt: options.systemPrompt,
        tone: options.tone || 'professional',
        language: options.language || 'English',
        audience: options.audience || 'general audience',
        length: options.length || 'medium',
        instructions: options.instructions || '',
        creditCost: options.creditCost ?? 1,
        brandVoiceId: options.brandVoiceId,
        generationId: options.generationId,
        model: options.model,
        responseFormatJson: options.responseFormatJson ?? false,
        inputs: options.inputs ?? {},
      },
    });

    if (error) {
      throw new AIServiceError(error.message || 'AI request failed', 'edge_function_error');
    }

    if (!data?.success) {
      const err = data?.error;
      throw new AIServiceError(
        err?.message || 'AI generation failed to produce output',
        err?.code || 'generation_error'
      );
    }

    return {
      content: data.data.content as T,
      raw: data.data.raw || (typeof data.data.content === 'string' ? data.data.content : JSON.stringify(data.data.content)),
      outputTokens: data.data.output_tokens || 0,
      model: data.data.model || 'openrouter',
      durationMs: data.data.duration_ms || 0,
      generationId: data.data.generationId,
    };
  } catch (err: unknown) {
    if (err instanceof AIServiceError) {
      throw err;
    }
    const message = (err as Error).message || 'Failed to connect to AI engine';
    throw new AIServiceError(message, 'network_error');
  }
}
