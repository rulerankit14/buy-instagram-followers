import * as React from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Landmark, QrCode, ShieldCheck } from "lucide-react";

import { GlowField } from "@/components/GlowField";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loadOrder } from "@/lib/order";

type PayMethod = "upi" | "card" | "netbanking";

function serviceLabel(service: string) {
  if (service === "followers") return "Followers";
  if (service === "likes") return "Likes";
  return "Views";
}

export default function Payment() {
  const navigate = useNavigate();
  const order = typeof window !== "undefined" ? loadOrder() : null;

  const [method, setMethod] = React.useState<PayMethod>("upi");
  const [status, setStatus] = React.useState<"idle" | "processing">("idle");

  React.useEffect(() => {
    if (!order) navigate("/plans");
  }, [order, navigate]);

  const startPayment = () => {
    if (!order) return;
    setStatus("processing");

    window.setTimeout(() => {
      navigate("/success");
    }, 1600);
  };

  return (
    <GlowField>
      <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-12 pt-6">
        <header className="space-y-2 text-center">
          <h1 className="font-display text-3xl tracking-tight text-foreground">Payment</h1>
          <p className="text-sm text-muted-foreground">Choose a method to complete your order.</p>
        </header>

        <section className="mt-6">
          <Card className="rounded-[28px] border-border/60 bg-card p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Payable amount</p>
                <p className="mt-1 font-display text-3xl text-foreground">₹{order?.plan.amountInr}</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Mock secure checkout</span>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs text-muted-foreground">Order</p>
              <p className="mt-1 font-display text-lg text-foreground">
                {order?.plan.quantityLabel} • {serviceLabel(order?.plan.service ?? "followers")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">@{order?.username}</p>
            </div>

            <Separator className="my-5" />

            <Tabs value={method} onValueChange={(v) => setMethod(v as PayMethod)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-full bg-secondary p-1">
                <TabsTrigger
                  value="upi"
                  className="rounded-full text-xs data-[state=active]:bg-brand-gradient data-[state=active]:text-primary-foreground"
                >
                  UPI
                </TabsTrigger>
                <TabsTrigger
                  value="card"
                  className="rounded-full text-xs data-[state=active]:bg-brand-gradient data-[state=active]:text-primary-foreground"
                >
                  Card
                </TabsTrigger>
                <TabsTrigger
                  value="netbanking"
                  className="rounded-full text-xs data-[state=active]:bg-brand-gradient data-[state=active]:text-primary-foreground"
                >
                  NetBanking
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upi" className="mt-5 space-y-4">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-background/60">
                    <QrCode className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">UPI Payment</p>
                    <p className="text-xs text-muted-foreground">Enter your UPI ID (mock).</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="upi">UPI ID</Label>
                  <Input id="upi" placeholder="name@bank" autoComplete="off" />
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/60 p-4 text-xs text-muted-foreground">
                  Tip: In a real checkout, this would open your UPI app.
                </div>
              </TabsContent>

              <TabsContent value="card" className="mt-5 space-y-4">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-background/60">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Card Payment</p>
                    <p className="text-xs text-muted-foreground">Enter card details (mock).</p>
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
              </TabsContent>

              <TabsContent value="netbanking" className="mt-5 space-y-4">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-background/60">
                    <Landmark className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">NetBanking</p>
                    <p className="text-xs text-muted-foreground">Select your bank (mock).</p>
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

                <div className="rounded-2xl border border-border/60 bg-background/60 p-4 text-xs text-muted-foreground">
                  In a real flow, this would redirect to your bank login.
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 space-y-3">
              <Button
                variant="brand"
                size="pill"
                className="w-full"
                onClick={startPayment}
                disabled={status === "processing"}
              >
                {status === "processing" ? "Processing…" : "Pay Now"}
              </Button>
              <Button variant="outline" size="pill" className="w-full" onClick={() => navigate("/plans")}>
                Back to plans
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                This is a UI-only demo payment step (no real charge).
              </p>
            </div>
          </Card>
        </section>
      </main>
    </GlowField>
  );
}
