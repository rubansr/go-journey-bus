import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, ShieldAlert, Trash2, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/passengers")({
  head: () => ({
    meta: [
      { title: "Saved passengers & emergency contacts — NXTIXA Go" },
      {
        name: "description",
        content: "Save family members and frequent travellers for one-tap booking, and keep emergency contacts ready.",
      },
      { property: "og:title", content: "Saved passengers — NXTIXA Go" },
      { property: "og:description", content: "Book faster with saved travellers and emergency contacts." },
    ],
  }),
  component: PassengersPage,
});

type Row = { id: string; name: string; age: number; gender: string; relation: string; phone: string };
type Contact = { id: string; name: string; phone: string; relation: string };

const empty = { name: "", age: "25", gender: "male", relation: "", phone: "" };

function PassengersPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [contact, setContact] = useState({ name: "", phone: "", relation: "" });

  const { data: people, isLoading } = useQuery({
    queryKey: ["saved-passengers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("saved_passengers").select("*").order("created_at");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const { data: contacts } = useQuery({
    queryKey: ["emergency-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("emergency_contacts").select("*").order("created_at");
      if (error) throw error;
      return (data ?? []) as Contact[];
    },
  });

  async function savePerson() {
    if (!form.name.trim()) {
      toast.error(t("enter_name"));
      return;
    }
    const payload = {
      name: form.name.trim(),
      age: Number(form.age) || 25,
      gender: form.gender,
      relation: form.relation,
      phone: form.phone,
    };
    const { error } = editing
      ? await supabase.from("saved_passengers").update(payload).eq("id", editing)
      : await supabase.from("saved_passengers").insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("passenger_saved"));
    setForm(empty);
    setEditing(null);
    await qc.invalidateQueries({ queryKey: ["saved-passengers"] });
  }

  async function removePerson(id: string) {
    const { error } = await supabase.from("saved_passengers").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["saved-passengers"] });
  }

  async function saveContact() {
    if (!contact.name.trim() || contact.phone.replace(/\D/g, "").length < 10) {
      toast.error(t("contact_invalid"));
      return;
    }
    const { error } = await supabase.from("emergency_contacts").insert(contact);
    if (error) {
      toast.error(error.message);
      return;
    }
    setContact({ name: "", phone: "", relation: "" });
    await qc.invalidateQueries({ queryKey: ["emergency-contacts"] });
  }

  async function removeContact(id: string) {
    await supabase.from("emergency_contacts").delete().eq("id", id);
    await qc.invalidateQueries({ queryKey: ["emergency-contacts"] });
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold sm:text-3xl">{t("saved_passengers")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("saved_passengers_sub")}</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <UserRound className="size-5 text-primary" /> {editing ? t("edit_passenger") : t("add_passenger")}
            </h2>
            <div className="space-y-1.5">
              <Label htmlFor="p-name">{t("name")}</Label>
              <Input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-age">{t("age")}</Label>
                <Input
                  id="p-age"
                  inputMode="numeric"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-rel">{t("relation")}</Label>
                <Input id="p-rel" value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2">
              {(["male", "female", "other"] as const).map((g) => (
                <Button
                  key={g}
                  type="button"
                  size="sm"
                  variant={form.gender === g ? "default" : "outline"}
                  onClick={() => setForm({ ...form, gender: g })}
                >
                  {t(g)}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button className="gap-2" onClick={savePerson}>
                <Plus className="size-4" /> {editing ? t("save") : t("add_passenger")}
              </Button>
              {editing && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditing(null);
                    setForm(empty);
                  }}
                >
                  {t("close")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-6">
            <h2 className="text-lg font-semibold">{t("your_travellers")}</h2>
            {isLoading && <Skeleton className="h-24 rounded-xl" />}
            {!isLoading && (people ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">{t("no_passengers")}</p>
            )}
            {(people ?? []).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.age} · {t(p.gender)} {p.relation ? `· ${p.relation}` : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={t("edit_passenger")}
                    onClick={() => {
                      setEditing(p.id);
                      setForm({
                        name: p.name,
                        age: String(p.age),
                        gender: p.gender,
                        relation: p.relation,
                        phone: p.phone,
                      });
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button size="icon" variant="ghost" aria-label={t("delete")} onClick={() => removePerson(p.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardContent className="space-y-4 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ShieldAlert className="size-5 text-primary" /> {t("emergency_contacts")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("emergency_contacts_sub")}</p>
          <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr_1fr_auto]">
            <Input
              aria-label={t("name")}
              placeholder={t("name")}
              value={contact.name}
              onChange={(e) => setContact({ ...contact, name: e.target.value })}
            />
            <Input
              aria-label={t("phone")}
              placeholder={t("phone")}
              inputMode="tel"
              value={contact.phone}
              onChange={(e) => setContact({ ...contact, phone: e.target.value })}
            />
            <Input
              aria-label={t("relation")}
              placeholder={t("relation")}
              value={contact.relation}
              onChange={(e) => setContact({ ...contact, relation: e.target.value })}
            />
            <Button onClick={saveContact}>{t("add")}</Button>
          </div>
          <div className="space-y-2">
            {(contacts ?? []).map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.phone} {c.relation ? `· ${c.relation}` : ""}
                  </p>
                </div>
                <Button size="icon" variant="ghost" aria-label={t("delete")} onClick={() => removeContact(c.id)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
            {(contacts ?? []).length === 0 && <p className="text-sm text-muted-foreground">{t("no_contacts")}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
