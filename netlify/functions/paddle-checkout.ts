const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export default async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paddleApiKey = process.env.PADDLE_API_KEY || '';

    if (!paddleApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Paddle API Key is not configured in server environment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { priceId, workspaceId, userEmail, planSlug, billingCycle = 'monthly' } = body;

    if (!priceId) {
      return new Response(
        JSON.stringify({ success: false, error: 'priceId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Paddle Billing live API to generate checkout transaction
    const paddleRes = await fetch('https://api.paddle.com/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paddleApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity: 1 }],
        customer: userEmail ? { email: userEmail } : undefined,
        custom_data: {
          workspace_id: workspaceId,
          plan_slug: planSlug,
          billing_cycle: billingCycle,
        },
      }),
    });

    const paddleData = await paddleRes.json();

    if (paddleRes.ok && paddleData.data) {
      const checkoutUrl = paddleData.data.checkout?.url;
      const transactionId = paddleData.data.id;

      return new Response(
        JSON.stringify({
          success: true,
          url: checkoutUrl,
          transactionId,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const errorCode = paddleData.error?.code;
    const isVerificationPending = errorCode === 'transaction_checkout_not_enabled';

    return new Response(
      JSON.stringify({
        success: false,
        isVerificationPending,
        error: {
          code: errorCode || 'paddle_checkout_error',
          message: paddleData.error?.detail || paddleData.error?.message || 'Could not initiate Paddle checkout',
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};
