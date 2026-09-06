import { useNavigate } from "@tanstack/react-router";
import { ArrowLeftRight, CalendarDays, MapPin, Search } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CITIES, todayISO } from "@/lib/booking";
import { useI18n } from "@/lib/i18n";

export function SearchForm({
  initial,
  compact = false,
}: {
  initial?: { from: string; to: string; date: string };
  compact?: boolean;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [from, setFrom] = useState(initial?.from ?? "Chennai");
  const [to, setTo] = useState(initial?.to ?? "Coimbatore");
  const [date, setDate] = useState(initial?.date ?? todayISO());

  function submit(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/search", search: { from, to, date } });
  }

  return (
    <form
      onSubmit={submit}
      className={
        compact
          ? "grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:grid-cols-[1fr_1fr_1fr_auto]"
          : "grid gap-4 rounded-3xl border border-border bg-card/95 p-5 shadow-xl backdrop-blur sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_1fr_auto]"
      }
    >
      <div className="space-y-1.5">
        <Label htmlFor="from" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("from")}
        </Label>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="from"
            list="cities"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-12 pl-9 text-base"
            required
          />
        </div>
      </div>

      {!compact && (
        <div className="hidden items-end justify-center pb-1 lg:flex">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full"
            aria-label="Swap cities"
            onClick={() => {
              setFrom(to);
              setTo(from);
            }}
          >
            <ArrowLeftRight className="size-4" />
          </Button>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="to" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("to")}
        </Label>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="to"
            list="cities"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-12 pl-9 text-base"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="date" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("date")}
        </Label>
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="date"
            type="date"
            value={date}
            min={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className="h-12 pl-9 text-base"
            required
          />
        </div>
      </div>

      <div className="flex items-end">
        <Button type="submit" size="lg" className="h-12 w-full gap-2 text-base font-semibold">
          <Search className="size-4" /> {t("search_buses")}
        </Button>
      </div>

      <datalist id="cities">
        {CITIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </form>
  );
}
