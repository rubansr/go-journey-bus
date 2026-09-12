import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Armchair, BusFront, Flame, MapPin, Navigation, ShieldCheck, Star, TrendingUp, Wifi } from "lucide-react";

import { SearchForm } from "@/components/search-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { durationLabel, fareInsight, formatDay, formatTime, inr, todayISO } from "@/lib/booking";
import { useI18n } from "@/lib/i18n";

type Search = { from: string; to: string; date: string; pax: number };

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    from: typeof search["from"] === "string" ? search["from"] : "Chennai",
    to: typeof search["to"] === "string" ? search["to"] : "Nagercoil",
    date: typeof search["date"] === "string" ? search["date"] : todayISO(),
    pax: Math.max(1, Math.min(6, Number(search["pax"]) || 1)),
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
  { id: "depart", en: "Departure", ta: "புறப்பாடு" },
  { id: "fare", en: "Cheapest", ta: "மலிவானது" },
  { id: "fastest", en: "Fastest", ta: "வேகமானது" },
  { id: "arrive", en: "Earliest arrival", ta: "முதல் வருகை" },
  { id: "rating", en: "Top rated", ta: "சிறந்த மதிப்பீடு" },
] as const;

type SortId = (typeof SORTS)[number]["id"];

const FILTERS = [
  { id: "ac", en: "AC", ta: "ஏசி" },
  { id: "nonac", en: "Non-AC", ta: "நான்-ஏசி" },
  { id: "sleeper", en: "Sleeper", ta: "ஸ்லீப்பர்" },
  { id: "seater", en: "Seater", ta: "சீட்டர்" },
  { id: "women", en: "Women friendly", ta: "பெண்களுக்கு பாதுகாப்பு" },
  { id: "tracking", en: "Live tracking", ta: "நேரடி கண்காணிப்பு" },
  { id: "verified", en: "Verified only", ta: "சரிபார்க்கப்பட்டவை" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

const TIME_BANDS = [
  { id: "early", en: "Before 10 am", ta: "காலை 10 முன்", from: 0, to: 10 },
  { id: "day", en: "10 am – 5 pm", ta: "10 – 5", from: 10, to: 17 },
  { id: "evening", en: "5 pm – 9 pm", ta: "மாலை 5 – 9", from: 17, to: 21 },
  { id: "night", en: "After 9 pm", ta: "இரவு 9 பின்", from: 21, to: 24 },
] as const;

function SearchPage() {
  const { from, to, date, pax } = Route.useSearch();
  const { t, lang } = useI18n();
  const [sort, setSort] = useState<SortId>("depart");
  const [filters, setFilters] = useState<FilterId[]>([]);
  const [band, setBand] = useState<string | null>(null);

  const toggle = (id: FilterId) =>
    setFilters((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  const has = (id: FilterId) => filters.includes(id);

  const { data, isLoading } = useQuery({
    queryKey: ["trips", from, to, date],
    queryFn: async () => {
      const start = new Date(`${date}T00:00:00`).toISOString();
      const end = new Date(`${date}T23:59:59`).toISOString();
      const { data, error } = await supabase
        .from("trips")
        .select("*, operators(name, rating, verified, review_count, trust_score)")
        .ilike("from_city", from)
        .ilike("to_city", to)
        .gte("depart_at", start)
        .lte("depart_at", end)
        .order("depart_at");
      if (error) throw error;
      return data;
    },
  });

  const all = data ?? [];
  const trips = all
    .filter((tr) => tr.total_seats - tr.booked_seats.length >= pax)
    .filter((tr) => (has("ac") ? tr.ac ?? tr.bus_type.includes("AC") : true))
    .filter((tr) => (has("nonac") ? !(tr.ac ?? tr.bus_type.includes("AC")) : true))
    .filter((tr) => (has("sleeper") ? (tr.berth_type ?? tr.bus_type).toLowerCase().includes("sleeper") : true))
    .filter((tr) => (has("seater") ? (tr.berth_type ?? tr.bus_type).toLowerCase().includes("seater") : true))
    .filter((tr) => (has("women") ? tr.women_safe : true))
    .filter((tr) => (has("tracking") ? tr.live_tracking : true))
    .filter((tr) => (has("verified") ? tr.operators?.verified : true))
    .filter((tr) => {
      if (!band) return true;
      const b = TIME_BANDS.find((x) => x.id === band)!;
      const h = new Date(tr.depart_at).getHours();
      return h >= b.from && h < b.to;
    })
    .sort((a, b) => {
      if (sort === "fare") return Number(a.fare) - Number(b.fare);
      if (sort === "rating") return Number(b.rating) - Number(a.rating);
      if (sort === "arrive") return new Date(a.arrive_at).getTime() - new Date(b.arrive_at).getTime();
      if (sort === "fastest") {
        const dur = (x: typeof a) => new Date(x.arrive_at).getTime() - new Date(x.depart_at).getTime();
        return dur(a) - dur(b);
      }
      return new Date(a.depart_at).getTime() - new Date(b.depart_at).getTime();
    });

  const cheapest = all.length ? Math.min(...all.map((x) => Number(x.fare))) : 0;
  const label = (o: { en: string; ta: string }) => (lang === "ta" ? o.ta : o.en);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <SearchForm compact initial={{ from, to, date, pax }} />

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
            {label(s)}
          </Button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.id}
            size="sm"
            variant={has(f.id) ? "default" : "outline"}
            className="rounded-full"
            onClick={() => toggle(f.id)}
          >
            {label(f)}
          </Button>
        ))}
        {TIME_BANDS.map((b) => (
          <Button
            key={b.id}
            size="sm"
            variant={band === b.id ? "secondary" : "ghost"}
            className="rounded-full"
            onClick={() => setBand((prev) => (prev === b.id ? null : b.id))}
          >
            {label(b)}
          </Button>
        ))}
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
          const isCheapest = Number(trip.fare) === cheapest;
          return (
            <Card key={trip.id} className="overflow-hidden transition hover:shadow-lg">
              <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-semibold">{trip.operators?.name}</h2>
                    {trip.operators?.verified && (
                      <Badge variant="secondary" className="gap-1 text-success">
                        <ShieldCheck className="size-3.5" /> {t("verified")}
                      </Badge>
                    )}
                    <Badge variant="outline" className="gap-1">
                      <Star className="size-3.5 fill-warning text-warning" />{" "}
                      {Number(trip.operators?.rating ?? trip.rating).toFixed(1)}
                      {(trip.operators?.review_count ?? 0) > 0 && (
                        <span className="text-muted-foreground">
                          ({trip.operators?.review_count} {lang === "ta" ? "மதிப்பீடு" : "reviews"})
                        </span>
                      )}
                    </Badge>
                    {isCheapest && (
                      <Badge className="bg-success/15 text-success hover:bg-success/15">{t("cheapest_tag")}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{trip.bus_type}</span>
                    {trip.bus_number && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <BusFront className="size-3.5" /> {trip.bus_number}
                      </span>
                    )}
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

                  {(trip.boarding_points.length > 0 || trip.dropping_points.length > 0) && (
                    <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="mt-0.5 size-3.5 shrink-0" />
                      <span>
                        {trip.boarding_points.slice(0, 3).join(" · ")}
                        {trip.dropping_points.length > 0 && ` → ${trip.dropping_points.slice(0, 2).join(" · ")}`}
                      </span>
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {trip.amenities.filter((a) => a !== "Live tracking").map((a) => (
                      <span key={a} className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                        <Wifi className="size-3" aria-hidden /> {a}
                      </span>
                    ))}
                    {trip.live_tracking && (
                      <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-primary">
                        <Navigation className="size-3" /> {t("live_tracking")}
                      </span>
                    )}
                    {trip.women_safe && (
                      <span className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1">
                        <ShieldCheck className="size-3" /> {t("women_friendly")}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-xs">
                    {insight.fillsFast && insight.occupancy > 0.2 && (
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
                  <div className="text-right">
                    <p className="text-2xl font-bold">{inr(Number(trip.fare))}</p>
                    {pax > 1 && (
                      <p className="text-xs text-muted-foreground">
                        {inr(Number(trip.fare) * pax)} · {pax} {t("passengers")}
                      </p>
                    )}
                  </div>
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
