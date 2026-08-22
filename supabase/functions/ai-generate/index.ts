import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── AI Provider Abstraction ─────────────────────────────────────

interface AIRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

interface AIResponse {
  content: string;
  input_tokens: number;
  output_tokens: number;
}

async function callOpenAI(req: AIRequest): Promise<AIResponse> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('AI provider not configured: OPENAI_API_KEY missing');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: req.prompt }],
      max_tokens: req.maxTokens ?? 2000,
      temperature: req.temperature ?? 0.7,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? 'OpenAI API error');
  }
  const data = await res.json();
  return {
    content: data.choices[0].message.content,
    input_tokens: data.usage.prompt_tokens,
    output_tokens: data.usage.completion_tokens,
  };
}

async function callGemini(req: AIRequest): Promise<AIResponse> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('AI provider not configured: GEMINI_API_KEY missing');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: req.prompt }] }],
        generationConfig: { maxOutputTokens: req.maxTokens ?? 2000, temperature: req.temperature ?? 0.7 },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? 'Gemini API error');
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return { content: text, input_tokens: 0, output_tokens: Math.ceil(text.length / 4) };
}

async function callAnthropic(req: AIRequest): Promise<AIResponse> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('AI provider not configured: ANTHROPIC_API_KEY missing');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: req.maxTokens ?? 2000,
      messages: [{ role: 'user', content: req.prompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? 'Anthropic API error');
  }
  const data = await res.json();
  return {
    content: data.content[0].text,
    input_tokens: data.usage.input_tokens,
    output_tokens: data.usage.output_tokens,
  };
}

async function generateAI(req: AIRequest): Promise<AIResponse> {
  // Try providers in order of availability
  if (Deno.env.get('OPENAI_API_KEY')) return callOpenAI(req);
  if (Deno.env.get('GEMINI_API_KEY')) return callGemini(req);
  if (Deno.env.get('ANTHROPIC_API_KEY')) return callAnthropic(req);
  throw new Error('AI provider not configured. Add OPENAI_API_KEY, GEMINI_API_KEY, or ANTHROPIC_API_KEY to Edge Function secrets.');
}

// ─── Prompt Templates ─────────────────────────────────────────────

function buildPrompt(type: string, params: Record<string, string>): string {
  const { topic, tone = 'professional', language = 'English', audience = 'general readers', length = 'medium', instructions = '' } = params;
  const wordGuide = { short: '300-500', medium: '800-1200', long: '1500-2500' }[length] ?? '800-1200';

  const base = `You are an expert content writer. Write in ${language}. Tone: ${tone}. Target audience: ${audience}.${instructions ? ` Additional instructions: ${instructions}` : ''}`;

  const prompts: Record<string, string> = {
    article: `${base}\n\nWrite a comprehensive, SEO-optimized blog article about: "${topic}"\n\nInclude: compelling title, introduction, multiple sections with H2/H3 headings, conclusion. Length: ${wordGuide} words. Format in plain text with clear structure.`,
    intro: `${base}\n\nWrite a compelling introduction paragraph for an article about: "${topic}"\n\nHook the reader immediately. 2-3 paragraphs max.`,
    outline: `${base}\n\nCreate a detailed article outline for: "${topic}"\n\nInclude: title, introduction hook, 5-7 main sections with subsections, conclusion points, and a FAQ section with 5 questions.`,
    rewrite: `${base}\n\nRewrite and significantly improve the following content to be more engaging, clear, and SEO-optimized:\n\n"${topic}"\n\nMaintain the original meaning but improve readability and impact.`,
    conclusion: `${base}\n\nWrite a strong conclusion for an article about: "${topic}"\n\nSummarize key points, provide actionable takeaways, end with a clear CTA.`,
    faq: `${base}\n\nGenerate 8 frequently asked questions and detailed answers about: "${topic}"\n\nFormat as Q: ... A: ... pairs. Make questions realistic and answers thorough.`,
    meta: `Generate SEO meta tags for an article about: "${topic}"\n\nProvide:\n1. Meta Title (50-60 characters, include keyword)\n2. Meta Description (150-160 characters, compelling, include keyword)\n3. 5 focus keywords\n4. OG title\n5. OG description`,
    social: `${base}\n\nWrite 3 social media posts about: "${topic}"\n\n1. Twitter/X post (280 chars max, include hashtags)\n2. LinkedIn post (professional, 3 paragraphs)\n3. Instagram caption (engaging, emojis welcome, hashtags at end)`,
  };

  return prompts[type] ?? prompts.article;
}

// ─── Main Handler ─────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ success: false, error: { code: 'unauthorized', message: 'Missing authorization' } }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) return new Response(JSON.stringify({ success: false, error: { code: 'unauthorized', message: 'Invalid token' } }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = await req.json();
    const { type, topic, tone, language, audience, length, instructions, generationId, workspaceId } = body;

    if (!topic || !workspaceId) {
      return new Response(JSON.stringify({ success: false, error: { code: 'bad_request', message: 'topic and workspaceId are required' } }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Server-side credit check
    const { data: balance } = await supabase.rpc('get_workspace_credits', { p_workspace_id: workspaceId });
    if (!balance || balance < 1) {
      return new Response(JSON.stringify({ success: false, error: { code: 'insufficient_credits', message: 'No AI credits remaining. Please upgrade your plan.' } }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Build and call AI
    const prompt = buildPrompt(type ?? 'article', { topic, tone, language, audience, length, instructions });
    const maxTokens = { short: 800, medium: 1800, long: 3500 }[length as string] ?? 1800;

    const aiResult = await generateAI({ prompt, maxTokens, temperature: 0.7 });

    // Deduct credits atomically
    await supabase.rpc('deduct_credits', {
      p_workspace_id: workspaceId,
      p_user_id: user.id,
      p_amount: 1,
      p_description: `${type ?? 'article'} generation`,
      p_reference_type: 'generation',
      p_reference_id: generationId,
    });

    // Update generation record
    if (generationId) {
      await supabase.from('generations').update({
        status: 'completed', completed_at: new Date().toISOString(),
        input_tokens: aiResult.input_tokens, output_tokens: aiResult.output_tokens,
      }).eq('id', generationId);
    }

    return new Response(JSON.stringify({ success: true, data: { content: aiResult.content, output_tokens: aiResult.output_tokens } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e: unknown) {
    const msg = (e as Error).message;
    console.error('[ai-generate]', msg);
    return new Response(JSON.stringify({ success: false, error: { code: 'internal_error', message: msg } }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
