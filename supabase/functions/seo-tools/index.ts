import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authErr || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { action, workspaceId, keyword, keywords, domain } = await req.json();

    if (!workspaceId) {
      return new Response(JSON.stringify({ success: false, error: 'Workspace ID required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: 'AI provider not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const model = Deno.env.get('OPENROUTER_MODEL') || 'google/gemini-2.5-flash';

    if (action === 'keyword_research') {
      const prompt = `You are a search intelligence engine. Analyze the target keyword: "${keyword}".
Output ONLY valid JSON without markdown wrapping:
{
  "keyword": "${keyword}",
  "intent": "informational" | "commercial" | "transactional" | "navigational",
  "difficulty": number (1-100 estimate),
  "volume_range": "Low (<1K)" | "Medium (1K-10K)" | "High (10K-100K)" | "Very High (100K+)",
  "cpc_estimate": number (approximate dollars, e.g. 1.25),
  "is_ai_estimate": true,
  "long_tail_keywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4"],
  "content_angles": ["angle 1", "angle 2"],
  "suggested_title": "string"
}`;

      const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://pressline.ai',
          'X-Title': 'PressLine SEO',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        }),
      });

      if (!aiRes.ok) throw new Error(`OpenRouter error: ${aiRes.status}`);
      const data = await aiRes.json();
      const raw = data.choices?.[0]?.message?.content || '{}';
      const parsed = JSON.parse(raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim());

      // Save to keywords table
      const { data: savedKw } = await supabase.from('keywords').insert({
        workspace_id: workspaceId,
        user_id: user.id,
        keyword: parsed.keyword || keyword,
        intent: parsed.intent || 'informational',
        difficulty: parsed.difficulty || 30,
        volume: parsed.difficulty ? parsed.difficulty * 45 : 1200,
        cpc: parsed.cpc_estimate || 1.2,
      }).select().single();

      return new Response(JSON.stringify({ success: true, data: savedKw || parsed }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'keyword_clustering') {
      const kwList = Array.isArray(keywords) ? keywords.join(', ') : String(keywords);
      const prompt = `You are an SEO topic cluster architect. Group the following keywords into high-impact topical clusters:
${kwList}

Output ONLY valid JSON without markdown wrapping:
{
  "clusters": [
    {
      "name": "Cluster Name",
      "primary_keyword": "main keyword",
      "keywords": ["kw1", "kw2", "kw3"],
      "intent": "informational" | "commercial" | "transactional",
      "suggested_title": "Proposed Article Title",
      "content_type": "guide" | "comparison" | "how-to" | "listicle"
    }
  ]
}`;

      const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://pressline.ai',
          'X-Title': 'PressLine SEO',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        }),
      });

      if (!aiRes.ok) throw new Error(`OpenRouter error: ${aiRes.status}`);
      const data = await aiRes.json();
      const raw = data.choices?.[0]?.message?.content || '{}';
      const parsed = JSON.parse(raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim());

      return new Response(JSON.stringify({ success: true, data: parsed }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
