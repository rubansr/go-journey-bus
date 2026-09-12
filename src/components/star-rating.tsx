import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function StarRating({
  value,
  onChange,
  size = "md",
  label,
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md";
  label?: string;
}) {
  const px = size === "sm" ? "size-3.5" : "size-5";
  return (
    <div className="flex items-center gap-1" role={onChange ? "radiogroup" : undefined} aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
            onClick={() => onChange(n)}
            className="rounded-full p-0.5 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Star className={cn(px, n <= value ? "fill-warning text-warning" : "text-muted-foreground")} />
          </button>
        ) : (
          <Star
            key={n}
            aria-hidden
            className={cn(px, n <= Math.round(value) ? "fill-warning text-warning" : "text-muted-foreground/40")}
          />
        ),
      )}
    </div>
  );
}
