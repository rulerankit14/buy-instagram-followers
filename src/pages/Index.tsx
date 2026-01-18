import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Instagram, Phone, Search } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";

type DraftForm = z.infer<typeof orderDraftSchema>;

type IgLookup =
  | { status: "idle" }
  | { status: "checking"; username: string }
  | { status: "found"; username: string; fullName?: string; avatarUrl?: string; profileUrl: string }
  | { status: "not_found"; username: string; message: string }
  | { status: "blocked"; username: string; message: string }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

function normalizeUsername(input: string) {
  return input.trim().replace(/^@+/, "");
}

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

  const watchedUsername = form.watch("username");
  const [lookup, setLookup] = React.useState<IgLookup>({ status: "idle" });
  const [confirmedUsername, setConfirmedUsername] = React.useState<string | null>(null);

  // Reset confirmation if user edits username after confirming.
  React.useEffect(() => {
    const u = normalizeUsername(watchedUsername ?? "");
    if (confirmedUsername && u.toLowerCase() !== confirmedUsername.toLowerCase()) {
      setConfirmedUsername(null);
    }
  }, [watchedUsername, confirmedUsername]);

  // Debounced best-effort Instagram profile verification.
  React.useEffect(() => {
    const raw = watchedUsername ?? "";
    const username = normalizeUsername(raw);

    if (!username) {
      setLookup({ status: "idle" });
      return;
    }

    if (username.length > 30 || !/^[a-zA-Z0-9._]+$/.test(username)) {
      setLookup({ status: "invalid", message: "Only letters, numbers, . and _ allowed" });
      return;
    }

    const t = window.setTimeout(async () => {
      setLookup({ status: "checking", username });

      const { data, error } = await supabase.functions.invoke("lookup-instagram-profile", {
        body: { username },
      });

      if (error) {
        setLookup({ status: "error", message: "Verification failed" });
        return;
      }

      if (!data?.status) {
        setLookup({ status: "error", message: "Verification failed" });
        return;
      }

      if (data.status === "found") {
        setLookup({
          status: "found",
          username: data.username,
          fullName: data.fullName,
          avatarUrl: data.avatarUrl,
          profileUrl: data.profileUrl,
        });
        return;
      }

      if (data.status === "blocked") {
        setLookup({ status: "blocked", username, message: data.message ?? "Try again" });
        return;
      }

      if (data.status === "not_found") {
        setLookup({ status: "not_found", username, message: data.message ?? "Profile not found" });
        return;
      }

      if (data.status === "invalid") {
        setLookup({ status: "invalid", message: data.message ?? "Invalid username" });
        return;
      }

      setLookup({ status: "error", message: "Verification failed" });
    }, 650);

    return () => window.clearTimeout(t);
  }, [watchedUsername]);

  const onSubmit = (values: DraftForm) => {
    const normalized = normalizeUsername(values.username);
    const canVerify = lookup.status === "found" || lookup.status === "blocked";
    const isVerified =
      canVerify &&
      confirmedUsername &&
      confirmedUsername.toLowerCase() === normalized.toLowerCase();

    if (!isVerified) {
      // Make the error visible under the username field.
      form.setError("username", {
        type: "manual",
        message: "Please search and select your Instagram account before continuing.",
      });
      return;
    }

    saveDraft({ ...values, username: normalized });
    navigate("/plans");
  };

  const canContinue =
    form.formState.isValid &&
    (lookup.status === "found" || lookup.status === "blocked") &&
    !!confirmedUsername &&
    confirmedUsername.toLowerCase() === normalizeUsername(watchedUsername ?? "").toLowerCase();

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
                  Instagram Username (Search & Select)
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    placeholder="@username"
                    autoComplete="username"
                    {...form.register("username")}
                    className="h-12 rounded-2xl pl-10 pr-10"
                  />
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    @
                  </span>
                  <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>

                {lookup.status === "checking" ? (
                  <p className="text-xs text-muted-foreground">Searching Instagram…</p>
                ) : null}

                {lookup.status === "found" ? (
                  <div className="rounded-2xl border border-border/60 bg-background/60 p-4 shadow-soft">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 overflow-hidden rounded-2xl border border-border/60 bg-background/60">
                        {lookup.avatarUrl ? (
                          <img
                            src={lookup.avatarUrl}
                            alt={`Instagram profile picture for @${lookup.username}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">@</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {lookup.fullName || `@${lookup.username}`}
                        </p>
                        <a
                          href={lookup.profileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-xs text-primary underline-offset-4 hover:underline"
                        >
                          @{lookup.username}
                        </a>
                      </div>
                      <Button
                        type="button"
                        variant={
                          confirmedUsername?.toLowerCase() === lookup.username.toLowerCase()
                            ? "secondary"
                            : "brand"
                        }
                        size="sm"
                        className="rounded-xl"
                        onClick={() => {
                          setConfirmedUsername(lookup.username);
                          form.clearErrors("username");
                          form.setValue("username", lookup.username, { shouldValidate: true, shouldTouch: true });
                        }}
                      >
                        {confirmedUsername?.toLowerCase() === lookup.username.toLowerCase() ? "Selected" : "Select"}
                      </Button>
                    </div>
                  </div>
                ) : null}

                {lookup.status === "blocked" ? (
                  <div className="rounded-2xl border border-border/60 bg-background/60 p-4 shadow-soft">
                    <div className="flex items-start gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl border border-border/60 bg-background/60 text-xs text-muted-foreground">
                        @
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">@{lookup.username}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{lookup.message}</p>
                        <a
                          href={`https://www.instagram.com/${lookup.username}/`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-xs text-primary underline-offset-4 hover:underline"
                        >
                          Open on Instagram
                        </a>
                      </div>
                      <Button
                        type="button"
                        variant={
                          confirmedUsername?.toLowerCase() === lookup.username.toLowerCase()
                            ? "secondary"
                            : "brand"
                        }
                        size="sm"
                        className="rounded-xl"
                        onClick={() => {
                          setConfirmedUsername(lookup.username);
                          form.clearErrors("username");
                          form.setValue("username", lookup.username, { shouldValidate: true, shouldTouch: true });
                        }}
                      >
                        {confirmedUsername?.toLowerCase() === lookup.username.toLowerCase() ? "Selected" : "Select"}
                      </Button>
                    </div>
                  </div>
                ) : null}

                {lookup.status === "not_found" ? (
                  <p className="text-xs text-destructive">{lookup.message}</p>
                ) : null}

                {form.formState.errors.username ? (
                  <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>
                ) : null}

                {!form.formState.errors.username && confirmedUsername ? (
                  <p className="text-xs text-muted-foreground">
                    Selected username: <span className="font-medium text-foreground">@{confirmedUsername}</span>
                  </p>
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

              <Button type="submit" variant="brand" size="pill" className="w-full" disabled={!canContinue}>
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

