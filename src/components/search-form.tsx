import { useNavigate } from "@tanstack/react-router";
import { ArrowLeftRight, CalendarDays, Search, Users } from "lucide-react";
import { useState } from "react";

import { LocationCombobox } from "@/components/location-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { todayISO } from "@/lib/booking";
import { useI18n } from "@/lib/i18n";

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function SearchForm({
  initial,
  compact = false,
}: {
  initial?: { from: string; to: string; date: string; pax?: number };
  compact?: boolean;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [from, setFrom] = useState(initial?.from ?? "Chennai");
  const [to, setTo] = useState(initial?.to ?? "Nagercoil");
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [pax, setPax] = useState(initial?.pax ?? 1);

  const today = todayISO();
  const tomorrow = addDays(today, 1);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/search", search: { from, to, date, pax } });
  }

  return (
    <form
      onSubmit={submit}
      className={
        compact
          ? "rounded-2xl border border-border bg-card p-4 shadow-sm"
          : "rounded-3xl border border-border bg-card/95 p-5 shadow-xl backdrop-blur"
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_1fr_auto_auto]">
        <LocationCombobox id="from" label={t("from")} value={from} onChange={setFrom} showGps />

        <div className="hidden items-end justify-center pb-1 lg:flex">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full"
            aria-label={t("swap_places")}
            onClick={() => {
              setFrom(to);
              setTo(from);
            }}
          >
            <ArrowLeftRight className="size-4" />
          </Button>
        </div>

        <LocationCombobox id="to" label={t("to")} value={to} onChange={setTo} />

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
              min={today}
              onChange={(e) => setDate(e.target.value)}
              className="h-12 pl-9 text-base"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pax" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("passengers")}
          </Label>
          <div className="relative">
            <Users className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="pax"
              type="number"
              min={1}
              max={6}
              value={pax}
              onChange={(e) => setPax(Math.max(1, Math.min(6, Number(e.target.value) || 1)))}
              className="h-12 w-full pl-9 text-base sm:w-28"
            />
          </div>
        </div>

        <div className="flex items-end">
          <Button type="submit" size="lg" className="h-12 w-full gap-2 text-base font-semibold">
            <Search className="size-4" /> {t("search_buses")}
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {[
          { label: t("today"), value: today },
          { label: t("tomorrow"), value: tomorrow },
          { label: t("day_after"), value: addDays(today, 2) },
        ].map((chip) => (
          <Button
            key={chip.value}
            type="button"
            size="sm"
            variant={date === chip.value ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setDate(chip.value)}
          >
            {chip.label}
          </Button>
        ))}
      </div>
    </form>
  );
}
