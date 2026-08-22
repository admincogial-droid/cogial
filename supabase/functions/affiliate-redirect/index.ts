import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Handle affiliate redirect: GET /affiliate-redirect?slug=xxx
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');

  if (!slug) {
    return new Response('Not found', { status: 404 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const { data: link } = await supabase
    .from('affiliate_links')
    .select('id, affiliate_url, is_active')
    .eq('slug', slug)
    .single();

  if (!link || !link.is_active) {
    return new Response('Link not found or inactive', { status: 404 });
  }

  // Record click asynchronously
  const ua = req.headers.get('user-agent') ?? '';
  const referrer = req.headers.get('referer') ?? '';
  const device = ua.includes('Mobile') ? 'mobile' : ua.includes('Tablet') ? 'tablet' : 'desktop';

  await supabase.from('affiliate_clicks').insert({
    link_id: link.id, user_agent: ua.slice(0, 500), referrer: referrer.slice(0, 500), device,
  });

  await supabase.from('affiliate_links').update({ click_count: supabase.rpc('click_count') }).eq('id', link.id);

  return new Response(null, {
    status: 302,
    headers: { ...corsHeaders, Location: link.affiliate_url },
  });
});
