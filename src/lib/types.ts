export type UserRole = "super_admin" | "staff";

export type Permission =
  | "view_cost"
  | "view_profit"
  | "view_accounts"
  | "view_financial_reports"
  | "manage_users"
  | "create_records"
  | "edit_records"
  | "delete_records"
  | "view_reports"
  | "view_activity_log";

export interface UserPermissions {
  viewCost: boolean;
  viewProfit: boolean;
  viewAccounts: boolean;
  viewFinancialReports: boolean;
  manageUsers: boolean;
  createRecords: boolean;
  editRecords: boolean;
  deleteRecords: boolean;
  viewReports: boolean;
  viewActivityLog: boolean;
}

export interface AppUser {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: UserPermissions;
  active: boolean;
  avatar?: string;
  createdAt: string;
}

export type BookingStatus = "Confirmed" | "Pending" | "Cancelled" | "Refunded" | "Completed";
export type ServiceType =
  | "air_ticket"
  | "visa"
  | "hotel"
  | "transport"
  | "umrah"
  | "tour"
  | "insurance";

export interface Customer {
  id: string;
  customerId: string;
  name: string;
  mobile: string;
  cnic: string;
  passportNumber: string;
  email: string;
  address: string;
  outstanding: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Supplier {
  id: string;
  name: string;
  type: string;
  mobile: string;
  email: string;
  outstanding: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AirTicket {
  id: string;
  bookingId: string;
  passengerName: string;
  passengerNames?: string[];
  pax: number;
  customerId: string;
  airline: string;
  pnr: string;
  ticketNumber: string;
  sector: string;
  issueDate: string;
  travelDate: string;
  flightTime: string;
  supplierId: string;
  /** Cost in SAR (preferred). */
  costSAR?: number;
  /** User-entered SAR→PKR rate locked on this record. */
  exchangeRate?: number;
  costPrice: number;
  perTicketPrice: number;
  totalAmount: number;
  salePrice: number;
  profit: number;
  status: BookingStatus;
  currency: Currency;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface VisaRecord {
  id: string;
  bookingId: string;
  customerId: string;
  passportNo: string;
  visaType: "Umrah Visa" | "Dubai Visa" | "Malaysia Visa" | "Visit Visa" | "Other";
  country?: string;
  submissionDate: string;
  approvalDate?: string;
  expiryDate?: string;
  costPrice: number;
  salePrice: number;
  profit: number;
  status: BookingStatus | "In Process" | "Approved" | "Rejected";
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  costSAR?: number;
  exchangeRate?: number;
}

export interface HotelBooking {
  id: string;
  bookingId: string;
  customerId: string;
  hotelName: string;
  city: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  supplierId: string;
  costPrice: number;
  salePrice: number;
  profit: number;
  status: BookingStatus;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  costSAR?: number;
  exchangeRate?: number;
}

export type TransportType = "Airport Transfer" | "Ziyarat Transport" | "Local Transport";

export interface TransportBooking {
  id: string;
  bookingId: string;
  customerId: string;
  type: TransportType;
  pickup: string;
  dropoff: string;
  date: string;
  time: string;
  vehicle: string;
  driver: string;
  costPrice: number;
  salePrice: number;
  profit: number;
  status: BookingStatus;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  costSAR?: number;
  exchangeRate?: number;
}

export interface UmrahPackage {
  id: string;
  bookingId: string;
  customerId: string;
  packageName: string;
  includesVisa: boolean;
  includesTicket: boolean;
  includesHotel: boolean;
  includesTransport: boolean;
  travelDate: string;
  returnDate: string;
  costPrice: number;
  salePrice: number;
  profit: number;
  status: BookingStatus;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  costSAR?: number;
  exchangeRate?: number;
  services?: BookingServiceItem[];
}

export interface TourPackage {
  id: string;
  bookingId: string;
  customerId: string;
  packageName: string;
  destination: string;
  travelDate: string;
  returnDate: string;
  costPrice: number;
  salePrice: number;
  profit: number;
  status: BookingStatus;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export type Currency = "PKR" | "SAR" | "AED" | "USD";

export interface InsuranceRecord {
  id: string;
  bookingId: string;
  customerId: string;
  provider: string;
  policyNumber: string;
  coverageType: string;
  startDate: string;
  endDate: string;
  costPrice: number;
  salePrice: number;
  profit: number;
  status: BookingStatus;
  currency: Currency;
  createdBy: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  type: "Customer" | "Supplier";
  partyId: string;
  partyName: string;
  bookingId: string;
  amount: number;
  currency: Currency;
  amountPKR: number;
  dueDate: string;
  paidDate?: string;
  status: "Pending" | "Paid" | "Partial";
  note?: string;
  createdAt: string;
}

export interface CashEntry {
  id: string;
  type: "Income" | "Expense";
  category: string;
  amount: number;
  currency: Currency;
  amountPKR: number;
  description: string;
  date: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Refund {
  id: string;
  serviceType: ServiceType;
  referenceId: string;
  bookingId: string;
  customerName: string;
  refundType: "Full" | "Partial" | "Used + Refunded";
  originalAmount: number;
  airlineCharges: number;
  serviceCharges: number;
  refundAmount: number;
  status: "Pending" | "Processed";
  createdAt: string;
  createdBy: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
  createdAt: string;
}

export interface ExchangeRates {
  PKR: number;
  SAR: number;   // Saudi Riyal
  AED: number;   // UAE Dirham
  USD: number;   // US Dollar
  EUR: number;   // Euro
  GBP: number;   // British Pound
  OMR: number;   // Omani Rial
  BHD: number;   // Bahraini Dinar
  KWD: number;   // Kuwaiti Dinar
  TRY: number;   // Turkish Lira
  CNY: number;   // Chinese Yuan
}

/** One passenger/ticket line under a multi-service travel booking. */
export interface BookingTicketLine {
  id: string;
  passengerName: string;
  airline: string;
  pnr: string;
  ticketNumber: string;
  sector: string;
  travelDate: string;
  supplierId: string;
  /** Cost entered in Saudi Riyals. */
  costSAR: number;
  /** SAR→PKR rate entered by user for this line (locked forever). */
  exchangeRate: number;
  /** costSAR × exchangeRate */
  costPKR: number;
  salePrice: number;
  profit: number;
}

export type BookingServiceKind = "visa" | "hotel" | "transport" | "ticket";

/** One service (visa / hotel / transport / tickets) inside a travel booking. */
export interface BookingServiceItem {
  id: string;
  kind: BookingServiceKind;
  supplierId: string;
  /** Free-text summary shown in lists (hotel name, visa type, etc.). */
  title: string;
  /** Kind-specific fields kept as a flat bag for flexibility. */
  details: Record<string, string>;
  costSAR: number;
  exchangeRate: number;
  costPKR: number;
  salePrice: number;
  profit: number;
  /** Only for kind === "ticket" — multiple passengers with separate costs. */
  tickets?: BookingTicketLine[];
}

/**
 * Unified booking that can bundle Visa + Hotel + Transport + Tickets,
 * each with its own vendor, SAR cost, and locked exchange rate.
 */
export interface TravelBooking {
  id: string;
  bookingId: string;
  customerId: string;
  title: string;
  travelDate: string;
  returnDate: string;
  status: BookingStatus;
  notes: string;
  services: BookingServiceItem[];
  totalCostPKR: number;
  totalSale: number;
  totalProfit: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  users: AppUser[];
  customers: Customer[];
  suppliers: Supplier[];
  airTickets: AirTicket[];
  visas: VisaRecord[];
  hotels: HotelBooking[];
  transports: TransportBooking[];
  umrahPackages: UmrahPackage[];
  tourPackages: TourPackage[];
  insurance: InsuranceRecord[];
  travelBookings: TravelBooking[];
  payments: Payment[];
  cashBook: CashEntry[];
  refunds: Refund[];
  activityLogs: ActivityLog[];
  exchangeRates: ExchangeRates;
}

/** A user as returned by the API — the password hash never leaves the server. */
export type PublicUser = Omit<AppUser, "password">;

/** Payload of `GET /api/bootstrap`: the whole app state for the signed-in user. */
export interface BootstrapData extends Omit<AppState, "users"> {
  users: PublicUser[];
  currentUser: PublicUser;
  lastBackupAt?: string;
}
