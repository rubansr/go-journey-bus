export type FarePoint = { date: string; fare: number };

export type FareForecast = {
  current: number;
  average: number;
  predicted: number;
  changePct: number;
  advice: "book_now" | "wait" | "stable";
  points: FarePoint[];
  confidence: "low" | "medium" | "high";
};

/**
 * Predicts short-term fare direction from the operator's own published fares
 * for the same route across upcoming dates. Deterministic and explainable —
 * no invented pricing.
 */
export function forecastFare(points: FarePoint[], current: number): FareForecast {
  const sorted = [...points].sort((a, b) => (a.date < b.date ? -1 : 1));
  const fares = sorted.map((p) => p.fare).filter((f) => f > 0);
  const average = fares.length ? Math.round(fares.reduce((a, b) => a + b, 0) / fares.length) : current;

  // Linear trend over the sampled window.
  let slope = 0;
  if (fares.length >= 3) {
    const n = fares.length;
    const meanX = (n - 1) / 2;
    const meanY = average;
    let num = 0;
    let den = 0;
    fares.forEach((y, x) => {
      num += (x - meanX) * (y - meanY);
      den += (x - meanX) ** 2;
    });
    slope = den ? num / den : 0;
  }

  const predicted = Math.max(1, Math.round(current + slope * 3));
  const changePct = current ? Math.round(((predicted - current) / current) * 100) : 0;
  const advice: FareForecast["advice"] = changePct >= 4 ? "book_now" : changePct <= -4 ? "wait" : "stable";
  const confidence = fares.length >= 10 ? "high" : fares.length >= 5 ? "medium" : "low";

  return { current, average, predicted, changePct, advice, points: sorted, confidence };
}
