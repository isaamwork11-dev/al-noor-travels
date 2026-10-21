import { calcProfit, nextId, sarToPkr } from "./format";
import type {
  BookingServiceItem,
  BookingServiceKind,
  BookingTicketLine,
  TravelBooking,
} from "./types";

const SERVICE_KINDS: BookingServiceKind[] = ["ticket", "visa", "hotel", "transport"];

export function asServiceKind(value: unknown, details?: BookingServiceItem["details"]): BookingServiceKind {
  const k = String(value || "").toLowerCase();
  if (SERVICE_KINDS.includes(k as BookingServiceKind)) return k as BookingServiceKind;
  if (details?.hotelName || details?.checkIn || details?.checkOut) return "hotel";
  if (details?.transportType || details?.pickup || details?.dropoff) return "transport";
  if (details?.visaType || details?.passportNo) return "visa";
  return "ticket";
}

/** Recalculate costPKR / profit for one ticket line from SAR + rate. */
export function normalizeTicketLine(
  ticket: Partial<BookingTicketLine> & { passengerName?: string }
): BookingTicketLine {
  const costSAR = Number(ticket.costSAR) || 0;
  const exchangeRate = Number(ticket.exchangeRate) || 0;
  const costPKR = Number(ticket.costPKR) > 0 ? Number(ticket.costPKR) : sarToPkr(costSAR, exchangeRate);
  const salePrice = Number(ticket.salePrice) || 0;
  return {
    id: ticket.id || nextId("tk"),
    passengerName: ticket.passengerName || "",
    passenger: ticket.passenger,
    airline: ticket.airline || "",
    pnr: ticket.pnr || "",
    ticketNumber: ticket.ticketNumber || "",
    sector: ticket.sector || "",
    travelDate: ticket.travelDate || "",
    returnDate: ticket.returnDate || "",
    tripType: ticket.tripType || "Oneway",
    supplierId: ticket.supplierId || "",
    costSAR,
    exchangeRate,
    costPKR,
    salePrice,
    profit: calcProfit(costPKR, salePrice),
  };
}

/** Air ticket sales are entered directly in PKR; no exchange rate is involved. */
export function normalizeAirTicketPrice(perTicketPrice: number, pax: number) {
  const safePax = Math.max(1, Number(pax) || 1);
  const safePrice = Math.max(0, Number(perTicketPrice) || 0);
  return { pax: safePax, perTicketPrice: safePrice, totalAmount: safePrice * safePax };
}

/** Recalculate a service line; ticket kind rolls up from passengers. */
export function normalizeServiceItem(
  service: Partial<BookingServiceItem> & { kind?: BookingServiceItem["kind"] }
): BookingServiceItem {
  const raw = service && typeof service === "object" ? service : {};
  const details =
    raw.details && typeof raw.details === "object" && !Array.isArray(raw.details)
      ? { ...(raw.details as BookingServiceItem["details"]) }
      : {};
  const kind = asServiceKind(raw.kind, details);

  if (kind === "ticket") {
    const tickets = (raw.tickets ?? []).map((t) => normalizeTicketLine(t));
    const costPKR = tickets.reduce((a, t) => a + t.costPKR, 0);
    const salePrice = tickets.reduce((a, t) => a + t.salePrice, 0);
    const costSAR = tickets.reduce((a, t) => a + t.costSAR, 0);
    const exchangeRate =
      tickets.length === 1
        ? tickets[0].exchangeRate
        : tickets[0]?.exchangeRate || Number(service.exchangeRate) || 0;
    return {
      id: raw.id || nextId("svc"),
      kind: "ticket",
      supplierId: raw.supplierId || "",
      title: raw.title || (tickets.length ? `${tickets.length} ticket(s)` : "Tickets"),
      details,
      costSAR,
      exchangeRate,
      costPKR,
      salePrice,
      profit: calcProfit(costPKR, salePrice),
      tickets,
    };
  }

  const costSAR = Number(raw.costSAR) || 0;
  const exchangeRate = Number(raw.exchangeRate) || 0;
  const costPKR = sarToPkr(costSAR, exchangeRate);
  const salePrice = Number(raw.salePrice) || 0;
  return {
    id: raw.id || nextId("svc"),
    kind,
    supplierId: raw.supplierId || "",
    title: raw.title || kind,
    details,
    costSAR,
    exchangeRate,
    costPKR,
    salePrice,
    profit: calcProfit(costPKR, salePrice),
  };
}

/** Roll up booking totals from normalized services. */
export function computeBookingTotals(services: BookingServiceItem[]): {
  totalCostPKR: number;
  totalSale: number;
  totalProfit: number;
} {
  const totalCostPKR = services.reduce((a, s) => a + (Number(s?.costPKR) || 0), 0);
  const totalSale = services.reduce((a, s) => a + (Number(s?.salePrice) || 0), 0);
  return {
    totalCostPKR,
    totalSale,
    totalProfit: calcProfit(totalCostPKR, totalSale),
  };
}

export function normalizeTravelBooking(
  booking: Partial<TravelBooking> & { customerId: string }
): Pick<
  TravelBooking,
  "services" | "totalCostPKR" | "totalSale" | "totalProfit"
> {
  const services = (booking.services ?? [])
    .filter((s): s is BookingServiceItem => !!s && typeof s === "object")
    .map((s) => normalizeServiceItem(s));
  return { services, ...computeBookingTotals(services) };
}
