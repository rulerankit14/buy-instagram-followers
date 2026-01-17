import { CheckCircle2, Clock, Instagram } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { GlowField } from "@/components/GlowField";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { clearDraft, clearOrder, loadOrder } from "@/lib/order";

function serviceLabel(service: string) {
  if (service === "followers") return "Followers";
  if (service === "likes") return "Likes";
  return "Views";
}

export default function Success() {
  const navigate = useNavigate();
  const order = typeof window !== "undefined" ? loadOrder() : null;

  const restart = () => {
    clearOrder();
    clearDraft();
    navigate("/");
  };

  if (!order) {
    return (
      <GlowField>
        <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-12 pt-10">
          <Card className="rounded-[28px] border-border/60 bg-card p-6 text-center shadow-soft">
            <p className="font-display text-2xl text-foreground">No order found</p>
            <p className="mt-2 text-sm text-muted-foreground">Start a new order to continue.</p>
            <Button className="mt-6 w-full" variant="brand" size="pill" onClick={restart}>
              Start New Order
            </Button>
          </Card>
        </main>
      </GlowField>
    );
  }

  return (
    <GlowField>
      <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-12 pt-6">
        <header className="flex flex-col items-center gap-3 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-gradient shadow-elevated">
            <div className="grid h-[58px] w-[58px] place-items-center rounded-full bg-background/35 backdrop-blur">
              <CheckCircle2 className="h-8 w-8 text-foreground" />
            </div>
          </div>
          <h1 className="font-display text-3xl tracking-tight text-foreground">Order Successful</h1>
          <p className="text-sm text-muted-foreground">We’ve queued your delivery.</p>
        </header>

        <section className="mt-6">
          <Card className="rounded-[28px] border-border/60 bg-card p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Instagram</p>
                <p className="mt-1 font-display text-xl text-foreground">@{order.username}</p>
              </div>
              <Instagram className="h-5 w-5 text-primary" />
            </div>

            <div className="mt-5 rounded-2xl border border-border/60 bg-background/60 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Package</p>
                <p className="text-sm font-semibold text-foreground">₹{order.plan.amountInr}</p>
              </div>
              <p className="mt-2 font-display text-lg text-foreground">
                {order.plan.quantityLabel} • {serviceLabel(order.plan.service)}
              </p>
            </div>

            <div className="mt-5 flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Delivery within 24 hours</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  You’ll see your {serviceLabel(order.plan.service).toLowerCase()} delivered gradually for a natural look.
                </p>
              </div>
            </div>

            <Button variant="brand" size="pill" className="mt-6 w-full" onClick={restart}>
              Place Another Order
            </Button>
          </Card>
        </section>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Need help? Contact support with your username and order time.
        </p>
      </main>
    </GlowField>
  );
}
