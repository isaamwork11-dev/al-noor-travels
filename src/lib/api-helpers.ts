import { NextResponse } from "next/server";
import type { Model } from "mongoose";
import { MissingMongoUriError } from "./db";
import { calcProfit, nextBookingId, nextId, sarToPkr, toPKR } from "./format";
import { normalizeTravelBooking } from "./booking-calc";
import type {
  BookingServiceItem,
  Currency,
  ExchangeRates,
  TravelBooking as TravelBookingType,
  UserPermissions,
} from "./types";
import type { Session } from "./auth-server";
import type { AppSettingsDoc } from "@/models";
import {
  ActivityLog,
  AirTicket,
  AppSettings,
  CashEntry,
  Customer,
  Hotel,
  Insurance,
  Payment,
  Refund,
  SETTINGS_ID,
  Supplier,
  TourPackage,
  Transport,
  TravelBooking,
  UmrahPackage,
  User,
  Visa,
} from "@/models";

export type DbRecord = Record<string, unknown>;
type CollectionModel = Model<DbRecord>;

// Approx rates as of Sep 2026 (1 unit → PKR)
export const DEFAULT_RATES: ExchangeRates = {
  PKR: 1,
  SAR: 73.9,    // Saudi Riyal
  AED: 76.1,    // UAE Dirham
  USD: 278.5,   // US Dollar
  EUR: 308.0,   // Euro
  GBP: 363.0,   // British Pound
  OMR: 723.0,   // Omani Rial
  BHD: 739.0,   // Bahraini Dinar
  KWD: 906.0,   // Kuwaiti Dinar
  TRY: 8.2,     // Turkish Lira
  CNY: 38.5,    // Chinese Yuan
};

export interface CollectionConfig {
  model: CollectionModel;
  /** Label used in the activity log. */
  module: string;
  /** Prefix for generated ids, matching the client store conventions. */
  idPrefix: string;
  /** Service records get an auto booking id and a derived profit. */
  service: boolean;
  sortField: string;
  /** Extra permission required on top of create/edit/delete. */
  permission?: keyof UserPermissions;
}

/** URL segments accepted by `/api/data/[collection]`, minus the `settings` singleton. */
export type CollectionKey =
  | "customers"
  | "suppliers"
  | "airTickets"
  | "visas"
  | "hotels"
  | "transports"
  | "umrahPackages"
  | "tourPackages"
  | "insurance"
  | "travelBookings"
  | "payments"
  | "cashBook"
  | "refunds"
  | "users"
  | "activityLogs";

/** URL segment → collection. Keys mirror the field names in `AppState`. */
export const COLLECTIONS: Record<CollectionKey, CollectionConfig> = {
  customers: {
    model: Customer as unknown as CollectionModel,
    module: "Customers",
    idPrefix: "c",
    service: false,
    sortField: "createdAt",
  },
  suppliers: {
    model: Supplier as unknown as CollectionModel,
    module: "Suppliers",
    idPrefix: "s",
    service: false,
    sortField: "createdAt",
  },
  airTickets: {
    model: AirTicket as unknown as CollectionModel,
    module: "Air Tickets",
    idPrefix: "t",
    service: true,
    sortField: "createdAt",
  },
  visas: {
    model: Visa as unknown as CollectionModel,
    module: "Visa",
    idPrefix: "v",
    service: true,
    sortField: "createdAt",
  },
  hotels: {
    model: Hotel as unknown as CollectionModel,
    module: "Hotel",
    idPrefix: "h",
    service: true,
    sortField: "createdAt",
  },
  transports: {
    model: Transport as unknown as CollectionModel,
    module: "Transport",
    idPrefix: "tr",
    service: true,
    sortField: "createdAt",
  },
  umrahPackages: {
    model: UmrahPackage as unknown as CollectionModel,
    module: "Umrah",
    idPrefix: "um",
    service: true,
    sortField: "createdAt",
  },
  tourPackages: {
    model: TourPackage as unknown as CollectionModel,
    module: "Tours",
    idPrefix: "tp",
    service: true,
    sortField: "createdAt",
  },
  insurance: {
    model: Insurance as unknown as CollectionModel,
    module: "Insurance",
    idPrefix: "in",
    service: true,
    sortField: "createdAt",
  },
  travelBookings: {
    model: TravelBooking as unknown as CollectionModel,
    module: "Bookings",
    idPrefix: "tb",
    service: true,
    sortField: "createdAt",
  },
  payments: {
    model: Payment as unknown as CollectionModel,
    module: "Payments",
    idPrefix: "p",
    service: false,
    sortField: "createdAt",
    permission: "viewAccounts",
  },
  cashBook: {
    model: CashEntry as unknown as CollectionModel,
    module: "Cash Book",
    idPrefix: "cb",
    service: false,
    sortField: "date",
    permission: "viewAccounts",
  },
  refunds: {
    model: Refund as unknown as CollectionModel,
    module: "Refunds",
    idPrefix: "r",
    service: false,
    sortField: "createdAt",
  },
  users: {
    model: User as unknown as CollectionModel,
    module: "Users",
    idPrefix: "u",
    service: false,
    sortField: "createdAt",
    permission: "manageUsers",
  },
  activityLogs: {
    model: ActivityLog as unknown as CollectionModel,
    module: "Activity Log",
    idPrefix: "log",
    service: false,
    sortField: "createdAt",
    permission: "viewActivityLog",
  },
};

export function isCollectionKey(value: string): value is CollectionKey {
  return Object.prototype.hasOwnProperty.call(COLLECTIONS, value);
}

/** Collections whose records take part in the shared BK-XXXXXX booking sequence. */
export const SERVICE_COLLECTIONS = (Object.keys(COLLECTIONS) as CollectionKey[]).filter(
  (key) => COLLECTIONS[key].service
);

export function json<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Turns a thrown error into a response — a missing DB config becomes a 503. */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof MissingMongoUriError) {
    return jsonError(error.message, 503);
  }
  const message = error instanceof Error ? error.message : "Unexpected server error";
  console.error("[api]", error);
  return jsonError(message, 500);
}

/** Drops Mongo internals and password hashes before sending a record out. */
export function sanitize(record: DbRecord | null): DbRecord | null {
  if (!record) return null;
  const { _id: _mongoId, __v: _version, password: _password, ...rest } = record;
  void _mongoId;
  void _version;
  void _password;
  return rest;
}

export function sanitizeAll(records: DbRecord[]): DbRecord[] {
  return records.map((record) => sanitize(record) as DbRecord);
}

export async function getSettings(): Promise<AppSettingsDoc> {
  const existing = await AppSettings.findOne({ id: SETTINGS_ID }).lean<AppSettingsDoc | null>();
  if (existing) {
    // Auto-correct stale rates that were stored with old wrong defaults
    const rates = existing.exchangeRates as ExchangeRates | undefined;
    const stale =
      !rates ||
      rates.SAR === 74.5 ||   // old wrong SAR default
      rates.AED === 76.2 ||   // old wrong AED default
      rates.SAR === 0 ||
      rates.AED === 0 ||
      !rates.EUR ||           // missing new currencies
      !rates.GBP ||
      !rates.OMR;
    if (stale) {
      await AppSettings.updateOne(
        { id: SETTINGS_ID },
        { $set: { exchangeRates: DEFAULT_RATES } }
      );
      return { ...existing, exchangeRates: DEFAULT_RATES } as AppSettingsDoc;
    }
    return existing;
  }
  const created = await AppSettings.create({
    id: SETTINGS_ID,
    exchangeRates: DEFAULT_RATES,
  });
  return created.toObject() as AppSettingsDoc;
}

export async function getExchangeRates(): Promise<ExchangeRates> {
  const settings = await getSettings();
  return { ...DEFAULT_RATES, ...(settings.exchangeRates ?? {}) };
}

/** Next id in the shared BK-XXXXXX sequence across every service collection. */
export async function nextBookingIdFromDb(): Promise<string> {
  const existing: string[] = [];
  for (const key of SERVICE_COLLECTIONS) {
    const docs = await COLLECTIONS[key].model
      .find({}, { bookingId: 1, _id: 0 })
      .lean<{ bookingId?: string }[]>();
    for (const doc of docs) {
      if (doc.bookingId) existing.push(doc.bookingId);
    }
  }
  return nextBookingId(existing);
}

export async function logActivity(
  session: Session,
  action: string,
  module: string,
  details: string
): Promise<void> {
  try {
    await ActivityLog.create({
      id: nextId("log"),
      userId: session.userId,
      userName: session.name,
      action,
      module,
      details,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    // A failed audit write must never fail the mutation it describes.
    console.error("[activity-log]", error);
  }
}

const NUMERIC_FIELDS = [
  "costPrice",
  "salePrice",
  "amount",
  "amountPKR",
  "outstanding",
  "originalAmount",
  "airlineCharges",
  "serviceCharges",
  "refundAmount",
  "costSAR",
  "exchangeRate",
  "costPKR",
  "totalCostPKR",
  "totalSale",
  "totalProfit",
  "pax",
  "perTicketPrice",
  "totalAmount",
];

/**
 * Normalises an incoming payload: coerces numbers, recomputes `profit` from
 * cost/sale and fills `amountPKR` for money records.
 */
export async function applyDerivedFields(
  collection: CollectionKey,
  payload: DbRecord,
  previous?: DbRecord
): Promise<DbRecord> {
  const next: DbRecord = { ...payload };

  for (const field of NUMERIC_FIELDS) {
    if (next[field] !== undefined && next[field] !== null && next[field] !== "") {
      const value = Number(next[field]);
      next[field] = Number.isFinite(value) ? value : 0;
    }
  }

  const lockNestedRates = () => {
    if (!previous || !Array.isArray(next.services)) return;
    const oldServices = (previous.services ?? []) as BookingServiceItem[];
    const oldById = new Map(oldServices.map((service) => [service.id, service]));
    next.services = (next.services as BookingServiceItem[]).map((service) => {
      const oldService = oldById.get(service.id);
      const lockedService = oldService?.exchangeRate
        ? { ...service, exchangeRate: oldService.exchangeRate }
        : service;
      if (service.kind !== "ticket") return lockedService;
      const oldTickets = new Map((oldService?.tickets ?? []).map((ticket) => [ticket.id, ticket]));
      return {
        ...lockedService,
        tickets: (service.tickets ?? []).map((ticket) => {
          const oldTicket = oldTickets.get(ticket.id);
          return oldTicket?.exchangeRate
            ? { ...ticket, exchangeRate: oldTicket.exchangeRate }
            : ticket;
        }),
      };
    });
  };

  if (collection === "travelBookings") {
    lockNestedRates();
    const normalized = normalizeTravelBooking({
      customerId: String(next.customerId ?? previous?.customerId ?? ""),
      services: (next.services ?? previous?.services ?? []) as TravelBookingType["services"],
    });
    next.services = normalized.services;
    next.totalCostPKR = normalized.totalCostPKR;
    next.totalSale = normalized.totalSale;
    next.totalProfit = normalized.totalProfit;
    // Mirror totals onto costPrice/salePrice/profit so reports that expect them still work.
    next.costPrice = normalized.totalCostPKR;
    next.salePrice = normalized.totalSale;
    next.profit = normalized.totalProfit;
    return next;
  }

  if (collection === "umrahPackages" && Array.isArray(next.services)) {
    lockNestedRates();
    const normalized = normalizeTravelBooking({
      customerId: String(next.customerId ?? previous?.customerId ?? ""),
      services: next.services as TravelBookingType["services"],
    });
    next.services = normalized.services;
    next.costPrice = normalized.totalCostPKR;
    next.salePrice = normalized.totalSale;
    next.profit = normalized.totalProfit;
    next.costSAR = normalized.services.reduce((sum, service) => sum + service.costSAR, 0);
    return next;
  }

  if (COLLECTIONS[collection].service) {
    // Prefer SAR + locked rate when provided; otherwise keep legacy PKR costPrice.
    const costSAR = Number(next.costSAR ?? previous?.costSAR ?? 0);
    const lockedExchangeRate = Number(previous?.exchangeRate ?? 0);
    const exchangeRate = lockedExchangeRate || Number(next.exchangeRate ?? 0);
    if (lockedExchangeRate > 0) next.exchangeRate = lockedExchangeRate;
    if (costSAR > 0 && exchangeRate > 0) {
      next.costSAR = costSAR;
      next.exchangeRate = exchangeRate;
      next.costPrice = sarToPkr(costSAR, exchangeRate);
    }
    const cost = Number(next.costPrice ?? previous?.costPrice ?? 0);
    const sale = Number(next.salePrice ?? previous?.salePrice ?? 0);
    next.profit = calcProfit(cost, sale);
  }

  if (collection === "payments" || collection === "cashBook") {
    const amount = Number(next.amount ?? previous?.amount ?? 0);
    const currency = (next.currency ?? previous?.currency ?? "PKR") as Currency;
    if (!next.amountPKR) {
      const rates = await getExchangeRates();
      next.amountPKR = toPKR(amount, currency, rates);
    }
  }

  if (collection === "airTickets") {
    const pax = Math.max(1, Number(next.pax ?? previous?.pax ?? 1));
    const perTicketPrice = Number(next.perTicketPrice ?? next.salePrice ?? previous?.perTicketPrice ?? 0);
    next.pax = pax;
    next.perTicketPrice = perTicketPrice;
    next.totalAmount = perTicketPrice * pax;
    next.salePrice = next.totalAmount;
    const passengerNames = Array.isArray(next.passengerNames)
      ? next.passengerNames.filter((name): name is string => typeof name === "string" && name.trim().length > 0)
      : [String(next.passengerName ?? "")].filter(Boolean);
    next.passengerNames = passengerNames;
    next.passengerName = String(passengerNames[0] ?? next.passengerName ?? "");
    next.profit = calcProfit(Number(next.costPrice ?? previous?.costPrice ?? 0), Number(next.totalAmount));
  }

  return next;
}

/** Fields the client must not be able to set directly. */
export function stripProtectedFields(payload: DbRecord): DbRecord {
  const { _id: _mongoId, __v: _version, ...rest } = payload;
  void _mongoId;
  void _version;
  return rest;
}
