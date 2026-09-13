import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ClientOnly } from "@tanstack/react-router";
import { toast } from "sonner";
import { AlertTriangle, BusFront, Compass, Gauge, MapPin, Radio, RotateCcw, Timer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { formatTime } from "@/lib/booking";
import {
  compass,
  distanceKm,
  etaFromGps,
  isGpsFresh,
  lastUpdatedLabel,
  routeProgress,
  type LatLng,
  type Ping,
} from "@/lib/gps";
import { useI18n } from "@/lib/i18n";

const LiveMap = React.lazy(() => import("@/components/live-map"));

export type LiveTrackingTrip = {
  id: string;
  from_city: string;
  to_city: string;
  from_location_id: string | null;
  to_location_id: string | null;
  depart_at: string;
  arrive_at: string;
  delay_mins: number;
  bus_number: string;
};

export function LiveTracking({ trip, boardingPoint }: { trip: LiveTrackingTrip; boardingPoint?: string | null }) {
  const { t } = useI18n();
  const [now, setNow] = React.useState(() => new Date());
  const [replayIndex, setReplayIndex] = React.useState<number | null>(null);
  const alerted = React.useRef<{ boarding?: boolean; delay?: boolean }>({});

  React.useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15000);
    return () => window.clearInterval(id);
  }, []);

  const { data: pings, isLoading } = useQuery({
    queryKey: ["bus-locations", trip.id],
    refetchInterval: 8000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bus_locations")
        .select("*")
        .eq("trip_id", trip.id)
        .order("recorded_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return ((data ?? []) as Ping[]).slice().reverse();
    },
  });

  const { data: ends } = useQuery({
    queryKey: ["trip-ends", trip.from_location_id, trip.to_location_id, trip.from_city, trip.to_city],
    queryFn: async () => {
      const ids = [trip.from_location_id, trip.to_location_id].filter(Boolean) as string[];
      if (ids.length === 2) {
        const { data, error } = await supabase.from("locations").select("id,lat,lng").in("id", ids);
        if (error) throw error;
        const find = (id: string | null) => data?.find((d) => d.id === id);
        const a = find(trip.from_location_id);
        const b = find(trip.to_location_id);
        return {
          from: a?.lat != null && a.lng != null ? { lat: a.lat, lng: a.lng } : null,
          to: b?.lat != null && b.lng != null ? { lat: b.lat, lng: b.lng } : null,
        };
      }
      const { data, error } = await supabase
        .from("locations")
        .select("name_en,lat,lng")
        .in("name_en", [trip.from_city, trip.to_city]);
      if (error) throw error;
      const pick = (name: string) => {
        const row = data?.find((d) => d.name_en === name);
        return row?.lat != null && row.lng != null ? { lat: row.lat, lng: row.lng } : null;
      };
      return { from: pick(trip.from_city), to: pick(trip.to_city) };
    },
  });

  const trail: LatLng[] = (pings ?? []).map((p) => ({ lat: p.lat, lng: p.lng }));
  const viewIndex = replayIndex ?? (trail.length ? trail.length - 1 : -1);
  const latest = pings && pings.length ? pings[pings.length - 1] : undefined;
  const viewed = pings && viewIndex >= 0 ? pings[viewIndex] : undefined;
  const live = isGpsFresh(latest?.recorded_at, now);

  const from = ends?.from ?? null;
  const to = ends?.to ?? null;
  const busPos = viewed ? { lat: viewed.lat, lng: viewed.lng } : null;

  const eta = busPos && to ? etaFromGps(busPos, to, Number(latest?.speed_kmph ?? 0), now) : null;
  const progress =
    busPos && from && to
      ? routeProgress(busPos, from, to)
      : Math.min(
          1,
          Math.max(
            0,
            (now.getTime() - new Date(trip.depart_at).getTime()) /
              Math.max(1, new Date(trip.arrive_at).getTime() - new Date(trip.depart_at).getTime()),
          ),
        );

  const scheduledArrive = new Date(new Date(trip.arrive_at).getTime() + (trip.delay_mins ?? 0) * 60000);
  const detectedDelay = eta ? Math.round((eta.at.getTime() - scheduledArrive.getTime()) / 60000) : trip.delay_mins ?? 0;

  // Boarding-point arrival alert + delay detection alert
  React.useEffect(() => {
    if (!live || !busPos || !from) return;
    const kmToStart = distanceKm(busPos, from);
    if (!alerted.current.boarding && kmToStart < 8 && now < new Date(trip.depart_at)) {
      alerted.current.boarding = true;
      toast.info(`${t("boarding_alert")} ${boardingPoint ?? trip.from_city}`);
    }
    if (!alerted.current.delay && detectedDelay > 10) {
      alerted.current.delay = true;
      toast.warning(`${t("delay_alert")} ${detectedDelay} ${t("minutes")}`);
    }
  }, [live, busPos, from, detectedDelay, now, trip.depart_at, trip.from_city, boardingPoint, t]);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Radio className={live ? "size-5 animate-pulse text-primary" : "size-5 text-muted-foreground"} />
            {t("gps_live_tracking")}
          </h2>
          <Badge variant={live ? "secondary" : "outline"}>{live ? t("gps_live") : t("gps_waiting")}</Badge>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          {t("bus_number")} {trip.bus_number} · {t("last_updated")} {lastUpdatedLabel(latest?.recorded_at, now)}
        </p>

        <div className="mt-4">
          {isLoading ? (
            <Skeleton className="h-72 rounded-xl" />
          ) : (
            <ClientOnly fallback={<Skeleton className="h-72 rounded-xl" />}>
              <React.Suspense fallback={<Skeleton className="h-72 rounded-xl" />}>
                <LiveMap
                  bus={busPos}
                  from={from}
                  to={to}
                  trail={trail.slice(0, viewIndex + 1)}
                  fromLabel={trip.from_city}
                  toLabel={trip.to_city}
                  follow={replayIndex === null}
                />
              </React.Suspense>
            </ClientOnly>
          )}
        </div>

        <div className="mt-5">
          <div className="relative h-2 rounded-full bg-muted">
            <div
              className="brand-gradient absolute inset-y-0 left-0 rounded-full transition-all duration-700"
              style={{ width: `${Math.round(progress * 100)}%` }}
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t("journey_progress")}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{trip.from_city}</span>
            <span>{Math.round(progress * 100)}%</span>
            <span>{trip.to_city}</span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={<Gauge className="size-4" />} label={t("current_speed")} value={`${Math.round(Number(latest?.speed_kmph ?? 0))} km/h`} />
          <Stat
            icon={<Compass className="size-4" />}
            label={t("direction")}
            value={latest ? compass(Number(latest.heading)) : "—"}
          />
          <Stat
            icon={<MapPin className="size-4" />}
            label={t("distance_remaining")}
            value={eta ? `${eta.remainingKm.toFixed(0)} km` : "—"}
          />
          <Stat
            icon={<Timer className="size-4" />}
            label={t("eta")}
            value={eta ? formatTime(eta.at.toISOString()) : formatTime(scheduledArrive.toISOString())}
          />
        </div>

        {detectedDelay > 10 && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <AlertTriangle className="mt-0.5 size-4 text-destructive" />
            <p>
              {t("delay_alert")} {detectedDelay} {t("minutes")}
            </p>
          </div>
        )}

        {trail.length > 1 && (
          <div className="mt-5 rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <RotateCcw className="size-4 text-primary" /> {t("route_replay")}
              </p>
              <Button variant="ghost" size="sm" onClick={() => setReplayIndex(null)} disabled={replayIndex === null}>
                {t("back_to_live")}
              </Button>
            </div>
            <input
              type="range"
              min={0}
              max={trail.length - 1}
              value={viewIndex}
              onChange={(e) => setReplayIndex(Number(e.target.value))}
              aria-label={t("route_replay")}
              className="mt-3 h-2 w-full cursor-pointer accent-primary"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {viewed ? `${formatTime(viewed.recorded_at)} · ${Math.round(Number(viewed.speed_kmph))} km/h` : ""}
            </p>
          </div>
        )}

        {!live && (
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <BusFront className="mt-0.5 size-3.5" /> {t("gps_waiting_note")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon} {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
