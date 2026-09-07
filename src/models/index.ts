import mongoose, { Schema } from "mongoose";
import type { Model } from "mongoose";
import type {
  ActivityLog as ActivityLogType,
  AirTicket as AirTicketType,
  AppUser,
  CashEntry as CashEntryType,
  Customer as CustomerType,
  ExchangeRates,
  HotelBooking,
  InsuranceRecord,
  Payment as PaymentType,
  Refund as RefundType,
  Supplier as SupplierType,
  TourPackage as TourPackageType,
  TransportBooking,
  TravelBooking as TravelBookingType,
  UmrahPackage as UmrahPackageType,
  VisaRecord,
} from "@/lib/types";

/**
 * Schemas are declared as `Schema<SchemaRecord>` rather than letting mongoose
 * infer a document type from the definition: inference costs the compiler
 * ~60s per schema (and runs the whole typecheck out of memory), while an
 * explicit generic short-circuits it. The concrete record types are applied
 * at the model boundary instead, via `registerModel`.
 */
type SchemaRecord = Record<string, unknown>;

/**
 * Every collection carries the frontend-facing string `id` as its own unique
 * field (e.g. `c1`, `t-lx9y-8f2a`) so records stay interchangeable with the
 * client store. Mongo's `_id` is still there but never surfaced to the client.
 */
const baseOptions = {
  versionKey: false as const,
  minimize: false,
  toJSON: {
    transform(_doc: unknown, ret: Record<string, unknown>) {
      delete ret._id;
      return ret;
    },
  },
};

function idField() {
  return { type: String, required: true, unique: true, index: true };
}

/** Reuse the model if it was already compiled (dev server hot reloads). */
function registerModel<T>(name: string, schema: Schema<SchemaRecord>): Model<T> {
  return (
    (mongoose.models[name] as Model<T> | undefined) ??
    (mongoose.model(name, schema) as unknown as Model<T>)
  );
}

const permissionsSchema = new Schema<SchemaRecord>(
  {
    viewCost: { type: Boolean, default: false },
    viewProfit: { type: Boolean, default: false },
    viewAccounts: { type: Boolean, default: false },
    viewFinancialReports: { type: Boolean, default: false },
    manageUsers: { type: Boolean, default: false },
    createRecords: { type: Boolean, default: true },
    editRecords: { type: Boolean, default: false },
    deleteRecords: { type: Boolean, default: false },
    viewReports: { type: Boolean, default: true },
    viewActivityLog: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new Schema<SchemaRecord>(
  {
    id: idField(),
    username: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, default: "" },
    role: { type: String, enum: ["super_admin", "staff"], default: "staff" },
    permissions: { type: permissionsSchema, default: () => ({}) },
    active: { type: Boolean, default: true },
    avatar: { type: String },
    createdAt: { type: String, required: true },
  },
  baseOptions
);

const customerSchema = new Schema<SchemaRecord>(
  {
    id: idField(),
    customerId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    mobile: { type: String, default: "" },
    cnic: { type: String, default: "" },
    passportNumber: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    outstanding: { type: Number, default: 0 },
    createdAt: { type: String, required: true },
    updatedAt: { type: String },
  },
  baseOptions
);

const supplierSchema = new Schema<SchemaRecord>(
  {
    id: idField(),
    name: { type: String, required: true },
    type: { type: String, default: "" },
    mobile: { type: String, default: "" },
    email: { type: String, default: "" },
    outstanding: { type: Number, default: 0 },
    createdAt: { type: String, required: true },
    updatedAt: { type: String },
  },
  baseOptions
);

const airTicketSchema = new Schema<SchemaRecord>(
  {
    id: idField(),
    bookingId: { type: String, required: true, index: true },
    passengerName: { type: String, required: true },
    customerId: { type: String, index: true },
    airline: { type: String, default: "" },
    pnr: { type: String, default: "" },
    ticketNumber: { type: String, default: "" },
    sector: { type: String, default: "" },
    issueDate: { type: String, default: "" },
    travelDate: { type: String, default: "" },
    flightTime: { type: String, default: "" },
    supplierId: { type: String, default: "" },
    costPrice: { type: Number, default: 0 },
    salePrice: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    status: { type: String, default: "Pending" },
    currency: { type: String, default: "PKR" },
    costSAR: { type: Number, default: 0 },
    exchangeRate: { type: Number, default: 0 },
    createdBy: { type: String, default: "" },
    createdAt: { type: String, required: true },
    updatedAt: { type: String },
  },
  baseOptions
);

const visaSchema = new Schema<SchemaRecord>(
  {
    id: idField(),
    bookingId: { type: String, required: true, index: true },
    customerId: { type: String, index: true },
    passportNo: { type: String, default: "" },
    visaType: { type: String, default: "Other" },
    country: { type: String },
    submissionDate: { type: String, default: "" },
    approvalDate: { type: String },
    expiryDate: { type: String },
    costPrice: { type: Number, default: 0 },
    salePrice: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    status: { type: String, default: "Pending" },
    costSAR: { type: Number, default: 0 },
    exchangeRate: { type: Number, default: 0 },
    createdBy: { type: String, default: "" },
    createdAt: { type: String, required: true },
    updatedAt: { type: String },
  },
  baseOptions
);

const hotelSchema = new Schema<SchemaRecord>(
  {
    id: idField(),
    bookingId: { type: String, required: true, index: true },
    customerId: { type: String, index: true },
    hotelName: { type: String, default: "" },
    city: { type: String, default: "" },
    checkIn: { type: String, default: "" },
    checkOut: { type: String, default: "" },
    roomType: { type: String, default: "" },
    supplierId: { type: String, default: "" },
    costPrice: { type: Number, default: 0 },
    salePrice: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    status: { type: String, default: "Pending" },
    costSAR: { type: Number, default: 0 },
    exchangeRate: { type: Number, default: 0 },
    createdBy: { type: String, default: "" },
    createdAt: { type: String, required: true },
    updatedAt: { type: String },
  },
  baseOptions
);

const transportSchema = new Schema<SchemaRecord>(
  {
    id: idField(),
    bookingId: { type: String, required: true, index: true },
    customerId: { type: String, index: true },
    type: { type: String, default: "Airport Transfer" },
    pickup: { type: String, default: "" },
    dropoff: { type: String, default: "" },
    date: { type: String, default: "" },
    time: { type: String, default: "" },
    vehicle: { type: String, default: "" },
    driver: { type: String, default: "" },
    costPrice: { type: Number, default: 0 },
    salePrice: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    status: { type: String, default: "Pending" },
    costSAR: { type: Number, default: 0 },
    exchangeRate: { type: Number, default: 0 },
    createdBy: { type: String, default: "" },
    createdAt: { type: String, required: true },
    updatedAt: { type: String },
  },
  baseOptions
);

const umrahPackageSchema = new Schema<SchemaRecord>(
  {
    id: idField(),
    bookingId: { type: String, required: true, index: true },
    customerId: { type: String, index: true },
    packageName: { type: String, default: "" },
    includesVisa: { type: Boolean, default: false },
    includesTicket: { type: Boolean, default: false },
    includesHotel: { type: Boolean, default: false },
    includesTransport: { type: Boolean, default: false },
    travelDate: { type: String, default: "" },
    returnDate: { type: String, default: "" },
    costPrice: { type: Number, default: 0 },
    salePrice: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    status: { type: String, default: "Pending" },
    services: { type: [Schema.Types.Mixed], default: [] },
    createdBy: { type: String, default: "" },
    createdAt: { type: String, required: true },
    updatedAt: { type: String },
  },
  baseOptions
);

const tourPackageSchema = new Schema<SchemaRecord>(
  {
    id: idField(),
    bookingId: { type: String, required: true, index: true },
    customerId: { type: String, index: true },
    packageName: { type: String, default: "" },
    destination: { type: String, default: "" },
    travelDate: { type: String, default: "" },
    returnDate: { type: String, default: "" },
    costPrice: { type: Number, default: 0 },
    salePrice: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    status: { type: String, default: "Pending" },
    createdBy: { type: String, default: "" },
    createdAt: { type: String, required: true },
    updatedAt: { type: String },
  },
  baseOptions
);

const insuranceSchema = new Schema<SchemaRecord>(
  {
    id: idField(),
    bookingId: { type: String, required: true, index: true },
    customerId: { type: String, index: true },
    provider: { type: String, default: "" },
    policyNumber: { type: String, default: "" },
    coverageType: { type: String, default: "" },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    costPrice: { type: Number, default: 0 },
    salePrice: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    status: { type: String, default: "Pending" },
    currency: { type: String, default: "PKR" },
    createdBy: { type: String, default: "" },
    createdAt: { type: String, required: true },
    updatedAt: { type: String },
  },
  baseOptions
);

const bookingTicketLineSchema = new Schema<SchemaRecord>(
  {
    id: { type: String, required: true },
    passengerName: { type: String, default: "" },
    airline: { type: String, default: "" },
    pnr: { type: String, default: "" },
    ticketNumber: { type: String, default: "" },
    sector: { type: String, default: "" },
    travelDate: { type: String, default: "" },
    supplierId: { type: String, default: "" },
    costSAR: { type: Number, default: 0 },
    exchangeRate: { type: Number, default: 0 },
    costPKR: { type: Number, default: 0 },
    salePrice: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
  },
  { _id: false }
);

const bookingServiceItemSchema = new Schema<SchemaRecord>(
  {
    id: { type: String, required: true },
    kind: {
      type: String,
      enum: ["visa", "hotel", "transport", "ticket"],
      required: true,
    },
    supplierId: { type: String, default: "" },
    title: { type: String, default: "" },
    details: { type: Schema.Types.Mixed, default: {} },
    costSAR: { type: Number, default: 0 },
    exchangeRate: { type: Number, default: 0 },
    costPKR: { type: Number, default: 0 },
    salePrice: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    tickets: { type: [bookingTicketLineSchema], default: undefined },
  },
  { _id: false }
);

const travelBookingSchema = new Schema<SchemaRecord>(
  {
    id: idField(),
    bookingId: { type: String, required: true, index: true },
    customerId: { type: String, index: true },
    title: { type: String, default: "" },
    travelDate: { type: String, default: "" },
    returnDate: { type: String, default: "" },
    status: { type: String, default: "Pending" },
    notes: { type: String, default: "" },
    services: { type: [bookingServiceItemSchema], default: [] },
    totalCostPKR: { type: Number, default: 0 },
    totalSale: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },
    createdBy: { type: String, default: "" },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  baseOptions
);

const paymentSchema = new Schema<SchemaRecord>(
  {
    id: idField(),
    type: { type: String, enum: ["Customer", "Supplier"], default: "Customer" },
    partyId: { type: String, index: true },
    partyName: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: "PKR" },
    amountPKR: { type: Number, default: 0 },
    dueDate: { type: String, default: "" },
    paidDate: { type: String },
    status: { type: String, default: "Pending" },
    note: { type: String },
    createdAt: { type: String, required: true },
  },
  baseOptions
);

const cashEntrySchema = new Schema<SchemaRecord>(
  {
    id: idField(),
    type: { type: String, enum: ["Income", "Expense"], default: "Income" },
    category: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: "PKR" },
    amountPKR: { type: Number, default: 0 },
    description: { type: String, default: "" },
    date: { type: String, default: "" },
    createdBy: { type: String, default: "" },
    createdAt: { type: String, required: true },
    updatedAt: { type: String },
  },
  baseOptions
);

const refundSchema = new Schema<SchemaRecord>(
  {
    id: idField(),
    serviceType: { type: String, default: "air_ticket" },
    referenceId: { type: String, default: "" },
    bookingId: { type: String, index: true },
    customerName: { type: String, default: "" },
    refundType: { type: String, default: "Full" },
    originalAmount: { type: Number, default: 0 },
    airlineCharges: { type: Number, default: 0 },
    serviceCharges: { type: Number, default: 0 },
    refundAmount: { type: Number, default: 0 },
    status: { type: String, default: "Pending" },
    createdBy: { type: String, default: "" },
    createdAt: { type: String, required: true },
  },
  baseOptions
);

const activityLogSchema = new Schema<SchemaRecord>(
  {
    id: idField(),
    userId: { type: String, index: true },
    userName: { type: String, default: "" },
    action: { type: String, default: "" },
    module: { type: String, default: "" },
    details: { type: String, default: "" },
    createdAt: { type: String, required: true },
  },
  baseOptions
);

export interface AppSettingsDoc {
  id: string;
  exchangeRates: ExchangeRates;
  lastBackupAt?: string;
  ratesUpdatedAt?: string;
}

const appSettingsSchema = new Schema<SchemaRecord>(
  {
    id: idField(),
    exchangeRates: {
      PKR: { type: Number, default: 1 },
      SAR: { type: Number, default: 73.9 },
      AED: { type: Number, default: 76.1 },
      USD: { type: Number, default: 278.5 },
      EUR: { type: Number, default: 308.0 },
      GBP: { type: Number, default: 363.0 },
      OMR: { type: Number, default: 723.0 },
      BHD: { type: Number, default: 739.0 },
      KWD: { type: Number, default: 906.0 },
      TRY: { type: Number, default: 8.2 },
      CNY: { type: Number, default: 38.5 },
    },
    lastBackupAt: { type: String },
    ratesUpdatedAt: { type: String },
  },
  baseOptions
);

export interface BackupDoc {
  id: string;
  createdAt: string;
  createdBy: string;
  source: "manual" | "cron" | "restore";
  counts: Record<string, number>;
  data: unknown;
}

const backupSchema = new Schema<SchemaRecord>(
  {
    id: idField(),
    createdAt: { type: String, required: true },
    createdBy: { type: String, default: "" },
    source: { type: String, default: "manual" },
    counts: { type: Schema.Types.Mixed, default: {} },
    data: { type: Schema.Types.Mixed, required: true },
  },
  baseOptions
);

export const User = registerModel<AppUser>("User", userSchema);
export const Customer = registerModel<CustomerType>("Customer", customerSchema);
export const Supplier = registerModel<SupplierType>("Supplier", supplierSchema);
export const AirTicket = registerModel<AirTicketType>("AirTicket", airTicketSchema);
export const Visa = registerModel<VisaRecord>("Visa", visaSchema);
export const Hotel = registerModel<HotelBooking>("Hotel", hotelSchema);
export const Transport = registerModel<TransportBooking>("Transport", transportSchema);
export const UmrahPackage = registerModel<UmrahPackageType>("UmrahPackage", umrahPackageSchema);
export const TourPackage = registerModel<TourPackageType>("TourPackage", tourPackageSchema);
export const Insurance = registerModel<InsuranceRecord>("Insurance", insuranceSchema);
export const TravelBooking = registerModel<TravelBookingType>("TravelBooking", travelBookingSchema);
export const Payment = registerModel<PaymentType>("Payment", paymentSchema);
export const CashEntry = registerModel<CashEntryType>("CashEntry", cashEntrySchema);
export const Refund = registerModel<RefundType>("Refund", refundSchema);
export const ActivityLog = registerModel<ActivityLogType>("ActivityLog", activityLogSchema);
export const AppSettings = registerModel<AppSettingsDoc>("AppSettings", appSettingsSchema);
export const Backup = registerModel<BackupDoc>("Backup", backupSchema);

export const SETTINGS_ID = "app-settings";
