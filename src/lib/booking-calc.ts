import { calcProfit, nextId, sarToPkr } from "./format";
import type {
  BookingServiceItem,
  BookingTicketLine,
  TravelBooking,
} from "./types";

/** Recalculate costPKR / profit for one ticket line from SAR + rate. */
export function normalizeTicketLine(
  ticket: Partial<BookingTicketLine> & { passengerName?: string }
): BookingTicketLine {
  const costSAR = Number(ticket.costSAR) || 0;
  const exchangeRate = Number(ticket.exchangeRate) || 0;
  const costPKR = sarToPkr(costSAR, exchangeRate);
  const salePrice = Number(ticket.salePrice) || 0;
  return {
    id: ticket.id || nextId("tk"),
    passengerName: ticket.passengerName || "",
    airline: ticket.airline || "",
    pnr: ticket.pnr || "",
    ticketNumber: ticket.ticketNumber || "",
    sector: ticket.sector || "",
    travelDate: ticket.travelDate || "",
    supplierId: ticket.supplierId || "",
    costSAR,
    exchangeRate,
    costPKR,
    salePrice,
    profit: calcProfit(costPKR, salePrice),
  };
}

/** Recalculate a service line; ticket kind rolls up from passengers. */
export function normalizeServiceItem(
  service: Partial<BookingServiceItem> & { kind: BookingServiceItem["kind"] }
): BookingServiceItem {
  if (service.kind === "ticket") {
    const tickets = (service.tickets ?? []).map((t) => normalizeTicketLine(t));
    const costPKR = tickets.reduce((a, t) => a + t.costPKR, 0);
    const salePrice = tickets.reduce((a, t) => a + t.salePrice, 0);
    const costSAR = tickets.reduce((a, t) => a + t.costSAR, 0);
    const exchangeRate =
      tickets.length === 1
        ? tickets[0].exchangeRate
        : tickets[0]?.exchangeRate || Number(service.exchangeRate) || 0;
    return {
      id: service.id || nextId("svc"),
      kind: "ticket",
      supplierId: service.supplierId || "",
      title: service.title || (tickets.length ? `${tickets.length} ticket(s)` : "Tickets"),
      details: service.details || {},
      costSAR,
      exchangeRate,
      costPKR,
      salePrice,
      profit: calcProfit(costPKR, salePrice),
      tickets,
    };
  }

  const costSAR = Number(service.costSAR) || 0;
  const exchangeRate = Number(service.exchangeRate) || 0;
  const costPKR = sarToPkr(costSAR, exchangeRate);
  const salePrice = Number(service.salePrice) || 0;
  return {
    id: service.id || nextId("svc"),
    kind: service.kind,
    supplierId: service.supplierId || "",
    title: service.title || service.kind,
    details: service.details || {},
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
  const totalCostPKR = services.reduce((a, s) => a + s.costPKR, 0);
  const totalSale = services.reduce((a, s) => a + s.salePrice, 0);
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
  const services = (booking.services ?? []).map((s) =>
    normalizeServiceItem(s as BookingServiceItem)
  );
  return { services, ...computeBookingTotals(services) };
}
