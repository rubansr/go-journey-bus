import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, Loader2, MessageSquarePlus } from "lucide-react";

import { StarRating } from "@/components/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const TAGS = [
  { id: "on_time", en: "On time", ta: "நேரத்தில்" },
  { id: "clean", en: "Clean bus", ta: "சுத்தமான பஸ்" },
  { id: "polite_staff", en: "Polite staff", ta: "நல்ல ஊழியர்கள்" },
  { id: "comfy_seats", en: "Comfortable seats", ta: "வசதியான இருக்கைகள்" },
  { id: "safe_women", en: "Safe for women", ta: "பெண்களுக்கு பாதுகாப்பு" },
  { id: "late", en: "Ran late", ta: "தாமதம்" },
  { id: "rash_driving", en: "Rash driving", ta: "அபாயமான ஓட்டுதல்" },
] as const;

const SUB = [
  { key: "punctuality", en: "Punctuality", ta: "நேரம்" },
  { key: "cleanliness", en: "Cleanliness", ta: "சுத்தம்" },
  { key: "staff", en: "Staff", ta: "ஊழியர்கள்" },
  { key: "comfort", en: "Comfort", ta: "வசதி" },
] as const;

export function ReviewForm({
  bookingId,
  tripId,
  operatorId,
  operatorName,
}: {
  bookingId: string;
  tripId: string;
  operatorId?: string | null;
  operatorName?: string | null;
}) {
  const { lang } = useI18n();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [sub, setSub] = useState<Record<string, number>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");

  const label = (o: { en: string; ta: string }) => (lang === "ta" ? o.ta : o.en);

  const { data: existing, isLoading } = useQuery({
    queryKey: ["review", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, rating, comment, tags, status")
        .eq("booking_id", bookingId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error(lang === "ta" ? "உள்நுழையவும்" : "Please sign in");
      const { error } = await supabase.from("reviews").insert({
        user_id: userId,
        booking_id: bookingId,
        trip_id: tripId,
        operator_id: operatorId ?? null,
        rating,
        punctuality: sub["punctuality"] ?? null,
        cleanliness: sub["cleanliness"] ?? null,
        staff: sub["staff"] ?? null,
        comfort: sub["comfort"] ?? null,
        comment: comment.trim() || null,
        tags,
        reviewer_name:
          (auth.user?.user_metadata?.["full_name"] as string | undefined) ??
          auth.user?.email?.split("@")[0] ??
          null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success(lang === "ta" ? "மதிப்பீட்டுக்கு நன்றி!" : "Thanks for your verified review!");
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["review", bookingId] });
      await queryClient.invalidateQueries({ queryKey: ["operator-reviews"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return null;

  if (existing) {
    return (
      <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <StarRating value={existing.rating} size="sm" />
          <Badge variant="secondary" className="gap-1 text-success">
            <BadgeCheck className="size-3.5" /> {lang === "ta" ? "சரிபார்க்கப்பட்ட மதிப்பீடு" : "Verified review"}
          </Badge>
          {existing.status !== "published" && (
            <Badge variant="outline">{lang === "ta" ? "பரிசீலனையில்" : "Under review"}</Badge>
          )}
        </div>
        {existing.comment && <p className="mt-2 text-sm text-muted-foreground">{existing.comment}</p>}
      </div>
    );
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => setOpen(true)}>
        <MessageSquarePlus className="size-4" />
        {lang === "ta" ? "இந்த பயணத்தை மதிப்பிடு" : "Rate this trip"}
      </Button>
    );
  }

  return (
    <Card className="mt-4">
      <CardContent className="space-y-4 p-4">
        <div>
          <p className="text-sm font-medium">
            {lang === "ta" ? "உங்கள் பயணம் எப்படி இருந்தது?" : "How was your journey?"}
            {operatorName ? ` · ${operatorName}` : ""}
          </p>
          <div className="mt-2">
            <StarRating value={rating} onChange={setRating} label="Overall rating" />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {SUB.map((s) => (
            <div key={s.key} className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2">
              <span className="text-xs text-muted-foreground">{label(s)}</span>
              <StarRating
                size="sm"
                value={sub[s.key] ?? 0}
                onChange={(v) => setSub((p) => ({ ...p, [s.key]: v }))}
                label={label(s)}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {TAGS.map((tg) => (
            <button
              key={tg.id}
              type="button"
              aria-pressed={tags.includes(tg.id)}
              onClick={() =>
                setTags((p) => (p.includes(tg.id) ? p.filter((x) => x !== tg.id) : [...p, tg.id]))
              }
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition",
                tags.includes(tg.id)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {label(tg)}
            </button>
          ))}
        </div>

        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={600}
          rows={3}
          placeholder={
            lang === "ta"
              ? "மற்ற பயணிகளுக்கு உதவும் தகவலை பகிரவும் (விருப்பம்)"
              : "Share details that help other travellers (optional)"
          }
        />

        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={rating === 0 || submit.isPending}
            onClick={() => submit.mutate()}
            className="gap-2"
          >
            {submit.isPending && <Loader2 className="size-4 animate-spin" />}
            {lang === "ta" ? "மதிப்பீட்டை சமர்ப்பி" : "Submit review"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
            {lang === "ta" ? "ரத்து" : "Cancel"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {lang === "ta"
            ? "முடிந்த பயணங்களுக்கு மட்டுமே மதிப்பீடு — ஒரு டிக்கெட்டுக்கு ஒரு மதிப்பீடு."
            : "Only completed trips can be reviewed — one verified review per ticket."}
        </p>
      </CardContent>
    </Card>
  );
}
