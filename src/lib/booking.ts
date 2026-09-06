export const CITIES = [
  "Chennai",
  "Coimbatore",
  "Madurai",
  "Bangalore",
  "Trichy",
  "Tirunelveli",
  "Salem",
  "Erode",
];

export type SeatInfo = { id: string; row: number; col: number; window: boolean };

/** 36 seats: 9 rows x 4 seats (2 + aisle + 2). */
export function buildSeatMap(total = 36): SeatInfo[] {
  const seats: SeatInfo[] = [];
  const rows = Math.ceil(total / 4);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < 4; c++) {
      const index = r * 4 + c;
      if (index >= total) break;
      seats.push({ id: `${r + 1}${["A", "B", "C", "D"][c]}`, row: r + 1, col: c, window: c === 0 || c === 3 });
    }
  }
  return seats;
}

export function inr(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    amount,
  );
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export function durationLabel(from: string, to: string) {
  const mins = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60000);
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m`;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Simple demand model used for the fare-prediction and crowd-prediction cards. */
export function fareInsight(trip: { fare: number; demand_level: string; booked_seats: string[]; total_seats: number }) {
  const occupancy = trip.booked_seats.length / trip.total_seats;
  const pressure = (trip.demand_level === "high" ? 0.18 : trip.demand_level === "medium" ? 0.1 : 0.04) + occupancy * 0.2;
  return {
    occupancy,
    predictedRise: Math.round(Number(trip.fare) * pressure),
    advice: pressure > 0.2 ? "rising" : "stable",
    fillsFast: occupancy > 0.55 || trip.demand_level === "high",
  } as const;
}

/**
 * AI seat recommendation: prefers window seats, keeps groups together and
 * favours front-of-bus seats for women-safety preference.
 */
export function recommendSeats(
  seats: SeatInfo[],
  booked: string[],
  count: number,
  opts: { window?: boolean; womenSafety?: boolean } = {},
) {
  const free = seats.filter((s) => !booked.includes(s.id));
  const scored = free
    .map((s) => {
      let score = 0;
      if (opts.window !== false && s.window) score += 4;
      if (opts.womenSafety && s.row <= 3) score += 5;
      score += Math.max(0, 6 - s.row) * 0.4;
      return { seat: s, score };
    })
    .sort((a, b) => b.score - a.score);

  if (count > 1) {
    for (let r = 1; r <= 9; r++) {
      const rowSeats = free.filter((s) => s.row === r);
      if (rowSeats.length >= count) return rowSeats.slice(0, count).map((s) => s.id);
    }
  }
  return scored.slice(0, count).map((x) => x.seat.id);
}
