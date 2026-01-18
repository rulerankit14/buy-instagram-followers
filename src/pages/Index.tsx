import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Instagram, Phone } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { GlowField } from "@/components/GlowField";
import { OfferCountdown } from "@/components/OfferCountdown";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { orderDraftSchema, saveDraft, loadDraft } from "@/lib/order";

type DraftForm = z.infer<typeof orderDraftSchema>;

const Index = () => {
  const navigate = useNavigate();
  const draft = typeof window !== "undefined" ? loadDraft() : null;

  const form = useForm<DraftForm>({
    resolver: zodResolver(orderDraftSchema),
    defaultValues: {
      username: draft?.username ?? "",
      phone: draft?.phone ?? "",
    },
    mode: "onTouched",
  });

  const onSubmit = (values: DraftForm) => {
    saveDraft(values);
    navigate("/plans");
  };

  return (
    <GlowField>
      <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-12 pt-6">
        <header className="space-y-4">
          <h1 className="text-center font-display text-4xl leading-[1.05] tracking-tight text-foreground">
            Boost Your Instagram
          </h1>

          <OfferCountdown minutes={10} />

          <div className="flex items-center justify-center">
            <div className="relative grid h-16 w-16 place-items-center rounded-full bg-brand-gradient shadow-elevated">
              <div className="grid h-[58px] w-[58px] place-items-center rounded-full bg-background/35 backdrop-blur">
                <Instagram className="h-7 w-7 text-foreground" />
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Get followers, likes or views—choose a plan and place your order in minutes.
          </p>
        </header>

        <section className="mt-6">
          <Card className="rounded-[28px] border-border/60 bg-card p-6 shadow-soft">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm">
                  Instagram Username
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    placeholder="@username"
                    autoComplete="username"
                    {...form.register("username")}
                    className="h-12 rounded-2xl pl-10"
                  />
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    @
                  </span>
                </div>
                {form.formState.errors.username ? (
                  <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm">
                  Mobile Number
                </Label>
                <div className="relative">
                  <Input
                    id="phone"
                    placeholder="+91 9xxxxxxxxx"
                    inputMode="tel"
                    autoComplete="tel"
                    {...form.register("phone")}
                    className="h-12 rounded-2xl pl-10"
                  />
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
                {form.formState.errors.phone ? (
                  <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
                ) : null}
              </div>

              <Button type="submit" variant="brand" size="pill" className="w-full">
                Get Started
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                By continuing you confirm this is your Instagram username and number.
              </p>
            </form>
          </Card>
        </section>

        <section className="mt-6 grid grid-cols-3 gap-3">
          {["Instant delivery", "Secure", "24/7 support"].map((t) => (
            <div
              key={t}
              className="rounded-2xl border border-border/60 bg-background/60 px-3 py-3 text-center text-xs text-muted-foreground shadow-soft"
            >
              {t}
            </div>
          ))}
        </section>
      </main>
    </GlowField>
  );
};

export default Index;
