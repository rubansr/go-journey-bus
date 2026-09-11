import type { TicketData } from "@/lib/ticket-pdf";

const KEY = "nxtixa-offline-tickets";

export type OfflineTicket = TicketData & { qr: string; savedAt: string };

function readAll(): OfflineTicket[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OfflineTicket[]) : [];
  } catch {
    return [];
  }
}

export function listOfflineTickets(): OfflineTicket[] {
  return readAll().sort((a, b) => (a.departAt < b.departAt ? -1 : 1));
}

export function getOfflineTicket(bookingId: string): OfflineTicket | undefined {
  return readAll().find((t) => t.bookingId === bookingId);
}

export function saveOfflineTicket(ticket: TicketData, qr: string) {
  if (typeof window === "undefined") return;
  const all = readAll().filter((t) => t.bookingId !== ticket.bookingId);
  all.push({ ...ticket, qr, savedAt: new Date().toISOString() });
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all.slice(-30)));
  } catch {
    /* storage full — ignore */
  }
}

export function removeOfflineTicket(bookingId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(readAll().filter((t) => t.bookingId !== bookingId)));
}
