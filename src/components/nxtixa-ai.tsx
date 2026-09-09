import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useQuery } from "@tanstack/react-query";
import { Bot, Mic, MicOff, MessageCircle, Sparkle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type AiLang = "en" | "ta" | "hi";

const COPY: Record<AiLang, { title: string; sub: string; welcome: string; placeholder: string; quick: string[] }> = {
  en: {
    title: "NXTIXA AI",
    sub: "Your 24/7 travel assistant",
    welcome:
      "Hi! I'm **NXTIXA AI** 🚌 Ask me to find buses, pick the best seat, compare fares, track a booking or plan a weekend trip.",
    placeholder: "Ask anything about your trip…",
    quick: [
      "Find buses from Chennai to Coimbatore tonight",
      "Which seat is best for sleeping?",
      "Show cheapest buses tomorrow",
      "How do I cancel my ticket?",
      "Suggest weekend trips near Chennai",
    ],
  },
  ta: {
    title: "NXTIXA AI",
    sub: "24/7 பயண உதவியாளர்",
    welcome:
      "வணக்கம்! நான் **NXTIXA AI** 🚌 பேருந்து தேட, சிறந்த இருக்கை தேர்வு, கட்டண ஒப்பீடு, முன்பதிவு கண்காணிப்பு — எதுவும் கேளுங்கள்.",
    placeholder: "உங்கள் பயணம் பற்றி கேளுங்கள்…",
    quick: [
      "இன்று இரவு சென்னை to கோயம்புத்தூர் பேருந்துகள்",
      "தூங்குவதற்கு சிறந்த இருக்கை எது?",
      "நாளை மலிவான பேருந்துகள்",
      "டிக்கெட்டை எப்படி ரத்து செய்வது?",
      "சென்னை அருகே வார இறுதி பயணங்கள்",
    ],
  },
  hi: {
    title: "NXTIXA AI",
    sub: "24/7 यात्रा सहायक",
    welcome:
      "नमस्ते! मैं **NXTIXA AI** हूँ 🚌 बस खोजें, बेहतरीन सीट चुनें, किराया तुलना करें या बुकिंग ट्रैक करें — कुछ भी पूछें।",
    placeholder: "अपनी यात्रा के बारे में पूछें…",
    quick: [
      "आज रात चेन्नई से कोयंबटूर बसें दिखाएँ",
      "सोने के लिए कौन सी सीट सबसे अच्छी है?",
      "कल की सबसे सस्ती बसें",
      "टिकट कैसे रद्द करें?",
      "चेन्नई के पास वीकेंड ट्रिप सुझाएँ",
    ],
  },
};

const SPEECH_LOCALE: Record<AiLang, string> = { en: "en-IN", ta: "ta-IN", hi: "hi-IN" };

export function NxtixaAi() {
  const { lang: appLang } = useI18n();
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [aiLang, setAiLang] = useState<AiLang>(appLang === "ta" ? "ta" : "en");
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => setAiLang(appLang === "ta" ? "ta" : "en"), [appLang]);

  const copy = COPY[aiLang];

  const { data: bookings } = useQuery({
    queryKey: ["ai-bookings", user?.id],
    enabled: !!user && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select("pnr, status, seats, total_amount, trips(from_city, to_city, depart_at)")
        .order("created_at", { ascending: false })
        .limit(5);
      return (data ?? []).map((b) => {
        const trip = b.trips as { from_city?: string; to_city?: string; depart_at?: string } | null;
        return {
          pnr: b.pnr,
          status: b.status,
          seats: b.seats,
          route: `${trip?.from_city ?? "?"} → ${trip?.to_city ?? "?"}`,
          departAt: trip?.depart_at ?? "",
          amount: Number(b.total_amount),
        };
      });
    },
  });

  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, stop, error } = useChat({ transport });

  const busy = status === "submitted" || status === "streaming";

  function send(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    setInput("");
    void sendMessage({ text: value }, { body: { lang: aiLang, bookings: bookings ?? [] } });
  }

  function toggleVoice() {
    const SR =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
        : undefined;
    if (!SR) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = SPEECH_LOCALE[aiLang];
    rec.interimResults = false;
    rec.onresult = (e: any) => setInput(String(e.results[0][0].transcript));
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close NXTIXA AI" : "Open NXTIXA AI"}
        aria-expanded={open}
        className={cn(
          "fixed bottom-5 right-5 z-[60] flex size-14 items-center justify-center rounded-2xl text-primary-foreground shadow-xl shadow-primary/30 transition-transform hover:scale-105 active:scale-95",
          "brand-gradient",
        )}
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
        {!open && (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Sparkle className="size-3" />
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="NXTIXA AI travel assistant"
          className={cn(
            "fixed z-[60] flex flex-col overflow-hidden rounded-3xl border border-border/60 shadow-2xl",
            "bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60",
            "inset-x-3 bottom-24 top-16 sm:inset-x-auto sm:top-auto sm:right-5 sm:h-[min(38rem,80vh)] sm:w-[26rem]",
          )}
        >
          <div className="flex items-center gap-3 border-b border-border/60 bg-gradient-to-r from-primary/15 to-accent/15 px-4 py-3">
            <span className="brand-gradient flex size-9 items-center justify-center rounded-xl text-primary-foreground">
              <Bot className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-display text-sm font-bold leading-tight">{copy.title}</p>
              <p className="truncate text-xs text-muted-foreground">{copy.sub}</p>
            </div>
            <div className="ml-auto flex items-center gap-1 rounded-full border border-border/60 bg-background/60 p-0.5">
              {(["en", "ta", "hi"] as AiLang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setAiLang(l)}
                  className={cn(
                    "rounded-full px-2 py-1 text-[11px] font-semibold uppercase transition-colors",
                    aiLang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <Conversation className="flex-1">
            <ConversationContent className="gap-3 p-4">
              {messages.length === 0 && (
                <Message from="assistant">
                  <MessageContent className="bg-transparent p-0">
                    <MessageResponse>{copy.welcome}</MessageResponse>
                  </MessageContent>
                </Message>
              )}

              {messages.map((m) => {
                const text = m.parts
                  .map((p) => (p.type === "text" ? p.text : ""))
                  .join("")
                  .trim();
                if (!text) return null;
                return (
                  <Message from={m.role === "user" ? "user" : "assistant"} key={m.id}>
                    <MessageContent
                      className={cn(
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-transparent p-0 text-foreground",
                      )}
                    >
                      <MessageResponse>{text}</MessageResponse>
                    </MessageContent>
                  </Message>
                );
              })}

              {busy && (
                <Shimmer className="px-1 text-sm">
                  {aiLang === "ta" ? "யோசிக்கிறேன்…" : aiLang === "hi" ? "सोच रहा हूँ…" : "Thinking…"}
                </Shimmer>
              )}

              {error && (
                <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error.message || "Assistant unavailable right now. Please try again."}
                </p>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="flex gap-2 overflow-x-auto border-t border-border/60 px-3 py-2 [scrollbar-width:none]">
            {copy.quick.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                disabled={busy}
                className="shrink-0 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="p-3 pt-0">
            <PromptInput
              onSubmit={(_message, event) => {
                event.preventDefault();
                send(input);
              }}
            >
              <PromptInputTextarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={copy.placeholder}
                className="max-h-32"
              />
              <PromptInputFooter className="justify-end gap-1">
                <Button
                  type="button"
                  variant={listening ? "default" : "ghost"}
                  size="icon"
                  className="size-8"
                  onClick={toggleVoice}
                  aria-label={listening ? "Stop voice input" : "Start voice input"}
                >
                  {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                </Button>
                <PromptInputSubmit status={status} onStop={stop} disabled={!input.trim() && !busy} />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      )}
    </>
  );
}
