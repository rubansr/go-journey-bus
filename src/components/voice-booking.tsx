import { useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Mic, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { todayISO } from "@/lib/booking";
import { labelFor, matchLocations, useLocations } from "@/lib/locations";
import { useI18n } from "@/lib/i18n";

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Splits a spoken sentence (English, Tamil or Tanglish) into a journey. */
export function parseJourney(text: string) {
  const lower = text.toLowerCase();
  let date = todayISO();
  if (/(tomorrow|நாளை|kal)\b/.test(lower)) date = addDays(todayISO(), 1);
  if (/(day after|நாளை மறுநாள்)/.test(lower)) date = addDays(todayISO(), 2);

  const seps = /\s(?:to|வரை|இருந்து|-|→)\s|\sto\s/;
  const cleaned = lower
    .replace(/\b(book|buses?|bus|ticket|find|search|tonight|tomorrow|today|please|for|a|the|நாளை|இன்று|பேருந்து|டிக்கெட்)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const parts = cleaned.split(seps).map((p) => p.trim()).filter(Boolean);
  const fromText = parts[0] ?? "";
  const toText = parts[1] ?? "";
  return { fromText, toText, date };
}

export function VoiceBooking() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { data: locations = [] } = useLocations();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [journey, setJourney] = useState<{ from: string; to: string; date: string } | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  function start() {
    const Ctor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!Ctor) {
      toast.error(t("voice_unsupported"));
      return;
    }
    const rec = new Ctor();
    recRef.current = rec;
    rec.lang = lang === "ta" ? "ta-IN" : "en-IN";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      const said = e.results[0]?.[0]?.transcript ?? "";
      setTranscript(said);
      const { fromText, toText, date } = parseJourney(said);
      const from = matchLocations(locations, fromText, 1)[0];
      const to = matchLocations(locations, toText, 1)[0];
      if (!from || !to) {
        toast.error(t("voice_not_understood"));
        setJourney(null);
        return;
      }
      setJourney({ from: from.name_en, to: to.name_en, date });
    };
    rec.onerror = () => {
      setListening(false);
      toast.error(t("voice_error"));
    };
    rec.onend = () => setListening(false);
    setTranscript("");
    setJourney(null);
    setListening(true);
    rec.start();
  }

  function stop() {
    recRef.current?.stop();
    setListening(false);
  }

  const fromLoc = journey ? locations.find((l) => l.name_en === journey.from) : undefined;
  const toLoc = journey ? locations.find((l) => l.name_en === journey.to) : undefined;

  return (
    <Card className="border-primary/30">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="icon"
            className="size-14 shrink-0 rounded-full"
            variant={listening ? "destructive" : "default"}
            onClick={listening ? stop : start}
            aria-label={listening ? t("voice_stop") : t("voice_start")}
          >
            {listening ? <Square className="size-5" /> : <Mic className="size-6" />}
          </Button>
          <div>
            <p className="font-semibold">{t("voice_booking")}</p>
            <p className="text-sm text-muted-foreground">{listening ? t("voice_listening") : t("voice_hint")}</p>
          </div>
          {listening && <Loader2 className="ml-auto size-5 animate-spin text-primary" />}
        </div>

        {transcript && <p className="rounded-xl bg-muted/60 p-3 text-sm italic">“{transcript}”</p>}

        {journey && (
          <div className="rounded-xl border border-border p-4">
            <p className="text-sm font-semibold">{t("confirm_journey")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {fromLoc ? labelFor(fromLoc, lang) : journey.from} → {toLoc ? labelFor(toLoc, lang) : journey.to} ·{" "}
              {new Date(`${journey.date}T00:00:00`).toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() =>
                  navigate({ to: "/search", search: { from: journey.from, to: journey.to, date: journey.date, pax: 1 } })
                }
              >
                {t("search_buses")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setJourney(null)}>
                {t("close")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
