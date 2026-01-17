import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { order_amount, customer_details, order_note } = await req.json();

    const CASHFREE_APP_ID = Deno.env.get("CASHFREE_APP_ID");
    const CASHFREE_SECRET_KEY = Deno.env.get("CASHFREE_SECRET_KEY");

    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      throw new Error("Cashfree credentials not configured");
    }

    // Generate unique order ID
    const order_id = `ORDER_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create Cashfree order
    const cashfreePayload = {
      order_id,
      order_amount,
      order_currency: "INR",
      customer_details: {
        customer_id: customer_details.customer_id,
        customer_name: customer_details.customer_name || "Customer",
        customer_email: customer_details.customer_email || "customer@example.com",
        customer_phone: customer_details.customer_phone,
      },
      order_note: order_note || "Instagram Growth Panel Order",
      order_meta: {
        return_url: `${req.headers.get("origin")}/success?order_id={order_id}`,
      },
    };

    const response = await fetch("https://api.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
      },
      body: JSON.stringify(cashfreePayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Cashfree API Error:", data);
      throw new Error(data.message || "Failed to create order");
    }

    return new Response(
      JSON.stringify({
        order_id: data.order_id,
        payment_session_id: data.payment_session_id,
        order_status: data.order_status,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
