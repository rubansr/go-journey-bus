import QRCode from "qrcode";

export type TicketData = {
  pnr: string;
  bookingId: string;
  fromCity: string;
  toCity: string;
  operator: string;
  busType: string;
  busNumber?: string | null;
  departAt: string;
  arriveAt: string;
  boarding: string;
  dropping: string;
  seats: string[];
  passengers: { seat?: string; name?: string; age?: string | number; gender?: string }[];
  total: number;
  walletAmount?: number;
  paymentMethod: string;
  status: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function ticketSummary(t: TicketData, url?: string) {
  const lines = [
    `NXTIXA Go e-ticket`,
    `PNR: ${t.pnr}`,
    `${t.fromCity} -> ${t.toCity}`,
    `${t.operator} · ${t.busType}${t.busNumber ? ` · ${t.busNumber}` : ""}`,
    `Departs: ${fmtDate(t.departAt)}`,
    `Arrives: ${fmtDate(t.arriveAt)}`,
    `Boarding: ${t.boarding}`,
    `Dropping: ${t.dropping}`,
    `Seats: ${t.seats.join(", ")}`,
    `Passengers: ${t.passengers.map((p) => `${p.name ?? ""} (${p.seat ?? ""})`).join(", ")}`,
    `Fare paid: Rs ${Math.round(t.total)} via ${t.paymentMethod}`,
    `Status: ${t.status}`,
  ];
  if (url) lines.push(`Ticket: ${url}`);
  return lines.join("\n");
}

export function whatsappShareUrl(t: TicketData, url?: string) {
  return `https://wa.me/?text=${encodeURIComponent(ticketSummary(t, url))}`;
}

export async function qrDataUrl(pnr: string) {
  return QRCode.toDataURL(`NXTIXA-${pnr}`, { width: 320, margin: 1 });
}

/** Builds and downloads a professional A4 e-ticket PDF. */
export async function downloadTicketPdf(t: TicketData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 40;

  // Header band
  doc.setFillColor(37, 66, 214);
  doc.rect(0, 0, W, 84, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("NXTIXA Go", M, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Bus e-ticket · Show this at boarding", M, 60);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`PNR ${t.pnr}`, W - M, 46, { align: "right" });

  doc.setTextColor(20, 20, 25);
  let y = 120;
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`${t.fromCity}  →  ${t.toCity}`, M, y);
  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(90, 90, 100);
  doc.text(`${t.operator} · ${t.busType}${t.busNumber ? ` · Bus ${t.busNumber}` : ""}`, M, y);

  // QR
  try {
    const qr = await qrDataUrl(t.pnr);
    doc.addImage(qr, "PNG", W - M - 120, 100, 120, 120);
  } catch {
    /* QR is optional */
  }

  y += 34;
  doc.setTextColor(20, 20, 25);
  const rows: [string, string][] = [
    ["Departure", fmtDate(t.departAt)],
    ["Arrival", fmtDate(t.arriveAt)],
    ["Boarding point", t.boarding || "-"],
    ["Dropping point", t.dropping || "-"],
    ["Seats", t.seats.join(", ")],
    ["Status", t.status],
  ];
  for (const [label, value] of rows) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(110, 110, 120);
    doc.setFontSize(10);
    doc.text(label, M, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 25);
    doc.setFontSize(12);
    doc.text(String(value), M + 130, y);
    y += 22;
  }

  y += 12;
  doc.setDrawColor(220, 220, 230);
  doc.line(M, y, W - M, y);
  y += 26;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Passengers", M, y);
  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  for (const p of t.passengers) {
    doc.text(`${p.seat ?? "-"}   ${p.name ?? "-"}   ${p.age ?? "-"} yrs   ${p.gender ?? "-"}`, M, y);
    y += 18;
  }

  y += 16;
  doc.setDrawColor(220, 220, 230);
  doc.line(M, y, W - M, y);
  y += 26;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Fare details", M, y);
  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Total paid: Rs ${Math.round(t.total)}`, M, y);
  y += 18;
  doc.text(`Payment method: ${t.paymentMethod}`, M, y);
  if (t.walletAmount && t.walletAmount > 0) {
    y += 18;
    doc.text(`Paid from wallet: Rs ${Math.round(t.walletAmount)}`, M, y);
  }
  y += 18;
  doc.text(`Contact: ${t.contactPhone ?? "-"} · ${t.contactEmail ?? "-"}`, M, y);

  doc.setFontSize(9);
  doc.setTextColor(130, 130, 140);
  doc.text(
    "Cancel 24h before departure for 90% refund · 6h for 70% · 1h for 50%. Refunds are credited to your NXTIXA wallet instantly.",
    M,
    doc.internal.pageSize.getHeight() - 50,
    { maxWidth: W - M * 2 },
  );

  doc.save(`NXTIXA-${t.pnr}.pdf`);
}
