import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  partnerId: string;
  sourceId: string;
  scaleId: string;
  amount: string;
  duration: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  mobile: string;
  returnUrl: string;
  exchangeUrl: string;
  orderId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const params: RequestBody = await req.json();

    const tokenResponse = await fetch("https://rct-api.sofinco.fr/token", {
      headers: {
        "accept": "*/*",
        "authorization": "Basic OHVGOGl0RHdoUHducURqVnpUakd4RWpBVkN3YToyRE9zcDgwN1VhZWZpOVdZd3B3MGlHXzR1SHdh",
        "content-type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials",
      method: "POST",
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token request failed: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const token = tokenData.access_token;

    const businessContext = {
      providerContext: {
        returnUrl: params.returnUrl,
        exchangeUrl: params.exchangeUrl,
        homeReturnUrl: params.returnUrl
      },
      customerContext: {
        firstName: params.firstName,
        lastName: params.lastName,
        birthDate: params.birthDate,
        member: false,
        emailAddress: params.email,
        mobileNumber: params.mobile
      },
      coBorrowerContext: {
        member: false
      },
      offerContext: {
        scaleId: params.scaleId,
        amount: params.amount,
        orderAmount: params.amount,
        duration: params.duration,
        cart: {
          products: [],
          totalAmount: parseInt(params.amount)
        },
        awaitingFunding: false,
        orderId: params.orderId
      },
      simulationContext: {
        dueNumber: parseInt(params.duration),
        scaleCode: params.scaleId
      }
    };

    const linkResponse = await fetch("https://rct-api.sofinco.fr/partnerDataExchange/v1/links/", {
      headers: {
        "accept": "*/*",
        "authorization": `Bearer ${token}`,
        "content-type": "application/json",
        "context-applicationid": "creditPartner",
        "context-partnerid": params.partnerId,
        "context-sourceid": params.sourceId
      },
      body: JSON.stringify({
        businessContext: JSON.stringify(businessContext)
      }),
      method: "POST",
    });

    if (!linkResponse.ok) {
      const errorText = await linkResponse.text();
      throw new Error(`Link generation failed: ${linkResponse.status} - ${errorText}`);
    }

    const linkData = await linkResponse.json();

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: linkData.link || linkData.url || linkData,
        data: linkData 
      }),
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
        success: false, 
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