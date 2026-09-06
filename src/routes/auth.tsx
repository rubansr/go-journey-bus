import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bus, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useSession } from "@/hooks/use-session";
import { useI18n } from "@/lib/i18n";

type Search = { redirect?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): Search =>
    typeof search["redirect"] === "string" && search["redirect"].startsWith("/")
      ? { redirect: search["redirect"] }
      : {},
  head: () => ({
    meta: [
      { title: "Sign in — NXTIXA Go" },
      { name: "description", content: "Sign in to manage your bus tickets, wallet refunds and saved passengers." },
      { property: "og:title", content: "Sign in — NXTIXA Go" },
      { property: "og:description", content: "Manage bus tickets, refunds and saved passengers." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useSession();
  const { redirect } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: redirect ?? "/bookings", replace: true });
  }, [user, navigate, redirect]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Signed in");
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: fullName, phone },
        },
      });
      setBusy(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      if (!data.session) setCheckEmail(true);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-16 lg:grid-cols-2">
      <div className="hidden lg:block">
        <span className="brand-gradient flex size-12 items-center justify-center rounded-2xl text-primary-foreground">
          <Bus className="size-6" aria-hidden />
        </span>
        <h1 className="mt-6 text-3xl font-bold">Travel with confidence</h1>
        <p className="mt-3 text-muted-foreground">
          Your tickets, refunds and saved passengers stay in one secure place. Refunds land straight into your NXTIXA
          wallet.
        </p>
        <p className="mt-6 flex items-center gap-2 text-sm text-success">
          <ShieldCheck className="size-4" /> Encrypted accounts · device verification alerts
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold">{mode === "signin" ? t("welcome_back") : t("create_account")}</h2>

          {checkEmail ? (
            <p className="mt-6 rounded-xl bg-muted p-4 text-sm">
              We sent a confirmation link to <span className="font-semibold">{email}</span>. Confirm it to finish
              creating your account.
            </p>
          ) : (
            <>
              <Button variant="outline" className="mt-5 h-11 w-full" onClick={google} type="button">
                {t("continue_google")}
              </Button>

              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={submit} className="space-y-4">
                {mode === "signup" && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="fullname">{t("name")}</Label>
                      <Input id="fullname" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="mobile">{t("phone")}</Label>
                      <Input id="mobile" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                  </>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">{t("password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="h-11 w-full font-semibold" disabled={busy}>
                  {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {mode === "signin" ? t("sign_in") : t("create_account")}
                </Button>
              </form>

              <button
                type="button"
                className="mt-4 w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              >
                {mode === "signin" ? "New to NXTIXA Go? Create an account" : "Already have an account? Sign in"}
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
