import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');

  if (!slug) {
    return new Response('Not found', { status: 404 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  const { data: link, error: linkErr } = await supabase
    .from('affiliate_links')
    .select('id, affiliate_url, is_active')
    .eq('slug', slug)
    .single();

  if (linkErr || !link || !link.is_active) {
    return new Response('Link not found or inactive', { status: 404 });
  }

  // Record click asynchronously with privacy protection
  const ua = req.headers.get('user-agent') ?? '';
  const referrer = req.headers.get('referer') ?? '';
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
  const device = ua.includes('Mobile') ? 'mobile' : ua.includes('Tablet') ? 'tablet' : 'desktop';

  // Compute SHA-256 hash of IP for privacy
  let ipHash = '';
  if (clientIp) {
    const msgUint8 = new TextEncoder().encode(clientIp);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    ipHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Insert click - the PostgreSQL trigger trg_affiliate_click will automatically increment link.click_count!
  await supabase.from('affiliate_clicks').insert({
    link_id: link.id,
    user_agent: ua.slice(0, 500),
    referrer: referrer.slice(0, 500),
    device,
    metadata: { ip_hash: ipHash },
  });

  return new Response(null, {
    status: 302,
    headers: { ...corsHeaders, Location: link.affiliate_url },
  });
});
