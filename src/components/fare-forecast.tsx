import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, LineChart, Minus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { forecastFare } from "@/lib/fare-prediction";
import { inr } from "@/lib/booking";
import { useI18n } from "@/lib/i18n";

export function FareForecast({ from, to, date, current }: { from: string; to: string; date: string; current: number }) {
  const { t } = useI18n();

  const { data, isLoading } = useQuery({
    queryKey: ["fare-forecast", from, to],
    queryFn: async () => {
      const start = new Date();
      const end = new Date(start.getTime() + 21 * 86400000);
      const { data, error } = await supabase
        .from("trips")
        .select("depart_at, fare")
        .eq("from_city", from)
        .eq("to_city", to)
        .gte("depart_at", start.toISOString())
        .lte("depart_at", end.toISOString())
        .order("depart_at");
      if (error) throw error;
      const byDay = new Map<string, number[]>();
      for (const row of data ?? []) {
        const day = row.depart_at.slice(0, 10);
        byDay.set(day, [...(byDay.get(day) ?? []), Number(row.fare)]);
      }
      return [...byDay.entries()].map(([day, fares]) => ({
        date: day,
        fare: Math.round(fares.reduce((a, b) => a + b, 0) / fares.length),
      }));
    },
  });

  if (isLoading) return <Skeleton className="h-40 rounded-2xl" />;
  if (!data || data.length < 3) return null;

  const f = forecastFare(data, current);
  const max = Math.max(...f.points.map((p) => p.fare), 1);
  const min = Math.min(...f.points.map((p) => p.fare));
  const adviceTone =
    f.advice === "book_now" ? "text-destructive" : f.advice === "wait" ? "text-success" : "text-muted-foreground";

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <LineChart className="size-4 text-primary" /> {t("fare_prediction")}
          </h2>
          <Badge variant="secondary">{t(`confidence_${f.confidence}`)}</Badge>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Metric label={t("todays_lowest")} value={inr(f.current)} />
          <Metric label={t("route_average")} value={inr(f.average)} />
          <Metric
            label={t("predicted_fare")}
            value={inr(f.predicted)}
            hint={`${f.changePct > 0 ? "+" : ""}${f.changePct}%`}
            icon={
              f.changePct > 0 ? (
                <ArrowUpRight className="size-4 text-destructive" />
              ) : f.changePct < 0 ? (
                <ArrowDownRight className="size-4 text-success" />
              ) : (
                <Minus className="size-4" />
              )
            }
          />
        </div>

        <div className="mt-4 flex h-24 items-end gap-1" role="img" aria-label={t("fare_trend")}>
          {f.points.slice(0, 21).map((p) => {
            const h = 12 + ((p.fare - min) / Math.max(1, max - min)) * 84;
            const isDate = p.date === date;
            return (
              <span
                key={p.date}
                title={`${p.date}: ${inr(p.fare)}`}
                style={{ height: `${h}%` }}
                className={
                  isDate
                    ? "brand-gradient min-w-0 flex-1 rounded-t"
                    : "min-w-0 flex-1 rounded-t bg-primary/25"
                }
              />
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{t("fare_trend_note")}</p>

        <p className={`mt-3 text-sm font-semibold ${adviceTone}`}>
          {f.advice === "book_now" ? t("advice_book_now") : f.advice === "wait" ? t("advice_wait") : t("advice_stable")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{t("fare_estimate_note")}</p>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-lg font-bold">
        {value} {icon}
        {hint && <span className="text-xs font-medium text-muted-foreground">{hint}</span>}
      </p>
    </div>
  );
}
