import { CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { OrderPlan } from "@/lib/order";

export function PlanCard({
  plan,
  onSelect,
}: {
  plan: OrderPlan;
  onSelect: (plan: OrderPlan) => void;
}) {
  return (
    <Card className={cn("overflow-hidden rounded-[28px] border-border/60 bg-card shadow-soft")}> 
      <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-5">
        <div>
          <p className="font-display text-xl text-card-foreground">{plan.quantityLabel}</p>
          <p className="mt-2 text-sm text-muted-foreground line-through">{plan.priceLabel}</p>
          <p className="mt-2 font-display text-3xl text-card-foreground">₹{plan.amountInr}</p>
        </div>

        {plan.badge ? (
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            {plan.badge}
          </span>
        ) : null}
      </div>

      <div className="px-6 pb-5">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          <ShieldCheck className="h-4 w-4" />
          Save 96%
        </div>

        <ul className="mt-4 space-y-2.5">
          {plan.perks.map((p) => (
            <li key={p} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>{p}</span>
            </li>
          ))}
          <li className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4 text-primary" />
            No password needed
          </li>
        </ul>

        <div className="mt-6">
          <Button
            variant="brand"
            size="pill"
            className="w-full"
            onClick={() => onSelect(plan)}
          >
            Buy Now
          </Button>
        </div>
      </div>
    </Card>
  );
}
