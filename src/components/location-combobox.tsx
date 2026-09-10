import * as React from "react";
import { Crosshair, Loader2, MapPin } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { labelFor, matchLocations, nearestLocation, useLocations, useRecentPlaces } from "@/lib/locations";
import { useI18n } from "@/lib/i18n";

export function LocationCombobox({
  id,
  label,
  value,
  onChange,
  placeholder,
  showGps = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (name: string) => void;
  placeholder?: string;
  showGps?: boolean;
}) {
  const { lang, t } = useI18n();
  const { data: locations = [] } = useLocations();
  const { recent, remember } = useRecentPlaces();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState(value);
  const [locating, setLocating] = React.useState(false);
  const boxRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => setQuery(value), [value]);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const suggestions = React.useMemo(() => {
    if (!query.trim() && recent.length) {
      const recentMatches = recent
        .map((r) => locations.find((l) => l.name_en === r))
        .filter((l): l is NonNullable<typeof l> => !!l);
      const rest = locations.filter((l) => !recent.includes(l.name_en)).slice(0, 8 - recentMatches.length);
      return [...recentMatches, ...rest];
    }
    return matchLocations(locations, query);
  }, [locations, query, recent]);

  function pick(name: string) {
    onChange(name);
    setQuery(name);
    remember(name);
    setOpen(false);
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const near = nearestLocation(locations, pos.coords.latitude, pos.coords.longitude);
        if (near) pick(near.name_en);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 },
    );
  }

  return (
    <div className="space-y-1.5" ref={boxRef}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </Label>
        {showGps && (
          <button
            type="button"
            onClick={useMyLocation}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {locating ? <Loader2 className="size-3 animate-spin" /> : <Crosshair className="size-3" />}
            {t("use_my_location")}
          </button>
        )}
      </div>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          value={query}
          autoComplete="off"
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="h-12 pl-9 text-base"
          required
        />

        {open && suggestions.length > 0 && (
          <ul className="absolute z-40 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-border bg-popover p-1 shadow-xl">
            {!query.trim() && recent.length > 0 && (
              <li className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("recent_places")}
              </li>
            )}
            {suggestions.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(l.name_en)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-accent",
                    value === l.name_en && "bg-accent",
                  )}
                >
                  <span className="font-medium">{labelFor(l, lang)}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {lang === "ta" ? l.name_en : l.name_ta} · {l.district}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
