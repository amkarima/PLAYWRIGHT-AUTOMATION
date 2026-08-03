import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { phoneId } = await req.json();

    if (!phoneId) {
      return new Response(
        JSON.stringify({ error: 'phoneId is required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const proxyUrl = 'http://R15449:Mozar59100!!!!!!@193.56.28.49:8800';
    
    const response = await fetch(
      `https://programmatic-api.client.get.mymfa.io/v1/${phoneId}/mfa/latest`,
      {
        method: 'GET',
        headers: {
          'x-api-key': 'OfgH9028Ji4EBstI66GQQ3n0rczFeTWj8C4q1XHV',
          'Accept': 'application/json'
        },
        // @ts-ignore - Deno supports proxy configuration
        proxy: proxyUrl
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});