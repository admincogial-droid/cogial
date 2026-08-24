import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Service role to update DB securely
      { auth: { persistSession: false } }
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const {
      workspaceId,
      toolId,
      model,
      systemPrompt,
      userPrompt,
      temperature = 0.7,
      maxTokens = 2000,
      creditCost = 1,
      inputData = {}
    } = await req.json();

    if (!workspaceId || !toolId || !model || !systemPrompt || !userPrompt) {
      throw new Error('Missing required fields');
    }

    // Verify workspace membership
    const { data: member } = await supabaseClient
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!member) {
      throw new Error('Unauthorized for this workspace');
    }

    // Attempt to deduct credits first via RPC
    const { data: creditSuccess, error: creditError } = await supabaseClient.rpc('deduct_credits', {
      p_workspace_id: workspaceId,
      p_user_id: user.id,
      p_amount: creditCost,
      p_description: `AI Generation for ${toolId}`,
      p_reference_type: 'ai_tool',
      p_reference_id: null
    });

    if (creditError || !creditSuccess) {
      return new Response(JSON.stringify({ error: 'Insufficient credits' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create the pending generation record
    const { data: generation, error: genError } = await supabaseClient
      .from('ai_generations')
      .insert({
        workspace_id: workspaceId,
        user_id: user.id,
        tool_id: toolId,
        model,
        input_data: inputData,
        status: 'processing',
        credits_reserved: creditCost,
        credits_used: 0
      })
      .select()
      .single();

    if (genError) {
      console.error('Failed to create generation record:', genError);
      throw new Error('Failed to initialize generation');
    }

    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      throw new Error('AI configuration missing');
    }

    const startTime = Date.now();

    const openRouterReq = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pressline.ai',
        'X-Title': 'PressLine',
      },
      body: JSON.stringify({
        model: model,
        temperature: temperature,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!openRouterReq.ok) {
      const err = await openRouterReq.text();
      
      // Attempt refund (we add back credits since it failed)
      await supabaseClient.rpc('deduct_credits', {
        p_workspace_id: workspaceId,
        p_user_id: user.id,
        p_amount: -creditCost,
        p_description: `Refund for failed ${toolId}`,
        p_reference_type: 'ai_tool',
        p_reference_id: null
      });

      await supabaseClient
        .from('ai_generations')
        .update({ status: 'failed', error_message: 'OpenRouter API Error', error_code: openRouterReq.status.toString() })
        .eq('id', generation.id);

      return new Response(JSON.stringify({ error: `AI Provider Error: ${openRouterReq.status}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await openRouterReq.json();
    const duration = Date.now() - startTime;
    
    // Attempt to parse JSON response
    let outputData;
    try {
      outputData = JSON.parse(data.choices[0].message.content);
    } catch(e) {
      // Fallback if the model didn't return valid JSON
      outputData = { content: data.choices[0].message.content };
    }

    // Finalize generation
    await supabaseClient
      .from('ai_generations')
      .update({
        status: 'completed',
        credits_used: creditCost,
        output_data: outputData,
        input_tokens: data.usage?.prompt_tokens || 0,
        output_tokens: data.usage?.completion_tokens || 0,
        duration_ms: duration,
        completed_at: new Date().toISOString()
      })
      .eq('id', generation.id);

    return new Response(JSON.stringify({ result: outputData, generationId: generation.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
