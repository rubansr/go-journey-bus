import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Armchair, Download, MapPin, Navigation, Share2, Wallet } from "lucide-react";

import { ReviewForm } from "@/components/review-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { durationLabel, formatDay, formatTime, inr, todayISO } from "@/lib/booking";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/bookings")({
  head: () => ({
    meta: [
      { title: "My tickets — NXTIXA Go" },
      { name: "description", content: "View your bus e-tickets, QR codes, boarding points and refund status." },
      { property: "og:title", content: "My tickets — NXTIXA Go" },
      { property: "og:description", content: "Your bus e-tickets, QR codes and refund status." },
    ],
  }),
  component: BookingsPage,
});

type Passenger = { seat?: string; name?: string; age?: string; gender?: string };

function BookingsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, trips(*, operators(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function cancel(id: string) {
    const { error } = await supabase.rpc("cancel_booking", { p_booking_id: id });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("refund_note"));
    await queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    await queryClient.invalidateQueries({ queryKey: ["wallet"] });
    await queryClient.invalidateQueries({ queryKey: ["wallet-txns"] });
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold sm:text-3xl">{t("my_tickets")}</h1>

      <div className="mt-6 space-y-5">
        {isLoading && Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}

        {!isLoading && (data ?? []).length === 0 && (
          <Card>
            <CardContent className="p-10 text-center">
              <p className="text-muted-foreground">{t("no_tickets")}</p>
              <Button asChild className="mt-5">
                <Link to="/search" search={{ from: "Chennai", to: "Coimbatore", date: todayISO(), pax: 1 }}>
                  {t("search_buses")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {(data ?? []).map((b) => {
          const trip = b.trips;
          const cancelled = b.status === "cancelled";
          const passengers = (b.passengers as Passenger[]) ?? [];
          const completed = !cancelled && !!trip && new Date(trip.arrive_at).getTime() < Date.now();
          return (
            <Card key={b.id} className={cancelled ? "opacity-70" : undefined}>
              <CardContent className="grid gap-6 p-6 sm:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-bold">
                      {trip?.from_city} → {trip?.to_city}
                    </h2>
                    <Badge variant={cancelled ? "destructive" : "secondary"}>
                      {cancelled ? t("cancelled") : t("confirmed")}
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">PNR {b.pnr}</span>
                  </div>

                  {trip && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {trip.operators?.name} · {trip.bus_type} · {formatDay(trip.depart_at)} ·{" "}
                      {formatTime(trip.depart_at)} – {formatTime(trip.arrive_at)} (
                      {durationLabel(trip.depart_at, trip.arrive_at)})
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <span className="flex items-center gap-1.5">
                      <Armchair className="size-4 text-primary" /> {b.seats.join(", ")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-4 text-primary" /> {b.boarding_point} → {b.dropping_point}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Wallet className="size-4 text-primary" /> {inr(Number(b.total_amount))} · {b.payment_method}
                    </span>
                  </div>

                  <ul className="mt-3 text-sm text-muted-foreground">
                    {passengers.map((p, i) => (
                      <li key={i}>
                        {p.seat}: {p.name} · {p.age} · {p.gender}
                      </li>
                    ))}
                  </ul>

                  {cancelled && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {t("refund_status")}:{" "}
                      {b.refund_status === "credited"
                        ? `${t("refund_credited")} — ${inr(Number(b.refund_amount))}`
                        : t("refund_not_eligible")}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button asChild size="sm" className="gap-2">
                      <Link to="/ticket/$bookingId" params={{ bookingId: b.id }}>
                        <Navigation className="size-4" /> {t("view_ticket")}
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
                      <Download className="size-4" /> PDF ticket
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        void navigator.clipboard?.writeText(`NXTIXA Go PNR ${b.pnr} · ${trip?.from_city} → ${trip?.to_city}`);
                        toast.success("Ticket details copied to share");
                      }}
                    >
                      <Share2 className="size-4" /> Share
                    </Button>
                    {!cancelled && !completed && (
                      <Button variant="destructive" size="sm" onClick={() => cancel(b.id)}>
                        {t("cancel_ticket")}
                      </Button>
                    )}
                  </div>

                  {completed && trip && (
                    <ReviewForm
                      bookingId={b.id}
                      tripId={trip.id}
                      operatorId={trip.operator_id}
                      operatorName={trip.operators?.name}
                    />
                  )}
                </div>

                <div className="flex flex-col items-center justify-center gap-2">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`NXTIXA-${b.pnr}`)}`}
                    alt={`QR code for ticket ${b.pnr}`}
                    width={160}
                    height={160}
                    loading="lazy"
                    className="rounded-xl border border-border bg-white p-2"
                  />
                  <p className="text-xs text-muted-foreground">Show this at boarding</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
