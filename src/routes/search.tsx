import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Armchair, Flame, ShieldCheck, Star, TrendingUp, Wifi } from "lucide-react";

import { SearchForm } from "@/components/search-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { durationLabel, fareInsight, formatDay, formatTime, inr, todayISO } from "@/lib/booking";
import { useI18n } from "@/lib/i18n";

type Search = { from: string; to: string; date: string };

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    from: typeof search["from"] === "string" ? search["from"] : "Chennai",
    to: typeof search["to"] === "string" ? search["to"] : "Coimbatore",
    date: typeof search["date"] === "string" ? search["date"] : todayISO(),
  }),
  head: () => ({
    meta: [
      { title: "Find buses — NXTIXA Go" },
      { name: "description", content: "Compare verified bus operators, timings, fares and live seat availability." },
      { property: "og:title", content: "Find buses — NXTIXA Go" },
      { property: "og:description", content: "Compare operators, timings, fares and live seat availability." },
    ],
  }),
  component: SearchPage,
});

const SORTS = [
  { id: "depart", label: "Departure" },
  { id: "fare", label: "Cheapest" },
  { id: "rating", label: "Top rated" },
] as const;

function SearchPage() {
  const { from, to, date } = Route.useSearch();
  const { t } = useI18n();
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("depart");
  const [acOnly, setAcOnly] = useState(false);
  const [sleeperOnly, setSleeperOnly] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["trips", from, to, date],
    queryFn: async () => {
      const start = new Date(`${date}T00:00:00`).toISOString();
      const end = new Date(`${date}T23:59:59`).toISOString();
      const { data, error } = await supabase
        .from("trips")
        .select("*, operators(name, rating, verified)")
        .ilike("from_city", from)
        .ilike("to_city", to)
        .gte("depart_at", start)
        .lte("depart_at", end)
        .order("depart_at");
      if (error) throw error;
      return data;
    },
  });

  const trips = (data ?? [])
    .filter((tr) => (acOnly ? tr.bus_type.includes("AC") && !tr.bus_type.startsWith("Non") : true))
    .filter((tr) => (sleeperOnly ? tr.bus_type.includes("Sleeper") : true))
    .sort((a, b) => {
      if (sort === "fare") return Number(a.fare) - Number(b.fare);
      if (sort === "rating") return Number(b.rating) - Number(a.rating);
      return new Date(a.depart_at).getTime() - new Date(b.depart_at).getTime();
    });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <SearchForm compact initial={{ from, to, date }} />

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <p className="mr-2 text-sm text-muted-foreground">
          {isLoading ? t("loading") : `${trips.length} ${t("buses_found")}`}
        </p>
        {SORTS.map((s) => (
          <Button
            key={s.id}
            size="sm"
            variant={sort === s.id ? "default" : "outline"}
            onClick={() => setSort(s.id)}
            className="rounded-full"
          >
            {s.label}
          </Button>
        ))}
        <Button
          size="sm"
          variant={acOnly ? "default" : "outline"}
          className="rounded-full"
          onClick={() => setAcOnly((v) => !v)}
        >
          AC
        </Button>
        <Button
          size="sm"
          variant={sleeperOnly ? "default" : "outline"}
          className="rounded-full"
          onClick={() => setSleeperOnly((v) => !v)}
        >
          Sleeper
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}

        {!isLoading && trips.length === 0 && (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">{t("no_buses")}</CardContent>
          </Card>
        )}

        {trips.map((trip) => {
          const seatsLeft = trip.total_seats - trip.booked_seats.length;
          const insight = fareInsight({
            fare: Number(trip.fare),
            demand_level: trip.demand_level,
            booked_seats: trip.booked_seats,
            total_seats: trip.total_seats,
          });
          return (
            <Card key={trip.id} className="overflow-hidden transition hover:shadow-lg">
              <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-semibold">{trip.operators?.name}</h2>
                    {trip.operators?.verified && (
                      <Badge variant="secondary" className="gap-1 text-success">
                        <ShieldCheck className="size-3.5" /> Verified
                      </Badge>
                    )}
                    <Badge variant="outline" className="gap-1">
                      <Star className="size-3.5 fill-warning text-warning" /> {Number(trip.rating).toFixed(1)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{trip.bus_type}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                    <div>
                      <p className="text-xl font-semibold">{formatTime(trip.depart_at)}</p>
                      <p className="text-xs text-muted-foreground">{trip.from_city}</p>
                    </div>
                    <div className="text-center text-xs text-muted-foreground">
                      <p>{durationLabel(trip.depart_at, trip.arrive_at)}</p>
                      <div className="my-1 h-px w-24 bg-border" />
                      <p>{formatDay(trip.depart_at)}</p>
                    </div>
                    <div>
                      <p className="text-xl font-semibold">{formatTime(trip.arrive_at)}</p>
                      <p className="text-xs text-muted-foreground">{trip.to_city}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {trip.amenities.map((a) => (
                      <span key={a} className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                        <Wifi className="size-3" aria-hidden /> {a}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-xs">
                    {insight.fillsFast && (
                      <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 font-medium text-destructive">
                        <Flame className="size-3.5" /> Fills fast — {Math.round(insight.occupancy * 100)}% booked
                      </span>
                    )}
                    {insight.advice === "rising" && (
                      <span className="flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 font-medium text-warning-foreground">
                        <TrendingUp className="size-3.5" /> Fare may rise by {inr(insight.predictedRise)}
                      </span>
                    )}
                    <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                      <Armchair className="size-3.5" /> {seatsLeft} {t("seats_left")}
                    </span>
                  </div>
                </div>

                <div className="flex flex-row items-end justify-between gap-4 lg:flex-col lg:items-end lg:justify-center">
                  <p className="text-2xl font-bold">{inr(Number(trip.fare))}</p>
                  <Button asChild size="lg" className="font-semibold">
                    <Link to="/trip/$tripId" params={{ tripId: trip.id }}>
                      {t("select_seats")}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
