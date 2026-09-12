import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BrainCircuit, CreditCard, Loader2, Lock, ShieldCheck, Sparkles } from "lucide-react";

import { OperatorReviews } from "@/components/operator-reviews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import {
  buildSeatMap,
  durationLabel,
  formatDay,
  formatTime,
  inr,
  recommendSeats,
} from "@/lib/booking";
import { useI18n } from "@/lib/i18n";
import { useWalletBalance } from "@/hooks/use-wallet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trip/$tripId")({
  head: () => ({
    meta: [
      { title: "Choose your seats — NXTIXA Go" },
      { name: "description", content: "Pick seats with AI help, add passengers and pay securely for your bus trip." },
      { property: "og:title", content: "Choose your seats — NXTIXA Go" },
      { property: "og:description", content: "Pick seats with AI help, add passengers and pay securely." },
    ],
  }),
  component: TripPage,
});

type Passenger = { name: string; age: string; gender: "male" | "female" | "other" };

const PAYMENTS = ["UPI", "Debit card", "Credit card", "Net banking", "NXTIXA wallet"];

function TripPage() {
  const { tripId } = Route.useParams();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useSession();

  const [selected, setSelected] = useState<string[]>([]);
  const [passengers, setPassengers] = useState<Record<string, Passenger>>({});
  const [boarding, setBoarding] = useState("");
  const [dropping, setDropping] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [payment, setPayment] = useState("UPI");
  const [useWallet, setUseWallet] = useState(false);
  const queryClient = useQueryClient();
  const { data: walletBalance = 0 } = useWalletBalance();
  const [womenSafety, setWomenSafety] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: trip, isLoading, refetch } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*, operators(name, rating, verified, review_count, trust_score)")
        .eq("id", tripId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const seats = useMemo(() => buildSeatMap(trip?.total_seats ?? 36), [trip?.total_seats]);
  const booked = trip?.booked_seats ?? [];
  const fare = Number(trip?.fare ?? 0);
  const base = fare * selected.length;
  const gst = Math.round(base * 0.05);
  const total = base + gst;

  function toggleSeat(id: string) {
    if (booked.includes(id)) return;
    setSelected((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((s) => s !== id);
        setPassengers((p) => {
          const copy = { ...p };
          delete copy[id];
          return copy;
        });
        return next;
      }
      if (prev.length >= 6) {
        toast.error("You can book up to 6 seats at a time.");
        return prev;
      }
      return [...prev, id];
    });
  }

  function aiPick() {
    const count = Math.max(1, selected.length || 1);
    const picks = recommendSeats(seats, booked, count, { window: true, womenSafety });
    setSelected(picks);
    setPassengers({});
    toast.success(`AI selected ${picks.join(", ")} for you`);
  }

  async function confirmBooking() {
    if (!user) {
      toast.info("Please sign in to complete your booking.");
      navigate({ to: "/auth", search: { redirect: `/trip/${tripId}` } });
      return;
    }
    if (selected.length === 0) {
      toast.error("Select at least one seat.");
      return;
    }
    if (!boarding || !dropping) {
      toast.error("Choose boarding and dropping points.");
      return;
    }
    for (const seat of selected) {
      const p = passengers[seat];
      if (!p?.name || !p.age) {
        toast.error(`Add passenger details for seat ${seat}.`);
        return;
      }
    }
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      toast.error("Enter a valid mobile number.");
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.rpc("book_trip", {
      p_trip_id: tripId,
      p_seats: selected,
      p_passengers: selected.map((s) => ({ seat: s, ...passengers[s] })),
      p_boarding: boarding,
      p_dropping: dropping,
      p_contact_email: email || user.email || "",
      p_contact_phone: phone,
      p_payment_method: payment,
      p_use_wallet: useWallet,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      void refetch();
      return;
    }
    const booking = data as unknown as { id: string; pnr: string };
    await queryClient.invalidateQueries({ queryKey: ["wallet"] });
    toast.success(`${t("booking_confirmed")} · PNR ${booking.pnr}`);
    navigate({ to: "/ticket/$bookingId", params: { bookingId: booking.id } });
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-10">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">This trip is no longer available</h1>
        <Button asChild className="mt-6">
          <Link to="/">Back home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      {/* Trip summary */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-bold">
                {trip.from_city} → {trip.to_city}
              </h1>
              {trip.operators?.verified && (
                <Badge variant="secondary" className="gap-1 text-success">
                  <ShieldCheck className="size-3.5" /> Verified
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {trip.operators?.name} · {trip.bus_type} · {formatDay(trip.depart_at)} ·{" "}
              {formatTime(trip.depart_at)} – {formatTime(trip.arrive_at)} (
              {durationLabel(trip.depart_at, trip.arrive_at)})
            </p>
          </div>
          <p className="text-2xl font-bold">{inr(fare)}<span className="text-sm font-normal text-muted-foreground"> / seat</span></p>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Seat map */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{t("select_seats")}</h2>
              <Button variant="outline" size="sm" className="gap-2" onClick={aiPick}>
                <BrainCircuit className="size-4" /> {t("ai_recommend")}
              </Button>
            </div>

            <label className="mt-4 flex items-center gap-3 rounded-xl border border-border p-3">
              <Switch checked={womenSafety} onCheckedChange={setWomenSafety} id="women-safety" />
              <span className="text-sm">
                <span className="font-medium">Women safety preference</span>
                <span className="block text-xs text-muted-foreground">
                  Prioritise front rows near the driver and conductor.
                </span>
              </span>
            </label>

            <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-4">
              <p className="mb-3 text-right text-xs text-muted-foreground">Driver ↑</p>
              <div className="mx-auto grid max-w-xs gap-2">
                {Array.from({ length: Math.ceil(seats.length / 4) }).map((_, r) => (
                  <div key={r} className="grid grid-cols-[1fr_1fr_1.2rem_1fr_1fr] items-center gap-2">
                    {[0, 1].map((c) => (
                      <SeatButton
                        key={c}
                        seat={seats[r * 4 + c]}
                        booked={booked}
                        selected={selected}
                        onToggle={toggleSeat}
                      />
                    ))}
                    <span />
                    {[2, 3].map((c) => (
                      <SeatButton
                        key={c}
                        seat={seats[r * 4 + c]}
                        booked={booked}
                        selected={selected}
                        onToggle={toggleSeat}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <Legend className="border-border bg-background" label={t("available")} />
              <Legend className="border-transparent bg-primary" label={t("selected")} />
              <Legend className="border-transparent bg-muted-foreground/40" label={t("booked")} />
            </div>
          </CardContent>
        </Card>

        {/* Booking form */}
        <div className="space-y-6">
          {selected.length > 0 && (
            <Card>
              <CardContent className="space-y-4 p-6">
                <h2 className="text-lg font-semibold">{t("passengers")}</h2>
                {selected.map((seat) => (
                  <div key={seat} className="rounded-xl border border-border p-4">
                    <p className="mb-3 text-sm font-semibold">Seat {seat}</p>
                    <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
                      <div className="space-y-1.5">
                        <Label htmlFor={`name-${seat}`}>{t("name")}</Label>
                        <Input
                          id={`name-${seat}`}
                          value={passengers[seat]?.name ?? ""}
                          onChange={(e) =>
                            setPassengers((p) => ({
                              ...p,
                              [seat]: { gender: "male", age: "", ...p[seat], name: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`age-${seat}`}>{t("age")}</Label>
                        <Input
                          id={`age-${seat}`}
                          inputMode="numeric"
                          value={passengers[seat]?.age ?? ""}
                          onChange={(e) =>
                            setPassengers((p) => ({
                              ...p,
                              [seat]: { gender: "male", name: "", ...p[seat], age: e.target.value },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {(["male", "female", "other"] as const).map((g) => (
                        <Button
                          key={g}
                          type="button"
                          size="sm"
                          variant={(passengers[seat]?.gender ?? "male") === g ? "default" : "outline"}
                          onClick={() =>
                            setPassengers((p) => ({
                              ...p,
                              [seat]: { name: "", age: "", ...p[seat], gender: g },
                            }))
                          }
                        >
                          {t(g)}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="text-lg font-semibold">Points & contact</h2>
              <div className="space-y-1.5">
                <Label htmlFor="boarding">{t("boarding")}</Label>
                <select
                  id="boarding"
                  value={boarding}
                  onChange={(e) => setBoarding(e.target.value)}
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">—</option>
                  {trip.boarding_points.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dropping">{t("dropping")}</Label>
                <select
                  id="dropping"
                  value={dropping}
                  onChange={(e) => setDropping(e.target.value)}
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">—</option>
                  {trip.dropping_points.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">{t("phone")}</Label>
                  <Input id="phone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="text-lg font-semibold">{t("payment")}</h2>
              <div className="flex flex-wrap gap-2">
                {PAYMENTS.map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={payment === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPayment(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>

              <div className="rounded-xl border border-border p-4 text-sm">
                <p className="mb-2 font-semibold">{t("fare_breakdown")}</p>
                <Row label={`${t("base_fare")} × ${selected.length || 0}`} value={inr(base)} />
                <Row label={t("gst")} value={inr(gst)} />
                {walletBalance > 0 && (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-muted/60 p-3">
                    <label htmlFor="use-wallet" className="text-sm">
                      <span className="font-medium">{t("use_wallet")}</span>
                      <span className="block text-xs text-muted-foreground">
                        {t("wallet_balance")}: {inr(walletBalance)}
                      </span>
                    </label>
                    <Switch id="use-wallet" checked={useWallet} onCheckedChange={setUseWallet} />
                  </div>
                )}
                {useWallet && walletBalance > 0 && (
                  <div className="mt-2">
                    <Row label={t("paid_from_wallet")} value={`- ${inr(Math.min(walletBalance, total))}`} />
                  </div>
                )}
                <div className="mt-2 border-t border-border pt-2">
                  <Row label={t("total")} value={inr(total)} strong />
                  {useWallet && walletBalance > 0 && (
                    <Row label={t("payable_now")} value={inr(Math.max(0, total - walletBalance))} />
                  )}
                </div>
              </div>

              <Button
                size="lg"
                className="h-12 w-full gap-2 text-base font-semibold"
                onClick={confirmBooking}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                {t("pay_now")}
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="size-3.5" /> Fraud-scored, encrypted checkout · <Sparkles className="size-3.5" />{" "}
                instant e-ticket
              </p>
            </CardContent>
          </Card>
         </div>
      </div>

      {trip.operator_id && (
        <div className="mt-6">
          <OperatorReviews operatorId={trip.operator_id} trustScore={trip.operators?.trust_score} />
        </div>
      )}
    </div>
  );
}

function SeatButton({
  seat,
  booked,
  selected,
  onToggle,
}: {
  seat: { id: string; window: boolean } | undefined;
  booked: string[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  if (!seat) return <span />;
  const isBooked = booked.includes(seat.id);
  const isSelected = selected.includes(seat.id);
  return (
    <button
      type="button"
      onClick={() => onToggle(seat.id)}
      disabled={isBooked}
      aria-pressed={isSelected}
      aria-label={`Seat ${seat.id}${seat.window ? " window" : ""}${isBooked ? " booked" : ""}`}
      className={cn(
        "h-11 rounded-lg border text-xs font-semibold transition",
        isBooked && "cursor-not-allowed bg-muted-foreground/30 text-muted-foreground",
        isSelected && "border-transparent bg-primary text-primary-foreground",
        !isBooked && !isSelected && "border-border bg-background hover:border-primary hover:text-primary",
      )}
    >
      {seat.id}
    </button>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={cn("size-4 rounded border", className)} /> {label}
    </span>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between py-0.5", strong && "text-base font-bold")}>
      <span className={cn(!strong && "text-muted-foreground")}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
