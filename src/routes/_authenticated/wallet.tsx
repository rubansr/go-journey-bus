import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, Loader2, Plus, WalletMinimal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useWalletBalance } from "@/hooks/use-wallet";
import { inr } from "@/lib/booking";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({
    meta: [
      { title: "NXTIXA wallet — instant refunds & faster checkout" },
      {
        name: "description",
        content: "Add money to your NXTIXA Go wallet, pay for bus tickets in one tap and track every refund.",
      },
      { property: "og:title", content: "NXTIXA wallet — instant refunds & faster checkout" },
      { property: "og:description", content: "Wallet balance, top-ups, ticket payments and refund history." },
    ],
  }),
  component: WalletPage,
});

const QUICK = [200, 500, 1000, 2000];
const METHODS = ["UPI", "Debit card", "Credit card", "Net banking"];

function WalletPage() {
  const { t } = useI18n();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const { data: balance = 0, isLoading } = useWalletBalance();
  const [amount, setAmount] = useState("500");
  const [method, setMethod] = useState("UPI");
  const [busy, setBusy] = useState(false);

  const { data: txns, isLoading: loadingTx } = useQuery({
    queryKey: ["wallet-txns", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  async function topUp() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error(t("enter_amount"));
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("topup_wallet", { p_amount: value, p_method: method });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${inr(value)} ${t("added_to_wallet")}`);
    await queryClient.invalidateQueries({ queryKey: ["wallet"] });
    await queryClient.invalidateQueries({ queryKey: ["wallet-txns"] });
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{t("wallet")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("wallet_sub")}</p>

      <div className="mt-6 grid gap-5 md:grid-cols-[1fr_1.1fr]">
        <Card className="brand-gradient text-primary-foreground">
          <CardContent className="p-6">
            <p className="flex items-center gap-2 text-sm opacity-90">
              <WalletMinimal className="size-4" /> {t("wallet_balance")}
            </p>
            {isLoading ? (
              <Skeleton className="mt-3 h-10 w-40 bg-white/30" />
            ) : (
              <p className="mt-2 font-display text-4xl font-bold">{inr(balance)}</p>
            )}
            <p className="mt-4 text-xs opacity-90">{t("wallet_note")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="text-lg font-semibold">{t("add_money")}</h2>
            <div className="flex flex-wrap gap-2">
              {QUICK.map((q) => (
                <Button key={q} type="button" variant="outline" size="sm" onClick={() => setAmount(String(q))}>
                  + {inr(q)}
                </Button>
              ))}
            </div>
            <div>
              <Label htmlFor="amount">{t("amount")}</Label>
              <Input
                id="amount"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
                className="mt-1 h-11"
              />
            </div>
            <div>
              <Label htmlFor="method">{t("payment")}</Label>
              <select
                id="method"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {METHODS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
            <Button className="h-11 w-full gap-2" onClick={topUp} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {t("add_money")}
            </Button>
            <p className="text-center text-xs text-muted-foreground">{t("demo_payment")}</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="mt-10 text-lg font-semibold">{t("transactions")}</h2>
      <div className="mt-3 space-y-2">
        {loadingTx && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        {!loadingTx && (txns ?? []).length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">{t("no_transactions")}</CardContent>
          </Card>
        )}
        {(txns ?? []).map((tx) => {
          const credit = Number(tx.amount) >= 0;
          return (
            <Card key={tx.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <span
                  className={
                    credit
                      ? "flex size-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600"
                      : "flex size-9 items-center justify-center rounded-full bg-destructive/15 text-destructive"
                  }
                >
                  {credit ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.created_at).toLocaleString()} · {tx.kind}
                  </p>
                </div>
                <p className={credit ? "font-semibold text-emerald-600" : "font-semibold"}>
                  {credit ? "+" : "−"} {inr(Math.abs(Number(tx.amount)))}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
