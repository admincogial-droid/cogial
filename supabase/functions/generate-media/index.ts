import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type = 'image', prompt, aspectRatio = '1:1', model } = await req.json();

    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      return new Response(JSON.stringify({ error: 'AI provider not configured: OPENROUTER_API_KEY missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Top-tier image models
    const imageModel = model || Deno.env.get('OPENROUTER_IMAGE_MODEL') || 'openai/gpt-image-2.5-sunburst';
    const fallbackImageModel = Deno.env.get('OPENROUTER_IMAGE_FALLBACK_MODEL') || 'google/gemini-2.5-flash-image';
    const siteUrl = Deno.env.get('OPENROUTER_SITE_URL') || 'https://pressline.ai';
    const appName = Deno.env.get('OPENROUTER_APP_NAME') || 'PressLine';

    const modelsToTry = [imageModel];
    if (fallbackImageModel !== imageModel) {
      modelsToTry.push(fallbackImageModel);
    }

    let lastError: Error | null = null;
    for (const modelToUse of modelsToTry) {
      try {
        const payload: Record<string, unknown> = {
          model: modelToUse,
          prompt: prompt || 'High quality professional visualization',
          aspect_ratio: aspectRatio,
        };

        const res = await fetch('https://openrouter.ai/api/v1/images', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': siteUrl,
            'X-Title': appName,
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          const imgItem = data.data?.[0];
          if (imgItem) {
            const mime = imgItem.media_type || 'image/png';
            const imageUrl = imgItem.url || (imgItem.b64_json ? `data:${mime};base64,${imgItem.b64_json}` : '');
            return new Response(JSON.stringify({
              success: true,
              data: {
                imageUrl,
                modelUsed: modelToUse,
                created: data.created,
              }
            }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        } else {
          const err = await res.json().catch(() => ({}));
          lastError = new Error(err.error?.message || `Image API status ${res.status}`);
        }
      } catch (e) {
        lastError = e as Error;
      }
    }

    throw lastError || new Error('Image generation failed');

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
