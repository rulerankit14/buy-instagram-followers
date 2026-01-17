import * as React from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Landmark, ShieldCheck } from "lucide-react";

import { GlowField } from "@/components/GlowField";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loadOrder } from "@/lib/order";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Import UPI app logos
import phonePeLogo from "@/assets/phonepe-logo.webp";
import gPayLogo from "@/assets/gpay-logo.png";
import paytmLogo from "@/assets/paytm-logo.png";
import bhimLogo from "@/assets/bhim-logo.png";

type PayMethod = "upi" | "card" | "netbanking";

function serviceLabel(service: string) {
  if (service === "followers") return "Followers";
  if (service === "likes") return "Likes";
  return "Views";
}

export default function Payment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const order = typeof window !== "undefined" ? loadOrder() : null;

  const [method, setMethod] = React.useState<PayMethod>("upi");
  const [status, setStatus] = React.useState<"idle" | "processing" | "redirecting">("idle");

  React.useEffect(() => {
    if (!order) navigate("/plans");
  }, [order, navigate]);

  const handlePayment = async () => {
    if (!order) return;
    
    setStatus("processing");

    try {
      // Create Cashfree order
      const { data, error } = await supabase.functions.invoke("create-cashfree-order", {
        body: {
          order_amount: order.plan.amountInr,
          customer_details: {
            customer_id: order.username,
            customer_phone: order.phone,
            customer_name: order.username,
          },
          order_note: `${order.plan.quantityLabel} - ${serviceLabel(order.plan.service)}`,
        },
      });

      if (error) throw error;

      if (data?.payment_session_id) {
        setStatus("redirecting");
        
        // Initialize Cashfree checkout
        const cashfree = (window as any).Cashfree({
          mode: "production", // Change to "sandbox" for testing
        });

        cashfree.checkout({
          paymentSessionId: data.payment_session_id,
          returnUrl: `${window.location.origin}/success?order_id=${data.order_id}`,
        });
      } else {
        throw new Error("Failed to initialize payment");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Payment failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setStatus("idle");
    }
  };

  const upiApps = [
    { name: "PhonePe", logo: phonePeLogo },
    { name: "Google Pay", logo: gPayLogo },
    { name: "Paytm", logo: paytmLogo },
    { name: "BHIM", logo: bhimLogo },
  ];

  return (
    <GlowField>
      <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-12 pt-6">
        <header className="space-y-2 text-center">
          <div className="rounded-[28px] bg-brand-gradient p-6 text-center shadow-elevated">
            <h1 className="font-display text-3xl tracking-tight text-primary-foreground">
              Complete Your Payment
            </h1>
            <p className="mt-2 text-sm text-primary-foreground/90">
              Secure and instant payment processing
            </p>
          </div>
        </header>

        <section className="mt-6">
          <Card className="rounded-[28px] border-border/60 bg-card p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-display text-foreground">{order?.plan.quantityLabel}</p>
                <p className="mt-1 font-display text-4xl text-primary">₹{order?.plan.amountInr}</p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-around gap-4 text-center text-xs text-muted-foreground">
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span>100% Secure</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span>Instant Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span>24/7 Support</span>
              </div>
            </div>

            <Separator className="my-5" />

            <Tabs value={method} onValueChange={(v) => setMethod(v as PayMethod)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-full bg-secondary p-1">
                <TabsTrigger
                  value="upi"
                  className="rounded-full text-xs font-semibold data-[state=active]:bg-brand-gradient data-[state=active]:text-primary-foreground"
                >
                  UPI
                </TabsTrigger>
                <TabsTrigger
                  value="card"
                  className="rounded-full text-xs font-semibold data-[state=active]:bg-brand-gradient data-[state=active]:text-primary-foreground"
                >
                  Card
                </TabsTrigger>
                <TabsTrigger
                  value="netbanking"
                  className="rounded-full text-xs font-semibold data-[state=active]:bg-brand-gradient data-[state=active]:text-primary-foreground"
                >
                  Net Banking
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upi" className="mt-5 space-y-4">
                <div className="text-center">
                  <h3 className="font-display text-xl text-foreground">Pay via UPI Apps</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose your preferred UPI app to complete payment
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {upiApps.map((app) => (
                    <button
                      key={app.name}
                      type="button"
                      className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-4 transition-all hover:bg-background hover:shadow-soft"
                    >
                      <img src={app.logo} alt={app.name} className="h-12 w-12 object-contain" />
                      <span className="text-sm font-medium text-foreground">{app.name}</span>
                    </button>
                  ))}
                </div>

                <Button
                  variant="brand"
                  size="pill"
                  className="mt-4 w-full text-base font-semibold"
                  onClick={handlePayment}
                  disabled={status !== "idle"}
                >
                  {status === "processing" && "Creating order…"}
                  {status === "redirecting" && "Opening payment…"}
                  {status === "idle" && "Pay with Any UPI App"}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Your payment is secure and encrypted
                </p>
              </TabsContent>

              <TabsContent value="card" className="mt-5 space-y-4">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-background/60">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Card Payment</p>
                    <p className="text-xs text-muted-foreground">Debit/Credit card payment</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input id="cardNumber" placeholder="1234 5678 9012 3456" inputMode="numeric" autoComplete="off" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry</Label>
                    <Input id="expiry" placeholder="MM/YY" autoComplete="off" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="***" inputMode="numeric" autoComplete="off" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Name on card</Label>
                  <Input id="name" placeholder="Full name" autoComplete="off" />
                </div>

                <Button
                  variant="brand"
                  size="pill"
                  className="w-full text-base font-semibold"
                  onClick={handlePayment}
                  disabled={status !== "idle"}
                >
                  {status === "processing" && "Creating order…"}
                  {status === "redirecting" && "Opening payment…"}
                  {status === "idle" && "Pay Now"}
                </Button>
              </TabsContent>

              <TabsContent value="netbanking" className="mt-5 space-y-4">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-background/60">
                    <Landmark className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">NetBanking</p>
                    <p className="text-xs text-muted-foreground">Pay via your bank</p>
                  </div>
                </div>

                <div className="grid gap-3">
                  <Button type="button" variant="secondary" size="pill" className="w-full justify-between">
                    HDFC Bank
                    <span className="text-xs text-muted-foreground">Popular</span>
                  </Button>
                  <Button type="button" variant="secondary" size="pill" className="w-full justify-between">
                    ICICI Bank
                    <span className="text-xs text-muted-foreground">Popular</span>
                  </Button>
                  <Button type="button" variant="secondary" size="pill" className="w-full justify-between">
                    SBI
                    <span className="text-xs text-muted-foreground">Popular</span>
                  </Button>
                </div>

                <Button
                  variant="brand"
                  size="pill"
                  className="w-full text-base font-semibold"
                  onClick={handlePayment}
                  disabled={status !== "idle"}
                >
                  {status === "processing" && "Creating order…"}
                  {status === "redirecting" && "Opening payment…"}
                  {status === "idle" && "Continue to NetBanking"}
                </Button>
              </TabsContent>
            </Tabs>

            <div className="mt-5 space-y-3">
              <Button variant="outline" size="pill" className="w-full" onClick={() => navigate("/plans")}>
                Back to plans
              </Button>
            </div>
          </Card>
        </section>
      </main>
    </GlowField>
  );
}
