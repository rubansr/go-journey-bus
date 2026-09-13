export type Ping = {
  id: string;
  trip_id: string;
  lat: number;
  lng: number;
  speed_kmph: number;
  heading: number;
  recorded_at: string;
  source: string;
};

export type LatLng = { lat: number; lng: number };

const R = 6371; // km

export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function bearing(a: LatLng, b: LatLng): number {
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360;
}

export function compass(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(((deg % 360) / 45)) % 8] ?? "N";
}

/** Fraction of the way travelled from origin to destination, based on remaining distance. */
export function routeProgress(pos: LatLng, from: LatLng, to: LatLng): number {
  const total = distanceKm(from, to);
  if (total <= 0.01) return 1;
  const done = distanceKm(from, pos);
  const left = distanceKm(pos, to);
  const denom = done + left;
  return Math.min(1, Math.max(0, denom > 0 ? done / denom : 0));
}

export function etaFromGps(pos: LatLng, to: LatLng, speedKmph: number, now = new Date()) {
  const remainingKm = distanceKm(pos, to);
  const speed = speedKmph > 5 ? speedKmph : 45; // fall back to a realistic highway average
  const minutes = Math.round((remainingKm / speed) * 60);
  return { remainingKm, minutes, at: new Date(now.getTime() + minutes * 60000) };
}

export function minutesAgo(iso: string, now = new Date()): number {
  return Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 60000));
}

export function isGpsFresh(iso: string | undefined, now = new Date()): boolean {
  if (!iso) return false;
  return now.getTime() - new Date(iso).getTime() < 10 * 60 * 1000;
}

export function lastUpdatedLabel(iso: string | undefined, now = new Date()): string {
  if (!iso) return "—";
  const mins = minutesAgo(iso, now);
  if (mins < 1) return "just now";
  return `${mins} min ago`;
}
