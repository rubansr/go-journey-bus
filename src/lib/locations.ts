import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";

export type Location = {
  id: string;
  name_en: string;
  name_ta: string;
  aliases: string[];
  district: string;
  kind: string;
  lat: number | null;
  lng: number | null;
};

export function useLocations() {
  return useQuery({
    queryKey: ["locations"],
    staleTime: 30 * 60 * 1000,
    queryFn: async (): Promise<Location[]> => {
      const { data, error } = await supabase
        .from("locations")
        .select("id, name_en, name_ta, aliases, district, kind, lat, lng")
        .eq("is_active", true)
        .order("name_en");
      if (error) throw error;
      return (data ?? []).map((l) => ({
        ...l,
        lat: l.lat === null ? null : Number(l.lat),
        lng: l.lng === null ? null : Number(l.lng),
      }));
    },
  });
}

export function useBoardingPoints(locationName: string | undefined) {
  return useQuery({
    queryKey: ["location-points", locationName],
    enabled: !!locationName,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("location_points")
        .select("id, name_en, name_ta, landmark, locations!inner(name_en)")
        .eq("locations.name_en", locationName!)
        .eq("is_active", true);
      return data ?? [];
    },
  });
}

const normalise = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z\u0B80-\u0BFF0-9]/g, "");

/** Matches English, Tamil and Tanglish spellings against the location catalogue. */
export function matchLocations(all: Location[], query: string, limit = 8): Location[] {
  const q = normalise(query);
  if (!q) return all.slice(0, limit);
  const scored = all
    .map((l) => {
      const candidates = [l.name_en, l.name_ta, l.district, ...l.aliases].map(normalise);
      let score = 0;
      for (const c of candidates) {
        if (!c) continue;
        if (c === q) score = Math.max(score, 100);
        else if (c.startsWith(q)) score = Math.max(score, 80 - c.length * 0.1);
        else if (c.includes(q)) score = Math.max(score, 55 - c.length * 0.1);
      }
      return { l, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.l);
}

export function labelFor(l: Location, lang: string) {
  return lang === "ta" && l.name_ta ? l.name_ta : l.name_en;
}

const RECENT_KEY = "nxtixa-recent-places";

export function useRecentPlaces() {
  const [recent, setRecent] = React.useState<string[]>([]);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
  }, []);

  const remember = React.useCallback((name: string) => {
    setRecent((prev) => {
      const next = [name, ...prev.filter((p) => p !== name)].slice(0, 6);
      try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { recent, remember };
}

export function nearestLocation(all: Location[], lat: number, lng: number): Location | undefined {
  let best: Location | undefined;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const l of all) {
    if (l.lat === null || l.lng === null) continue;
    const d = (l.lat - lat) ** 2 + (l.lng - lng) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = l;
    }
  }
  return best;
}
