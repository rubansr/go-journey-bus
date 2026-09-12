import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, ShieldCheck } from "lucide-react";

import { StarRating } from "@/components/star-rating";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export function OperatorReviews({ operatorId, trustScore }: { operatorId: string; trustScore?: number | null }) {
  const { lang } = useI18n();

  const { data, isLoading } = useQuery({
    queryKey: ["operator-reviews", operatorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, rating, comment, tags, reviewer_name, created_at")
        .eq("operator_id", operatorId)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const reviews = data ?? [];
  const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  if (isLoading) return <Skeleton className="h-32 w-full rounded-2xl" />;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-base font-semibold">
            {lang === "ta" ? "சரிபார்க்கப்பட்ட பயணி மதிப்பீடுகள்" : "Verified traveller reviews"}
          </h2>
          {reviews.length > 0 && <StarRating value={average} size="sm" />}
          {typeof trustScore === "number" && (
            <Badge variant="secondary" className="gap-1">
              <ShieldCheck className="size-3.5" />
              {lang === "ta" ? "நம்பகத்தன்மை" : "Trust score"} {Math.round(trustScore)}
            </Badge>
          )}
        </div>

        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {lang === "ta"
              ? "இந்த ஆபரேட்டருக்கு இன்னும் மதிப்பீடு இல்லை. பயணத்திற்கு பிறகு நீங்கள் முதலில் மதிப்பிடலாம்."
              : "No reviews yet for this operator. Travel with them and you can be the first to review."}
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {reviews.map((r) => (
              <li key={r.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <StarRating value={r.rating} size="sm" />
                  <span className="text-sm font-medium">{r.reviewer_name ?? (lang === "ta" ? "பயணி" : "Traveller")}</span>
                  <Badge variant="outline" className="gap-1 text-xs text-success">
                    <BadgeCheck className="size-3" /> {lang === "ta" ? "சரிபார்க்கப்பட்டது" : "Verified"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN")}
                  </span>
                </div>
                {r.comment && <p className="mt-1.5 text-sm text-muted-foreground">{r.comment}</p>}
                {r.tags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {r.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {tag.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
