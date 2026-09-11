import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ambulance, Headphones, PhoneCall, ShieldAlert, Siren } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

type Contact = { id: string; name: string; phone: string; relation: string };

export function SosSafety({
  bookingId,
  tripLabel,
  seats,
}: {
  bookingId: string;
  tripLabel: string;
  seats: string[];
}) {
  const { t } = useI18n();
  const [report, setReport] = useState("");
  const [sending, setSending] = useState(false);

  const { data: contacts } = useQuery({
    queryKey: ["emergency-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("emergency_contacts").select("*").order("created_at");
      if (error) throw error;
      return (data ?? []) as Contact[];
    },
  });

  function shareLiveLocation() {
    if (!navigator.geolocation) {
      toast.error(t("location_unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const map = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
        const text = `${t("sos_message")} ${tripLabel} · ${t("seats")} ${seats.join(", ")} · ${map}`;
        const first = contacts?.[0]?.phone.replace(/\D/g, "");
        const url = first
          ? `https://wa.me/91${first.slice(-10)}?text=${encodeURIComponent(text)}`
          : `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, "_blank", "noopener");
      },
      () => toast.error(t("location_unavailable")),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function submitReport(category: string) {
    if (!report.trim()) {
      toast.error(t("describe_issue"));
      return;
    }
    setSending(true);
    const { error } = await supabase.from("safety_reports").insert({
      booking_id: bookingId,
      category,
      message: report.trim(),
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setReport("");
    toast.success(t("report_sent"));
  }

  return (
    <Card className="border-destructive/30">
      <CardContent className="space-y-4 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ShieldAlert className="size-5 text-destructive" /> {t("safety_centre")}
        </h2>

        <Button
          size="lg"
          variant="destructive"
          className="h-14 w-full gap-2 text-base font-bold"
          onClick={shareLiveLocation}
        >
          <Siren className="size-5" /> {t("sos_button")}
        </Button>
        <p className="text-xs text-muted-foreground">{t("sos_note")}</p>

        <div className="grid gap-2 sm:grid-cols-3">
          <Button asChild variant="outline" className="gap-2">
            <a href="tel:100">
              <PhoneCall className="size-4" /> {t("police")} 100
            </a>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <a href="tel:108">
              <Ambulance className="size-4" /> {t("ambulance")} 108
            </a>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <a href="tel:1091">
              <Headphones className="size-4" /> {t("women_helpline")} 1091
            </a>
          </Button>
        </div>

        <div>
          <p className="text-sm font-semibold">{t("emergency_contacts")}</p>
          {(contacts ?? []).length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">{t("no_contacts_hint")}</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {(contacts ?? []).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2">
                  <span>
                    {c.name} {c.relation ? `· ${c.relation}` : ""}
                  </span>
                  <a className="font-medium text-primary" href={`tel:${c.phone}`}>
                    {c.phone}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">{t("report_issue")}</p>
          <Textarea
            aria-label={t("report_issue")}
            value={report}
            onChange={(e) => setReport(e.target.value)}
            placeholder={t("report_placeholder")}
            rows={3}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={sending} onClick={() => submitReport("women_safety")}>
              {t("women_safety_report")}
            </Button>
            <Button size="sm" variant="outline" disabled={sending} onClick={() => submitReport("other")}>
              {t("other_issue")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
