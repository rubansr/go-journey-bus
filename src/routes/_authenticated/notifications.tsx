import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, BellRing, CheckCheck, Megaphone, Ticket, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/hooks/use-notifications";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — NXTIXA Go" },
      {
        name: "description",
        content: "Booking confirmations, refund updates, delay alerts and operator announcements in one place.",
      },
      { property: "og:title", content: "Notifications — NXTIXA Go" },
      { property: "og:description", content: "Booking, refund and delay updates for your bus trips." },
    ],
  }),
  component: NotificationsPage,
});

const ICONS: Record<string, React.ReactNode> = {
  booking: <Ticket className="size-4" />,
  refund: <Wallet className="size-4" />,
  delay: <AlertTriangle className="size-4" />,
  promo: <Megaphone className="size-4" />,
};

function NotificationsPage() {
  const { t } = useI18n();
  const { data, isLoading } = useNotifications();
  const queryClient = useQueryClient();
  const items = data ?? [];
  const unread = items.filter((n) => !n.read_at).length;

  async function markAll() {
    const ids = items.filter((n) => !n.read_at).map((n) => n.id);
    if (!ids.length) return;
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", ids);
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function markOne(id: string) {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
          <BellRing className="size-6 text-primary" /> {t("notifications")}
          {unread > 0 && <Badge variant="secondary">{unread}</Badge>}
        </h1>
        <Button variant="outline" size="sm" className="gap-2" onClick={markAll} disabled={!unread}>
          <CheckCheck className="size-4" /> {t("mark_all_read")}
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}

        {!isLoading && items.length === 0 && (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">{t("no_notifications")}</CardContent>
          </Card>
        )}

        {items.map((n) => (
          <Card key={n.id} className={n.read_at ? "opacity-70" : "border-primary/40"}>
            <CardContent className="flex items-start gap-3 p-5">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {ICONS[n.kind] ?? <BellRing className="size-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{n.title}</p>
                  {!n.read_at && <Badge variant="secondary">{t("unread")}</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(n.created_at).toLocaleString("en-IN")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {n.booking_id && (
                    <Button asChild size="sm" variant="outline">
                      <Link to="/ticket/$bookingId" params={{ bookingId: n.booking_id }}>
                        {t("view_ticket")}
                      </Link>
                    </Button>
                  )}
                  {!n.read_at && (
                    <Button size="sm" variant="ghost" onClick={() => markOne(n.id)}>
                      {t("mark_read")}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
