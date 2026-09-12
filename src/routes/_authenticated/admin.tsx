import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/use-roles";
import { CITIES, formatDay, formatTime, inr, todayISO } from "@/lib/booking";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Operator portal — manage buses, schedules & fares" },
      {
        name: "description",
        content: "NXTIXA Go staff portal: add verified operators, publish schedules, set fares and seat availability.",
      },
      { property: "og:title", content: "Operator portal — NXTIXA Go" },
      { property: "og:description", content: "Manage bus inventory, schedules, fares and live trip status." },
    ],
  }),
  component: AdminPage,
});

const TABS = ["schedules", "inventory", "bookings", "reviews"] as const;
type Tab = (typeof TABS)[number];

function AdminPage() {
  const { t } = useI18n();
  const { isStaff, isAdmin, isLoading } = useRoles();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("schedules");
  const [claiming, setClaiming] = useState(false);

  async function claimAccess() {
    setClaiming(true);
    const { data, error } = await supabase.rpc("bootstrap_admin");
    setClaiming(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) {
      toast.success(t("admin_granted"));
      await queryClient.invalidateQueries({ queryKey: ["my-roles"] });
    } else {
      toast.error(t("admin_exists"));
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-16 text-center">
        <ShieldCheck className="mx-auto size-10 text-primary" />
        <h1 className="mt-4 font-display text-2xl font-bold">{t("staff_only")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("staff_only_sub")}</p>
        <Button className="mt-6" onClick={claimAccess} disabled={claiming}>
          {claiming ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          {t("claim_admin")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{t("admin_portal")}</h1>
        <Badge variant="secondary">{isAdmin ? t("role_admin") : t("role_operator")}</Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{t("admin_sub")}</p>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist">
        {TABS.map((x) => (
          <Button
            key={x}
            role="tab"
            aria-selected={tab === x}
            variant={tab === x ? "default" : "outline"}
            size="sm"
            onClick={() => setTab(x)}
          >
            {t(`tab_${x}`)}
          </Button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "schedules" && <Schedules />}
        {tab === "inventory" && <Inventory isAdmin={isAdmin} />}
        {tab === "bookings" && <StaffBookings />}
        {tab === "reviews" && <ReviewModeration isAdmin={isAdmin} />}
      </div>
    </div>
  );
}

function Schedules() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(todayISO());
  const [saving, setSaving] = useState<string | null>(null);

  const { data: operators } = useQuery({
    queryKey: ["admin-operators"],
    queryFn: async () => {
      const { data, error } = await supabase.from("operators").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: trips, isLoading } = useQuery({
    queryKey: ["admin-trips", date],
    queryFn: async () => {
      const start = new Date(`${date}T00:00:00`).toISOString();
      const end = new Date(`${date}T23:59:59`).toISOString();
      const { data, error } = await supabase
        .from("trips")
        .select("*, operators(name)")
        .gte("depart_at", start)
        .lte("depart_at", end)
        .order("depart_at");
      if (error) throw error;
      return data;
    },
  });

  async function update(id: string, patch: Record<string, unknown>) {
    setSaving(id);
    const { error } = await supabase.from("trips").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
    setSaving(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("schedule_updated"));
    await queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
  }

  return (
    <div className="space-y-5">
      <NewTripForm operators={operators ?? []} />

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label htmlFor="admin-date">{t("date")}</Label>
              <Input
                id="admin-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 h-11"
              />
            </div>
            <p className="pb-3 text-sm text-muted-foreground">
              {(trips ?? []).length} {t("scheduled_departures")}
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            {!isLoading && (trips ?? []).length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">{t("no_schedules")}</p>
            )}
            {(trips ?? []).map((trip) => {
              const seatsLeft = trip.total_seats - (trip.booked_seats?.length ?? 0);
              return (
                <div key={trip.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">
                      {trip.from_city} → {trip.to_city}
                    </p>
                    <span className="text-sm text-muted-foreground">
                      {trip.operators?.name} · {trip.bus_type} · {formatTime(trip.depart_at)}
                    </span>
                    <Badge variant={trip.delay_mins > 0 ? "destructive" : "secondary"}>
                      {trip.delay_mins > 0 ? `+${trip.delay_mins}m` : trip.trip_status}
                    </Badge>
                    <span className="ml-auto text-sm">
                      {seatsLeft}/{trip.total_seats} {t("seats_left")}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-4">
                    <FieldNumber
                      label={t("fare")}
                      defaultValue={String(Math.round(Number(trip.fare)))}
                      onCommit={(v) => update(trip.id, { fare: Number(v) })}
                    />
                    <FieldNumber
                      label={t("total_seats")}
                      defaultValue={String(trip.total_seats)}
                      onCommit={(v) => update(trip.id, { total_seats: Number(v) })}
                    />
                    <FieldNumber
                      label={t("delay_mins")}
                      defaultValue={String(trip.delay_mins)}
                      onCommit={(v) => update(trip.id, { delay_mins: Number(v) })}
                    />
                    <div>
                      <Label className="text-xs">{t("status")}</Label>
                      <select
                        value={trip.trip_status}
                        onChange={(e) => update(trip.id, { trip_status: e.target.value })}
                        className="mt-1 h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
                      >
                        {["scheduled", "departed", "arrived", "cancelled"].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <div className="min-w-56 flex-1">
                      <Label className="text-xs">{t("passenger_note")}</Label>
                      <Input
                        defaultValue={trip.tracking_note ?? ""}
                        placeholder={t("note_placeholder")}
                        onBlur={(e) => {
                          if ((trip.tracking_note ?? "") !== e.target.value) {
                            void update(trip.id, { tracking_note: e.target.value || null });
                          }
                        }}
                        className="mt-1 h-10"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={saving === trip.id}
                      onClick={() => update(trip.id, { booked_seats: [] })}
                    >
                      {t("release_all_seats")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NewTripForm({ operators }: { operators: { id: string; name: string }[] }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    operator_id: "",
    from_city: "Chennai",
    to_city: "Madurai",
    date: todayISO(),
    depart: "21:00",
    hours: "9",
    bus_type: "AC Sleeper",
    fare: "950",
    total_seats: "36",
  });

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    const operatorId = form.operator_id || operators[0]?.id;
    if (!operatorId) {
      toast.error(t("add_operator_first"));
      return;
    }
    const depart = new Date(`${form.date}T${form.depart}:00`);
    const arrive = new Date(depart.getTime() + Number(form.hours) * 3600000);
    setBusy(true);
    const { error } = await supabase.from("trips").insert({
      operator_id: operatorId,
      from_city: form.from_city,
      to_city: form.to_city,
      depart_at: depart.toISOString(),
      arrive_at: arrive.toISOString(),
      bus_type: form.bus_type,
      fare: Number(form.fare),
      total_seats: Number(form.total_seats),
      amenities: ["Charging point", "Water bottle", "Blanket"],
      boarding_points: [`${form.from_city} Central`, `${form.from_city} Bypass`],
      dropping_points: [`${form.to_city} Bus Stand`, `${form.to_city} Junction`],
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("schedule_added"));
    setOpen(false);
    await queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{t("add_schedule")}</h2>
          <Button variant={open ? "outline" : "default"} size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? t("close") : t("add_schedule")}
          </Button>
        </div>

        {open && (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs">{t("operators")}</Label>
              <select
                value={form.operator_id || operators[0]?.id || ""}
                onChange={(e) => set("operator_id", e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                {operators.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
            <CitySelect label={t("from")} value={form.from_city} onChange={(v) => set("from_city", v)} />
            <CitySelect label={t("to")} value={form.to_city} onChange={(v) => set("to_city", v)} />
            <Field label={t("date")} type="date" value={form.date} onChange={(v) => set("date", v)} />
            <Field label={t("departure")} type="time" value={form.depart} onChange={(v) => set("depart", v)} />
            <Field label={t("duration_hours")} value={form.hours} onChange={(v) => set("hours", v)} />
            <Field label={t("bus_type")} value={form.bus_type} onChange={(v) => set("bus_type", v)} />
            <Field label={t("fare")} value={form.fare} onChange={(v) => set("fare", v)} />
            <Field label={t("total_seats")} value={form.total_seats} onChange={(v) => set("total_seats", v)} />
            <div className="sm:col-span-3">
              <Button onClick={submit} disabled={busy} className="w-full sm:w-auto">
                {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                {t("publish_schedule")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Inventory({ isAdmin }: { isAdmin: boolean }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: operators, isLoading } = useQuery({
    queryKey: ["admin-operators"],
    queryFn: async () => {
      const { data, error } = await supabase.from("operators").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  async function addOperator() {
    if (!name.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("operators").insert({ name: name.trim(), verified: true });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setName("");
    toast.success(t("operator_added"));
    await queryClient.invalidateQueries({ queryKey: ["admin-operators"] });
  }

  async function toggleVerified(id: string, verified: boolean) {
    const { error } = await supabase.from("operators").update({ verified }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["admin-operators"] });
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold">{t("bus_inventory")}</h2>
        {isAdmin && (
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-56 flex-1">
              <Label htmlFor="op-name">{t("operator_name")}</Label>
              <Input id="op-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-11" />
            </div>
            <Button onClick={addOperator} disabled={busy} className="h-11">
              {t("add_operator")}
            </Button>
          </div>
        )}

        <div className="mt-5 space-y-2">
          {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          {(operators ?? []).map((o) => (
            <div key={o.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-4">
              <p className="font-medium">{o.name}</p>
              <span className="text-sm text-muted-foreground">
                ★ {Number(o.rating).toFixed(1)} · {o.total_trips.toLocaleString()} {t("trips_done")}
              </span>
              <Badge variant={o.verified ? "secondary" : "destructive"} className="ml-auto">
                {o.verified ? t("verified") : t("unverified")}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => toggleVerified(o.id, !o.verified)}>
                {o.verified ? t("revoke") : t("verify")}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StaffBookings() {
  const { t } = useI18n();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, trips(from_city, to_city, depart_at)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const revenue = (data ?? [])
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + Number(b.total_amount), 0);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{t("recent_bookings")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("net_revenue")}: <span className="font-semibold text-foreground">{inr(revenue)}</span>
          </p>
        </div>
        <div className="mt-4 space-y-2">
          {isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          {!isLoading && (data ?? []).length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("no_bookings_yet")}</p>
          )}
          {(data ?? []).map((b) => (
            <div key={b.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-4 text-sm">
              <span className="font-mono">{b.pnr}</span>
              <span>
                {b.trips?.from_city} → {b.trips?.to_city}
              </span>
              <span className="text-muted-foreground">
                {b.trips?.depart_at ? formatDay(b.trips.depart_at) : ""} · {b.seats.join(", ")}
              </span>
              <Badge variant={b.status === "cancelled" ? "destructive" : "secondary"} className="ml-auto">
                {b.status}
              </Badge>
              <span className="font-semibold">{inr(Number(b.total_amount))}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 h-10" />
    </div>
  );
}

function FieldNumber({
  label,
  defaultValue,
  onCommit,
}: {
  label: string;
  defaultValue: string;
  onCommit: (v: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        defaultValue={defaultValue}
        className="mt-1 h-10"
        onBlur={(e) => {
          if (e.target.value !== defaultValue && e.target.value !== "") onCommit(e.target.value);
        }}
      />
    </div>
  );
}

function CitySelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
      >
        {CITIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
    </div>
  );
}
