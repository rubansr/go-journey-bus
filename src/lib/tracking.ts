export type TrackedTrip = {
  depart_at: string;
  arrive_at: string;
  delay_mins: number;
  trip_status: string;
  boarding_points: string[];
  dropping_points: string[];
  from_city: string;
  to_city: string;
  tracking_note?: string | null;
};

export type Stop = { name: string; at: Date; reached: boolean; current: boolean };

export type TrackingState = {
  stops: Stop[];
  progress: number; // 0..1
  phase: "not_started" | "running" | "completed";
  currentStop: string;
  nextStop: string | null;
  etaAt: Date;
  delayMins: number;
  statusLabel: string;
  minutesToDeparture: number;
};

/** Builds a simulated-but-deterministic live position from schedule + delay. */
export function trackTrip(trip: TrackedTrip, now: Date = new Date()): TrackingState {
  const delay = trip.delay_mins ?? 0;
  const depart = new Date(new Date(trip.depart_at).getTime() + delay * 60000);
  const arrive = new Date(new Date(trip.arrive_at).getTime() + delay * 60000);

  const names = [
    ...(trip.boarding_points.length ? trip.boarding_points : [trip.from_city]),
    ...(trip.dropping_points.length ? trip.dropping_points : [trip.to_city]),
  ];

  const span = arrive.getTime() - depart.getTime();
  const elapsed = now.getTime() - depart.getTime();
  const progress = Math.min(1, Math.max(0, span > 0 ? elapsed / span : 0));

  const stops: Stop[] = names.map((name, i) => {
    const ratio = names.length === 1 ? 0 : i / (names.length - 1);
    const at = new Date(depart.getTime() + span * ratio);
    return { name, at, reached: now.getTime() >= at.getTime(), current: false };
  });

  const lastReached = stops.reduce((acc, s, i) => (s.reached ? i : acc), -1);
  const currentIndex = Math.max(0, lastReached);
  if (stops[currentIndex]) stops[currentIndex].current = true;

  const phase = now < depart ? "not_started" : progress >= 1 ? "completed" : "running";
  const statusLabel =
    trip.trip_status === "cancelled"
      ? "Cancelled by operator"
      : delay > 0
        ? `Running late by ${delay} min`
        : phase === "completed"
          ? "Journey completed"
          : phase === "running"
            ? "On time · en route"
            : "On time · scheduled";

  return {
    stops,
    progress,
    phase,
    currentStop: stops[currentIndex]?.name ?? trip.from_city,
    nextStop: stops[currentIndex + 1]?.name ?? null,
    etaAt: arrive,
    delayMins: delay,
    statusLabel,
    minutesToDeparture: Math.round((depart.getTime() - now.getTime()) / 60000),
  };
}
