/**
 * Shared voucher payload + open-in-new-tab flow.
 * Vouchers open as an HTML page first; Print / PDF are optional on that page.
 */

import { formatDate, formatPKR, hotelNights } from "./format";
import type { AirTicket, HotelBooking, TravelBooking } from "./types";

export type VoucherKind =
  | "hotel"
  | "transport"
  | "visa"
  | "payment"
  | "air_ticket"
  | "booking";

export interface VoucherLineItem {
  details: string;
  amount?: string;
}

export interface VoucherPayload {
  kind: VoucherKind;
  bookingId: string;
  customerName: string;
  lines: { label: string; value: string }[];
  /** Invoice rows shown under a Details heading (service-level breakdown). */
  items?: VoucherLineItem[];
  amount?: string;
  note?: string;
}

export const VOUCHER_TITLES: Record<VoucherKind, string> = {
  hotel: "Hotel Voucher",
  transport: "Transport Voucher",
  visa: "Visa Receipt",
  payment: "Payment Receipt",
  air_ticket: "Air Ticket Invoice",
  booking: "Travel Booking Invoice",
};

const STORAGE_PREFIX = "ssb-voucher:";

/** Store payload and open the printable voucher page in a new tab. */
export function openVoucher(payload: VoucherPayload) {
  const key = `${STORAGE_PREFIX}${crypto.randomUUID()}`;
  localStorage.setItem(key, JSON.stringify(payload));
  window.open(`/voucher/view?k=${encodeURIComponent(key)}`, "_blank", "noopener,noreferrer");
}

export function readVoucherPayload(storageKey: string): VoucherPayload | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw) as VoucherPayload;
  } catch {
    return null;
  }
}

export function invoiceItemsFromTicket(ticket: AirTicket): VoucherLineItem[] {
  const names = (
    ticket.passengerNames?.filter(Boolean) ||
    ticket.passengers?.map((p) => p.fullName).filter(Boolean) ||
    (ticket.passengerName ? [ticket.passengerName] : [])
  ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  const per = ticket.perTicketPrice || (names.length ? ticket.salePrice / names.length : ticket.salePrice);
  const sector = ticket.sector || "—";
  const trip =
    ticket.tripType === "Return"
      ? `Return ${formatDate(ticket.travelDate)}${ticket.returnDate ? ` / ${formatDate(ticket.returnDate)}` : ""}`
      : formatDate(ticket.travelDate);

  if (names.length === 0) {
    return [
      {
        details: `Air Ticket · ${sector} · ${ticket.airline || ""} · ${trip}`.replace(/ · $/, ""),
        amount: formatPKR(ticket.totalAmount || ticket.salePrice),
      },
    ];
  }

  return names.map((name) => ({
    details: `Air Ticket · ${name} · ${sector} · ${ticket.airline || "—"}${ticket.pnr ? ` · PNR ${ticket.pnr}` : ""} · ${trip}`,
    amount: formatPKR(per),
  }));
}

export function invoiceItemsFromHotel(h: HotelBooking): VoucherLineItem[] {
  const nights = hotelNights(h.checkIn, h.checkOut);
  return [
    {
      details: `Hotel · ${h.hotelName}${h.city ? ` · ${h.city}` : ""}${h.roomType ? ` · ${h.roomType}` : ""} · Check-in ${formatDate(h.checkIn)} · Check-out ${formatDate(h.checkOut)}${nights ? ` · ${nights} night${nights === 1 ? "" : "s"}` : ""}`,
      amount: formatPKR(h.salePrice),
    },
  ];
}

export function invoiceItemsFromBooking(booking: TravelBooking): VoucherLineItem[] {
  const items: VoucherLineItem[] = [];
  for (const service of booking.services ?? []) {
    if (service.kind === "ticket" && (service.tickets?.length ?? 0) > 0) {
      for (const ticket of service.tickets ?? []) {
        const trip =
          ticket.tripType === "Return"
            ? `Return ${formatDate(ticket.travelDate)}${ticket.returnDate ? ` / ${formatDate(ticket.returnDate)}` : ""}`
            : formatDate(ticket.travelDate);
        items.push({
          details: `Air Ticket · ${ticket.passengerName || "Passenger"} · ${ticket.sector || "—"} · ${ticket.airline || "—"}${ticket.pnr ? ` · PNR ${ticket.pnr}` : ""} · ${trip}`,
          amount: formatPKR(ticket.salePrice),
        });
      }
      continue;
    }
    if (service.kind === "hotel") {
      const name = service.details?.hotelName || service.title || "Hotel";
      const city = service.details?.city ? ` · ${service.details.city}` : "";
      const room = service.details?.roomType ? ` · ${service.details.roomType}` : "";
      const cin = service.details?.checkIn ? formatDate(service.details.checkIn) : "—";
      const cout = service.details?.checkOut ? formatDate(service.details.checkOut) : "—";
      items.push({
        details: `Hotel · ${name}${city}${room} · Check-in ${cin} · Check-out ${cout}`,
        amount: formatPKR(service.salePrice),
      });
      continue;
    }
    if (service.kind === "visa") {
      const visaType = service.details?.visaType || service.title || "Visa";
      const country = service.details?.country ? ` · ${service.details.country}` : "";
      const passport = service.details?.passportNo ? ` · Passport ${service.details.passportNo}` : "";
      items.push({
        details: `Visa · ${visaType}${country}${passport}`,
        amount: formatPKR(service.salePrice),
      });
      continue;
    }
    if (service.kind === "transport") {
      const type = service.details?.transportType || service.title || "Transport";
      const route =
        service.details?.pickup || service.details?.dropoff
          ? ` · ${service.details?.pickup || "—"} → ${service.details?.dropoff || "—"}`
          : "";
      const date = service.details?.date ? ` · ${formatDate(service.details.date)}` : "";
      items.push({
        details: `Transport · ${type}${route}${date}`,
        amount: formatPKR(service.salePrice),
      });
      continue;
    }
    items.push({
      details: `${(service.kind || "Service").toUpperCase()} · ${service.title || "—"}`,
      amount: formatPKR(service.salePrice),
    });
  }
  return items;
}
