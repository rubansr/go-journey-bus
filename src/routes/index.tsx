import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Bot,
  BrainCircuit,
  CloudLightning,
  Gauge,
  MapPinned,
  QrCode,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wallet,
} from "lucide-react";

import heroBus from "@/assets/hero-bus.jpg";
import { SearchForm } from "@/components/search-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { inr, todayISO } from "@/lib/booking";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NXTIXA Go — Book trusted bus tickets across South India" },
      {
        name: "description",
        content:
          "Search verified bus operators, pick seats with AI help, pay securely and get instant wallet refunds. Tamil and English.",
      },
      { property: "og:title", content: "NXTIXA Go — Book trusted bus tickets" },
      {
        property: "og:description",
        content: "Verified operators, live seat sync, AI seat picks and instant refunds on every booking.",
      },
    ],
  }),
  component: Home,
});

const POPULAR = [
  { from: "Chennai", to: "Nagercoil", hours: "12h 30m" },
  { from: "Chennai", to: "Kanyakumari", hours: "13h 30m" },
  { from: "Chennai", to: "Kaliyakkavilai", hours: "13h" },
  { from: "Chennai", to: "Madurai", hours: "8h 30m" },
  { from: "Chennai", to: "Coimbatore", hours: "9h" },
  { from: "Nagercoil", to: "Coimbatore", hours: "9h" },
  { from: "Chennai", to: "Tirunelveli", hours: "11h" },
  { from: "Bengaluru", to: "Chennai", hours: "6h" },
  { from: "Chennai", to: "Trichy", hours: "6h" },
];

const AI_FEATURES = [
  { icon: BrainCircuit, title: "AI seat recommendation", body: "Window, family-together and women-safety aware picks in one tap." },
  { icon: Gauge, title: "Fare prediction", body: "See if this fare is likely to rise before your travel date." },
  { icon: Users, title: "Crowd prediction", body: "Know which buses fill fast so you never miss the good seats." },
  { icon: Bot, title: "Travel assistant", body: "Route guidance and answers in Tamil or English, any time." },
  { icon: ShieldCheck, title: "Fraud detection", body: "Every payment is risk-scored to block fake bookings." },
  { icon: CloudLightning, title: "Delay alerts", body: "Weather and traffic signals predict delays before you leave." },
];

function Home() {
  const { t } = useI18n();

  const { data: operators } = useQuery({
    queryKey: ["operators"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operators")
        .select("id,name,rating,verified,total_trips")
        .order("rating", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const { data: cheapest } = useQuery({
    queryKey: ["cheapest-fares"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("from_city,to_city,fare")
        .gte("depart_at", new Date().toISOString())
        .order("fare", { ascending: true })
        .limit(2000);
      if (error) throw error;
      const map = new Map<string, number>();
      for (const row of data ?? []) {
        const key = `${row.from_city}-${row.to_city}`;
        const fare = Number(row.fare);
        if (!map.has(key) || fare < map.get(key)!) map.set(key, fare);
      }
      return map;
    },
  });

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroBus}
          alt="Luxury sleeper bus travelling on a highway at night"
          width={1920}
          height={1088}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.25_0.12_268/0.94)] via-[oklch(0.28_0.14_285/0.86)] to-[oklch(0.3_0.16_305/0.8)]" />
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-16 sm:pt-24">
          <Badge className="mb-5 gap-1.5 border-white/25 bg-white/15 text-white backdrop-blur">
            <Sparkles className="size-3.5" /> {t("brand_tag")}
          </Badge>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            {t("hero_title")}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/85 sm:text-lg">{t("hero_sub")}</p>

          <div className="mt-9">
            <SearchForm />
          </div>

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/85">
            <span className="flex items-center gap-2">
              <BadgeCheck className="size-4" /> 100% verified operators
            </span>
            <span className="flex items-center gap-2">
              <Wallet className="size-4" /> Instant wallet refunds
            </span>
            <span className="flex items-center gap-2">
              <MapPinned className="size-4" /> Live GPS tracking
            </span>
          </div>
        </div>
      </section>

      {/* Popular routes */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-bold sm:text-3xl">{t("popular_routes")}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR.map((r) => {
            const fare = cheapest?.get(`${r.from}-${r.to}`);
            return (
              <Link
                key={`${r.from}-${r.to}`}
                to="/search"
                search={{ from: r.from, to: r.to, date: todayISO(), pax: 1 }}
                className="group rounded-2xl border border-border bg-card p-5 transition hover:border-primary/50 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <p className="font-display text-lg font-semibold">
                    {r.from} → {r.to}
                  </p>
                  <span className="text-xs text-muted-foreground">{r.hours}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  From <span className="font-semibold text-primary">{fare ? inr(fare) : "—"}</span> · daily departures
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Operators */}
      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto w-full max-w-7xl px-4 py-16">
          <h2 className="text-2xl font-bold sm:text-3xl">{t("operators")}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(operators ?? []).map((o) => (
              <Card key={o.id}>
                <CardContent className="flex items-center justify-between gap-3 p-5">
                  <div>
                    <p className="font-semibold">{o.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.total_trips.toLocaleString("en-IN")} trips completed
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="flex items-center gap-1 text-sm font-semibold">
                      <Star className="size-4 fill-warning text-warning" /> {Number(o.rating).toFixed(1)}
                    </span>
                    {o.verified && <span className="text-xs text-success">Verified</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI features */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-bold sm:text-3xl">{t("ai_features")}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AI_FEATURES.map((f) => (
            <Card key={f.title} className="border-border/70">
              <CardContent className="p-6">
                <span className="brand-gradient mb-4 flex size-10 items-center justify-center rounded-xl text-primary-foreground">
                  <f.icon className="size-5" aria-hidden />
                </span>
                <h3 className="text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Safety + tracking */}
      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">{t("safety")}</h2>
            <ul className="mt-6 space-y-4 text-sm">
              {[
                ["Verified operator badges", "Every operator is licence-checked before listing."],
                ["Women safety preference", "Seat suggestions and co-passenger visibility for solo travellers."],
                ["Emergency SOS", "One tap alerts our 24×7 desk and shares your live location with family."],
                ["Encrypted data & payments", "Card details are never stored on our servers."],
              ].map(([title, body]) => (
                <li key={title} className="flex gap-3">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
                  <span>
                    <span className="font-semibold">{title}</span>
                    <span className="block text-muted-foreground">{body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <MapPinned className="size-4 text-primary" /> Live tracking preview
              </div>
              <div className="mt-4 space-y-4">
                {[
                  ["Chennai CMBT", "Departed 21:05", true],
                  ["Vellore bypass", "Passed 23:40", true],
                  ["Salem toll", "ETA 02:15", false],
                  ["Coimbatore Gandhipuram", "ETA 05:20", false],
                ].map(([place, time, done]) => (
                  <div key={place as string} className="flex items-center gap-3">
                    <span
                      className={`size-3 rounded-full ${done ? "bg-success" : "bg-muted-foreground/40"}`}
                      aria-hidden
                    />
                    <div className="flex-1 border-b border-dashed border-border pb-3">
                      <p className="text-sm font-medium">{place}</p>
                      <p className="text-xs text-muted-foreground">{time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Delay prediction: on time · light traffic near Salem
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Reviews */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-bold sm:text-3xl">{t("reviews")}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Divya R.", "Chennai → Madurai", "Refund hit my wallet in seconds after the operator cancelled. Never had that anywhere else."],
            ["Karthik S.", "Bangalore → Chennai", "The AI picked a front window seat for my mother without me hunting the seat map."],
            ["Anitha M.", "Chennai → Trichy", "Tamil support and the offline QR ticket saved me when my network dropped."],
          ].map(([name, route, quote]) => (
            <Card key={name}>
              <CardContent className="p-6">
                <div className="flex gap-0.5 text-warning">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <p className="mt-3 text-sm">“{quote}”</p>
                <p className="mt-4 text-xs font-semibold">
                  {name} · <span className="font-normal text-muted-foreground">{route}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* App promo */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-8">
        <div className="brand-gradient flex flex-col items-start gap-6 rounded-3xl p-8 text-primary-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Your ticket works even without network</h2>
            <p className="mt-2 max-w-xl text-sm text-primary-foreground/85">
              Offline QR e-tickets, SMS and WhatsApp backups, plus cached booking details for low-network journeys.
            </p>
          </div>
          <Button asChild size="lg" variant="secondary" className="gap-2">
            <Link to="/search" search={{ from: "Chennai", to: "Coimbatore", date: todayISO(), pax: 1 }}>
              <QrCode className="size-4" /> Book your first trip
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
