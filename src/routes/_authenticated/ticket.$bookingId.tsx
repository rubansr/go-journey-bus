import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Armchair,
  ArrowLeft,
  BusFront,
  CheckCircle2,
  Clock,
  Download,
  MapPin,
  MessageCircle,
  Printer,
  Share2,
  Wallet,
  WifiOff,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SosSafety } from "@/components/sos-safety";
import { supabase } from "@/integrations/supabase/client";
import { durationLabel, formatDay, formatTime, inr } from "@/lib/booking";
import { saveOfflineTicket } from "@/lib/offline-tickets";
import { downloadTicketPdf, qrDataUrl, ticketSummary, whatsappShareUrl, type TicketData } from "@/lib/ticket-pdf";
import { trackTrip } from "@/lib/tracking";
import { useI18n } from "@/lib/i18n";


export const Route = createFileRoute("/_authenticated/ticket/$bookingId")({
  head: () => ({
    meta: [
      { title: "Your e-ticket & live bus tracking — NXTIXA Go" },
      {
        name: "description",
        content: "QR e-ticket, live bus location, current stop, estimated arrival and refund status for your trip.",
      },
      { property: "og:title", content: "Your e-ticket & live bus tracking — NXTIXA Go" },
      { property: "og:description", content: "Track your bus live and show your QR e-ticket at boarding." },
    ],
  }),
  component: TicketPage,
});

type Passenger = { seat?: string; name?: string; age?: string; gender?: string };

function TicketPage() {
  const { bookingId } = useParams({ from: "/_authenticated/ticket/$bookingId" });
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => new Date());
  const [cancelling, setCancelling] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, trips(*, operators(name, rating))")
        .eq("id", bookingId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Simulated live movement: recompute position every 15 seconds.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15000);
    return () => window.clearInterval(id);
  }, []);

  // Real updates pushed by operators (delay, status) arrive over realtime.
  const tripId = booking?.trip_id;
  useEffect(() => {
    if (!tripId) return;
    const channel = supabase
      .channel(`trip-${tripId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "trips", filter: `id=eq.${tripId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tripId, bookingId, queryClient]);

  async function cancelTicket() {
    setCancelling(true);
    const { error } = await supabase.rpc("cancel_booking", { p_booking_id: bookingId });
    setCancelling(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("refund_note"));
    await queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
    await queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    await queryClient.invalidateQueries({ queryKey: ["wallet"] });
    await queryClient.invalidateQueries({ queryKey: ["wallet-txns"] });
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-10">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (!booking || !booking.trips) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">{t("ticket_not_found")}</h1>
        <Button asChild className="mt-5">
          <Link to="/bookings">{t("my_tickets")}</Link>
        </Button>
      </div>
    );
  }

  const trip = booking.trips;
  const cancelled = booking.status === "cancelled";
  const passengers = (booking.passengers as Passenger[]) ?? [];
  const track = trackTrip(
    {
      depart_at: trip.depart_at,
      arrive_at: trip.arrive_at,
      delay_mins: trip.delay_mins,
      trip_status: trip.trip_status,
      boarding_points: trip.boarding_points ?? [],
      dropping_points: trip.dropping_points ?? [],
      from_city: trip.from_city,
      to_city: trip.to_city,
      tracking_note: trip.tracking_note,
    },
    now,
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <Link to="/bookings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {t("my_tickets")}
      </Link>

      <div className="mt-4 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl font-bold sm:text-2xl">
                  {trip.from_city} → {trip.to_city}
                </h1>
                <Badge variant={cancelled ? "destructive" : "secondary"}>
                  {cancelled ? t("cancelled") : t("confirmed")}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {trip.operators?.name} · {trip.bus_type} · {formatDay(trip.depart_at)} · {formatTime(trip.depart_at)} –{" "}
                {formatTime(trip.arrive_at)} ({durationLabel(trip.depart_at, trip.arrive_at)})
              </p>
              <p className="mt-2 font-mono text-sm">PNR {booking.pnr}</p>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <span className="flex items-center gap-2">
                  <Armchair className="size-4 text-primary" /> {booking.seats.join(", ")}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin className="size-4 text-primary" /> {booking.boarding_point} → {booking.dropping_point}
                </span>
                <span className="flex items-center gap-2">
                  <Wallet className="size-4 text-primary" /> {inr(Number(booking.total_amount))} ·{" "}
                  {booking.payment_method}
                </span>
                {Number(booking.wallet_amount) > 0 && (
                  <span className="text-muted-foreground">
                    {t("paid_from_wallet")}: {inr(Number(booking.wallet_amount))}
                  </span>
                )}
              </div>

              <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                {passengers.map((p, i) => (
                  <li key={i}>
                    {p.seat}: {p.name} · {p.age} · {p.gender}
                  </li>
                ))}
              </ul>

              {cancelled && (
                <div className="mt-4 rounded-xl border border-border bg-muted/50 p-4 text-sm">
                  <p className="font-semibold">{t("refund_status")}</p>
                  <p className="mt-1 text-muted-foreground">
                    {booking.refund_status === "credited"
                      ? `${t("refund_credited")} — ${inr(Number(booking.refund_amount))}`
                      : t("refund_not_eligible")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <BusFront className="size-5 text-primary" /> {t("live_tracking")}
                </h2>
                <Badge variant={track.delayMins > 0 ? "destructive" : "secondary"}>{track.statusLabel}</Badge>
              </div>

              <div className="mt-5">
                <div className="relative h-2 rounded-full bg-muted">
                  <div
                    className="brand-gradient absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                    style={{ width: `${Math.round(track.progress * 100)}%` }}
                    role="progressbar"
                    aria-valuenow={Math.round(track.progress * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={t("journey_progress")}
                  />
                  <span
                    className="absolute -top-2.5 flex size-7 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-background shadow transition-all duration-700"
                    style={{ left: `${Math.round(track.progress * 100)}%` }}
                    aria-hidden
                  >
                    <BusFront className="size-4 text-primary" />
                  </span>
                </div>
                <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                  <span>{trip.from_city}</span>
                  <span>
                    {Math.round(track.progress * 100)}% · {t("eta")} {formatTime(track.etaAt.toISOString())}
                  </span>
                  <span>{trip.to_city}</span>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Stat label={t("current_stop")} value={track.currentStop} icon={<MapPin className="size-4" />} />
                <Stat label={t("next_stop")} value={track.nextStop ?? trip.to_city} icon={<BusFront className="size-4" />} />
                <Stat
                  label={t("eta")}
                  value={`${formatTime(track.etaAt.toISOString())}${track.delayMins > 0 ? ` (+${track.delayMins}m)` : ""}`}
                  icon={<Clock className="size-4" />}
                />
              </div>

              {(track.delayMins > 0 || trip.tracking_note) && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
                  <AlertTriangle className="mt-0.5 size-4 text-destructive" />
                  <p>{trip.tracking_note || `${t("delay_alert")} ${track.delayMins} ${t("minutes")}`}</p>
                </div>
              )}

              <ol className="mt-6 space-y-4">
                {track.stops.map((s, i) => (
                  <li key={`${s.name}-${i}`} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={
                          s.reached
                            ? "flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                            : "flex size-6 items-center justify-center rounded-full border border-border bg-background"
                        }
                      >
                        {s.reached ? <CheckCircle2 className="size-3.5" /> : <span className="size-2 rounded-full bg-muted-foreground/50" />}
                      </span>
                      {i < track.stops.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                    </div>
                    <div className="pb-1">
                      <p className={s.current ? "text-sm font-semibold" : "text-sm"}>{s.name}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(s.at.toISOString())}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-xs text-muted-foreground">{t("tracking_demo_note")}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardContent className="flex flex-col items-center gap-3 p-6">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`NXTIXA-${booking.pnr}`)}`}
              alt={`QR e-ticket for PNR ${booking.pnr}`}
              width={200}
              height={200}
              className="rounded-xl border border-border bg-white p-2"
            />
            <p className="text-xs text-muted-foreground">{t("show_at_boarding")}</p>
            <div className="mt-2 flex w-full flex-col gap-2">
              <Button
                className="gap-2"
                onClick={async () => {
                  await downloadTicketPdf(ticketData);
                  toast.success(t("pdf_ready"));
                }}
              >
                <Download className="size-4" /> {t("download_pdf")}
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => window.print()}>
                <Printer className="size-4" /> {t("print_ticket")}
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <a
                  href={whatsappShareUrl(
                    ticketData,
                    typeof window !== "undefined" ? window.location.href : undefined,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="size-4" /> {t("send_whatsapp")}
                </a>
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={async () => {
                  saveOfflineTicket(ticketData, await qrDataUrl(booking.pnr));
                  toast.success(t("saved_offline"));
                }}
              >
                <WifiOff className="size-4" /> {t("save_offline")}
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  void navigator.clipboard?.writeText(ticketSummary(ticketData));
                  toast.success(t("copied"));
                }}
              >
                <Share2 className="size-4" /> {t("share_ticket")}
              </Button>
              {!cancelled && (
                <Button variant="destructive" onClick={cancelTicket} disabled={cancelling}>
                  {t("cancel_ticket")}
                </Button>
              )}
            </div>
            {!cancelled && <p className="text-center text-xs text-muted-foreground">{t("refund_policy")}</p>}
            <p className="text-center text-xs text-muted-foreground">{t("offline_note")}</p>
          </CardContent>
        </Card>
      </div>

      {!cancelled && (
        <div className="mt-5 lg:max-w-md">
          <SosSafety
            bookingId={booking.id}
            tripLabel={`${trip.from_city} → ${trip.to_city} (PNR ${booking.pnr})`}
            seats={booking.seats}
          />
        </div>
      )}
    </div>
  );
}



function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon} {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
