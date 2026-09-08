"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatDate, formatPKR } from "@/lib/format";
import { generateVoucherPDF } from "@/lib/pdf";
import { Button, Card, EmptyState, PageHeader, Select } from "@/components/ui";

type VoucherKind = "hotel" | "transport" | "umrah" | "visa" | "payment" | "air_ticket" | "booking";

export default function VouchersPage() {
  const hotels = useAppStore((s) => s.hotels);
  const transports = useAppStore((s) => s.transports);
  const umrahPackages = useAppStore((s) => s.umrahPackages);
  const visas = useAppStore((s) => s.visas);
  const payments = useAppStore((s) => s.payments);
  const airTickets = useAppStore((s) => s.airTickets);
  const travelBookings = useAppStore((s) => s.travelBookings);
  const customers = useAppStore((s) => s.customers);

  const [kind, setKind] = useState<VoucherKind>("hotel");
  const customerName = (id: string) => customers.find((c) => c.id === id)?.name || "—";

  const generate = (id: string) => {
    if (kind === "hotel") {
      const h = hotels.find((x) => x.id === id);
      if (!h) return;
      generateVoucherPDF({
        kind: "hotel",
        bookingId: h.bookingId,
        customerName: customerName(h.customerId),
        lines: [
          { label: "Hotel", value: h.hotelName },
          { label: "City", value: h.city },
          { label: "Room", value: h.roomType },
          { label: "Check-in", value: formatDate(h.checkIn) },
          { label: "Check-out", value: formatDate(h.checkOut) },
        ],
        amount: formatPKR(h.salePrice),
      });
    } else if (kind === "transport") {
      const t = transports.find((x) => x.id === id);
      if (!t) return;
      generateVoucherPDF({
        kind: "transport",
        bookingId: t.bookingId,
        customerName: customerName(t.customerId),
        lines: [
          { label: "Type", value: t.type },
          { label: "Pickup", value: t.pickup },
          { label: "Drop-off", value: t.dropoff },
          { label: "Date", value: `${formatDate(t.date)} ${t.time}` },
          { label: "Vehicle", value: t.vehicle },
        ],
        amount: formatPKR(t.salePrice),
      });
    } else if (kind === "umrah") {
      const u = umrahPackages.find((x) => x.id === id);
      if (!u) return;
      generateVoucherPDF({
        kind: "umrah",
        bookingId: u.bookingId,
        customerName: customerName(u.customerId),
        lines: [
          { label: "Package", value: u.packageName },
          { label: "Travel", value: formatDate(u.travelDate) },
          { label: "Return", value: formatDate(u.returnDate) },
        ],
        amount: formatPKR(u.salePrice),
      });
    } else if (kind === "visa") {
      const v = visas.find((x) => x.id === id);
      if (!v) return;
      generateVoucherPDF({
        kind: "visa",
        bookingId: v.bookingId,
        customerName: customerName(v.customerId),
        lines: [
          { label: "Visa Type", value: v.visaType },
          { label: "Passport", value: v.passportNo },
          { label: "Submitted", value: formatDate(v.submissionDate) },
          { label: "Status", value: v.status },
        ],
        amount: formatPKR(v.salePrice),
      });
    } else {
      if (kind === "air_ticket") {
        const ticket = airTickets.find((x) => x.id === id);
        if (!ticket) return;
        generateVoucherPDF({
          kind,
          bookingId: ticket.bookingId,
          customerName: customerName(ticket.customerId),
          lines: [
            { label: "Passenger Names", value: ticket.passengerNames?.join(", ") || ticket.passengerName },
            { label: "PAX", value: String(ticket.pax || 1) },
            { label: "Per Ticket Price", value: formatPKR(ticket.perTicketPrice || ticket.salePrice / (ticket.pax || 1)) },
            { label: "Sector", value: ticket.sector },
          ],
          amount: formatPKR(ticket.totalAmount || ticket.salePrice),
        });
        return;
      }
      if (kind === "booking") {
        const booking = travelBookings.find((x) => x.id === id);
        if (!booking) return;
        const ticketLines = booking.services.flatMap((service) => service.tickets ?? []);
        generateVoucherPDF({
          kind,
          bookingId: booking.bookingId,
          customerName: customerName(booking.customerId),
          lines: [
            { label: "Passenger Names", value: ticketLines.map((ticket) => ticket.passengerName).join(", ") || "—" },
            { label: "PAX", value: String(ticketLines.length || 0) },
            { label: "Per Ticket Price", value: ticketLines.length ? formatPKR(ticketLines[0].salePrice) : "—" },
            { label: "Services", value: booking.services.map((service) => service.title).join(", ") },
          ],
          amount: formatPKR(booking.totalSale),
        });
        return;
      }
      const p = payments.find((x) => x.id === id);
      if (!p) return;
      generateVoucherPDF({
        kind: "payment",
        bookingId: p.id,
        customerName: p.partyName,
        lines: [
          { label: "Type", value: p.type },
          { label: "Currency", value: p.currency },
          { label: "Due Date", value: formatDate(p.dueDate) },
          { label: "Status", value: p.status },
          { label: "Note", value: p.note || "—" },
        ],
        amount: formatPKR(p.amountPKR),
      });
    }
  };

  const options =
    kind === "hotel"
      ? hotels.map((h) => ({ id: h.id, label: `${h.bookingId} — ${h.hotelName}` }))
      : kind === "transport"
        ? transports.map((t) => ({ id: t.id, label: `${t.bookingId} — ${t.type}` }))
        : kind === "umrah"
          ? umrahPackages.map((u) => ({ id: u.id, label: `${u.bookingId} — ${u.packageName}` }))
          : kind === "visa"
            ? visas.map((v) => ({ id: v.id, label: `${v.bookingId} — ${v.visaType}` }))
            : kind === "air_ticket"
              ? airTickets.map((t) => ({ id: t.id, label: `${t.bookingId} — ${t.passengerName}` }))
              : kind === "booking"
                ? travelBookings.map((b) => ({ id: b.id, label: `${b.bookingId} — ${b.title || "Travel Booking"}` }))
                : payments.map((p) => ({ id: p.id, label: `${p.partyName} — ${formatPKR(p.amountPKR)}` }));

  return (
    <div>
      <PageHeader title="Vouchers" breadcrumb="Home / Vouchers" />
      <Card title="Generate PDF Voucher">
        <div className="mb-4 max-w-sm">
          <Select
            label="Voucher Type"
            value={kind}
            onChange={(e) => setKind(e.target.value as VoucherKind)}
          >
            <option value="hotel">Hotel Voucher</option>
            <option value="transport">Transport Voucher</option>
            <option value="umrah">Umrah Package Voucher</option>
            <option value="visa">Visa Receipt</option>
            <option value="payment">Payment Receipt</option>
            <option value="air_ticket">Air Ticket Invoice</option>
            <option value="booking">Travel Booking Invoice</option>
          </Select>
        </div>

        {options.length === 0 ? (
          <EmptyState message="No records available for this voucher type." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="pb-2 font-medium">Record</th>
                  <th className="pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {options.map((o) => (
                  <tr key={o.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 text-slate-800">{o.label}</td>
                    <td className="py-2.5">
                      <Button variant="secondary" className="!px-2 !py-1" onClick={() => generate(o.id)}>
                        <FileDown size={14} /> Download PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
