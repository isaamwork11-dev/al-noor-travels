import type {
  AirTicket,
  Customer,
  HotelBooking,
  Payment,
  Supplier,
  TourPackage,
  TransportBooking,
  TravelBooking,
  UmrahPackage,
  VisaRecord,
} from "./types";

/**
 * Central accounting helpers. Party balances are always DERIVED from the
 * booking records and payment records — there is no stored balance to keep
 * in sync. A booking sale increases a customer's receivable; a payment
 * received reduces it. A service cost increases a supplier's payable; a
 * payment made reduces it.
 */

export interface LedgerSource {
  customers: Customer[];
  suppliers: Supplier[];
  airTickets: AirTicket[];
  visas: VisaRecord[];
  hotels: HotelBooking[];
  transports: TransportBooking[];
  umrahPackages: UmrahPackage[];
  tourPackages: TourPackage[];
  travelBookings: TravelBooking[];
  payments: Payment[];
}

export interface PartyEntry {
  /** Entry (posting) date — created date of the booking / payment. */
  date: string;
  /** Booking number or payment id. */
  ref: string;
  description: string;
  /** Amount that raises the customer's receivable (sales). */
  debit: number;
  /** Amount that raises the supplier's payable (costs) / lowers receivable (payments in). */
  credit: number;
}

export interface LedgerRow extends PartyEntry {
  balance: number;
}

export interface PartyLedger {
  partyType: "Customer" | "Supplier";
  partyId: string;
  partyName: string;
  opening: number;
  rows: LedgerRow[];
  totalDebit: number;
  totalCredit: number;
  closing: number;
}

/** Booking statuses that actually generate a charge in the accounts. */
const ACTIVE_STATUSES = ["Confirmed", "Pending", "Completed"];

function isActive(status: string | undefined): boolean {
  return !!status && ACTIVE_STATUSES.includes(status);
}

/** A payment actually moved money when its status is Paid or Partial. */
function receivedStatus(p: Payment): boolean {
  return p.status === "Paid" || p.status === "Partial";
}

const inRange = (date: string, from?: string, to?: string) => {
  if (!date) return false;
  if (from && date < from) return false;
  if (to && date > to + "T23:59:59.999") return false;
  return true;
};

export function buildPartyLedger(
  partyType: "Customer" | "Supplier",
  partyId: string,
  data: LedgerSource,
  from?: string,
  to?: string
): PartyLedger {
  const party =
    partyType === "Customer"
      ? data.customers.find((c) => c.id === partyId)
      : data.suppliers.find((s) => s.id === partyId);

  const entries: PartyEntry[] = [];

  if (partyType === "Customer") {
    for (const t of data.airTickets) {
      if (t.customerId !== partyId || !isActive(t.status)) continue;
      entries.push({
        date: t.createdAt,
        ref: t.bookingId,
        description: `Air Ticket — ${t.sector}${t.tripType === "Return" ? " (Return)" : ""}`,
        debit: t.salePrice,
        credit: 0,
      });
    }
    for (const v of data.visas) {
      if (v.customerId !== partyId || !isActive(v.status)) continue;
      entries.push({
        date: v.createdAt,
        ref: v.bookingId,
        description: `Visa — ${v.visaType}`,
        debit: v.salePrice,
        credit: 0,
      });
    }
    for (const h of data.hotels) {
      if (h.customerId !== partyId || !isActive(h.status)) continue;
      entries.push({
        date: h.createdAt,
        ref: h.bookingId,
        description: `Hotel — ${h.hotelName}`,
        debit: h.salePrice,
        credit: 0,
      });
    }
    for (const t of data.transports) {
      if (t.customerId !== partyId || !isActive(t.status)) continue;
      entries.push({
        date: t.createdAt,
        ref: t.bookingId,
        description: `Transport — ${t.type}`,
        debit: t.salePrice,
        credit: 0,
      });
    }
    for (const u of data.umrahPackages) {
      if (u.customerId !== partyId || !isActive(u.status)) continue;
      entries.push({
        date: u.createdAt,
        ref: u.bookingId,
        description: `Umrah — ${u.packageName}`,
        debit: u.salePrice,
        credit: 0,
      });
    }
    for (const t of data.tourPackages) {
      if (t.customerId !== partyId || !isActive(t.status)) continue;
      entries.push({
        date: t.createdAt,
        ref: t.bookingId,
        description: `Tour — ${t.packageName}`,
        debit: t.salePrice,
        credit: 0,
      });
    }
    for (const b of data.travelBookings) {
      if (b.customerId !== partyId || !isActive(b.status)) continue;
      entries.push({
        date: b.createdAt,
        ref: b.bookingId,
        description: b.title || "Travel Booking",
        debit: b.totalSale,
        credit: 0,
      });
    }
    for (const p of data.payments) {
      if (p.type !== "Customer" || p.partyId !== partyId || !receivedStatus(p)) continue;
      entries.push({
        date: p.paidDate || p.createdAt,
        ref: p.id,
        description: p.note || "Payment received",
        debit: 0,
        credit: p.amountPKR,
      });
    }
  } else {
    for (const t of data.airTickets) {
      if (t.supplierId !== partyId || !isActive(t.status)) continue;
      entries.push({
        date: t.createdAt,
        ref: t.bookingId,
        description: `Ticket cost — ${t.sector}`,
        debit: 0,
        credit: t.costPrice,
      });
    }
    for (const h of data.hotels) {
      if (h.supplierId !== partyId || !isActive(h.status)) continue;
      entries.push({
        date: h.createdAt,
        ref: h.bookingId,
        description: `Hotel cost — ${h.hotelName}`,
        debit: 0,
        credit: h.costPrice,
      });
    }
    for (const b of data.travelBookings) {
      if (!isActive(b.status)) continue;
      for (const svc of b.services) {
        if (!svc.supplierId || svc.supplierId !== partyId) continue;
        entries.push({
          date: b.createdAt,
          ref: b.bookingId,
          description: `${svc.kind.toUpperCase()} cost — ${svc.title || svc.kind}`,
          debit: 0,
          credit: svc.costPKR,
        });
      }
    }
    for (const p of data.payments) {
      if (p.type !== "Supplier" || p.partyId !== partyId || !receivedStatus(p)) continue;
      entries.push({
        date: p.paidDate || p.createdAt,
        ref: p.id,
        description: p.note || "Payment made",
        debit: p.amountPKR,
        credit: 0,
      });
    }
  }

  const filtered = entries
    .filter((e) => inRange(e.date, from, to))
    .sort((a, b) => a.date.localeCompare(b.date));

  const openingRaw = party?.outstanding ?? 0;
  const opening = inRange(party?.createdAt ?? "", from, to) ? 0 : openingRaw;

  let balance = opening;
  const rows: LedgerRow[] = filtered.map((e) => {
    balance = partyType === "Customer" ? balance + e.debit - e.credit : balance + e.credit - e.debit;
    return { ...e, balance };
  });

  const totalDebit = rows.reduce((a, r) => a + r.debit, 0);
  const totalCredit = rows.reduce((a, r) => a + r.credit, 0);
  return {
    partyType,
    partyId,
    partyName: party?.name || "—",
    opening,
    rows,
    totalDebit,
    totalCredit,
    closing: rows.length ? rows[rows.length - 1].balance : opening,
  };
}

/** Outstanding balance of one customer or supplier (opening + activity). */
export function partyBalance(
  partyType: "Customer" | "Supplier",
  partyId: string,
  data: LedgerSource
): number {
  return buildPartyLedger(partyType, partyId, data).closing;
}

/** Sum of customer receivables across all customers. */
export function totalReceivables(data: LedgerSource): number {
  return data.customers.reduce((a, c) => a + partyBalance("Customer", c.id, data), 0);
}

/** Sum of supplier payables across all suppliers. */
export function totalPayables(data: LedgerSource): number {
  return data.suppliers.reduce((a, s) => a + partyBalance("Supplier", s.id, data), 0);
}

export interface BookingMoney {
  bookingId: string;
  total: number;
  received: number;
  balance: number;
}

/** Sale amount, payments received and remaining balance for one booking ref. */
export function bookingMoney(bookingId: string, data: LedgerSource): BookingMoney {
  const debts = [
    ...data.airTickets,
    ...data.visas,
    ...data.hotels,
    ...data.transports,
    ...data.umrahPackages,
    ...data.tourPackages,
    ...data.travelBookings,
  ].filter((r) => r.bookingId === bookingId && isActive(r.status));

  const total = debts.reduce((a: number, r: AirTicket | VisaRecord | HotelBooking | TransportBooking | UmrahPackage | TourPackage | TravelBooking) => {
    if ("totalSale" in r) return a + r.totalSale;
    return a + r.salePrice;
  }, 0);

  const received = data.payments
    .filter((p) => p.type === "Customer" && p.bookingId === bookingId && receivedStatus(p))
    .reduce((a, p) => a + p.amountPKR, 0);

  return {
    bookingId,
    total,
    received,
    balance: Math.max(0, total - received),
  };
}

export interface MonthSummary {
  sales: number;
  costs: number;
  received: number;
  paid: number;
  receivables: number;
  payables: number;
}

/** Financial snapshot for a date range — used for the month's review. */
export function monthlySummary(from: string, to: string, data: LedgerSource): MonthSummary {
  const inRange = (date?: string) => !!date && date >= from && date <= to + "T23:59:59.999";

  const sumSales = (
    items: { createdAt: string; status?: string; salePrice?: number; totalSale?: number }[]
  ) =>
    items.reduce((a, r) => {
      if (!isActive(r.status) || !inRange(r.createdAt)) return a;
      return a + (r.totalSale ?? r.salePrice ?? 0);
    }, 0);

  const sales =
    sumSales(data.airTickets) +
    sumSales(data.visas) +
    sumSales(data.hotels) +
    sumSales(data.transports) +
    sumSales(data.umrahPackages) +
    sumSales(data.tourPackages) +
    sumSales(data.travelBookings);

  const costs = (
    [...data.airTickets, ...data.hotels, ...data.transports] as { createdAt: string; status?: string; costPrice?: number }[]
  )
    .reduce((a, r) => {
      if (!isActive(r.status) || !inRange(r.createdAt)) return a;
      return a + (r.costPrice ?? 0);
    }, 0);

  const received = data.payments
    .filter((p) => p.type === "Customer" && receivedStatus(p))
    .reduce((a, p) => a + (inRange(p.paidDate || p.createdAt) ? p.amountPKR : 0), 0);

  const paid = data.payments
    .filter((p) => p.type === "Supplier" && receivedStatus(p))
    .reduce((a, p) => a + (inRange(p.paidDate || p.createdAt) ? p.amountPKR : 0), 0);

  return {
    sales,
    costs,
    received,
    paid,
    receivables: totalReceivables(data),
    payables: totalPayables(data),
  };
}