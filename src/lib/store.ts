"use client";

import { create } from "zustand";
import {
  ApiError,
  auth,
  bootstrap as fetchBootstrap,
  data,
  logActivity as apiLogActivity,
  seed as seedApi,
} from "./api-client";
import { todayISO } from "./format";
import type {
  AirTicket,
  AppState,
  AppUser,
  BootstrapData,
  CashEntry,
  Customer,
  HotelBooking,
  InsuranceRecord,
  Payment,
  PublicUser,
  Refund,
  Supplier,
  TourPackage,
  TransportBooking,
  TravelBooking,
  UmrahPackage,
  UserPermissions,
  VisaRecord,
} from "./types";

const EMPTY: AppState = {
  users: [],
  customers: [],
  suppliers: [],
  airTickets: [],
  visas: [],
  hotels: [],
  transports: [],
  umrahPackages: [],
  tourPackages: [],
  insurance: [],
  travelBookings: [],
  payments: [],
  cashBook: [],
  refunds: [],
  activityLogs: [],
  exchangeRates: { PKR: 1, SAR: 73.9, AED: 76.1, USD: 278.5, EUR: 308.0, GBP: 363.0, OMR: 723.0, BHD: 739.0, KWD: 906.0, TRY: 8.2, CNY: 38.5 },
};

interface AuthSlice {
  currentUser: PublicUser | null;
  hydrated: boolean;
  loading: boolean;
  lastBackupAt: string | null;
  login: (username: string, password: string) => Promise<{ ok: boolean; message: string }>;
  logout: () => Promise<void>;
  hydrateFromServer: () => Promise<boolean>;
}

interface DataActions {
  resetDemo: () => Promise<void>;
  logActivity: (action: string, module: string, details: string) => void;
  addCustomer: (data: Omit<Customer, "id" | "customerId" | "createdAt"> & { outstanding?: number }) => Promise<void>;
  updateCustomer: (id: string, patch: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addSupplier: (data: Omit<Supplier, "id" | "createdAt"> & { outstanding?: number }) => Promise<void>;
  updateSupplier: (id: string, patch: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  addTicket: (data: Omit<AirTicket, "id" | "bookingId" | "profit" | "createdAt">) => Promise<void>;
  updateTicket: (id: string, patch: Partial<AirTicket>) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  addVisa: (data: Omit<VisaRecord, "id" | "bookingId" | "profit" | "createdAt">) => Promise<void>;
  updateVisa: (id: string, patch: Partial<VisaRecord>) => Promise<void>;
  deleteVisa: (id: string) => Promise<void>;
  addHotel: (data: Omit<HotelBooking, "id" | "bookingId" | "profit" | "createdAt">) => Promise<void>;
  updateHotel: (id: string, patch: Partial<HotelBooking>) => Promise<void>;
  deleteHotel: (id: string) => Promise<void>;
  addTransport: (
    data: Omit<TransportBooking, "id" | "bookingId" | "profit" | "createdAt">
  ) => Promise<void>;
  updateTransport: (id: string, patch: Partial<TransportBooking>) => Promise<void>;
  deleteTransport: (id: string) => Promise<void>;
  addUmrah: (data: Omit<UmrahPackage, "id" | "bookingId" | "profit" | "createdAt">) => Promise<void>;
  updateUmrah: (id: string, patch: Partial<UmrahPackage>) => Promise<void>;
  deleteUmrah: (id: string) => Promise<void>;
  addTour: (data: Omit<TourPackage, "id" | "bookingId" | "profit" | "createdAt">) => Promise<void>;
  updateTour: (id: string, patch: Partial<TourPackage>) => Promise<void>;
  deleteTour: (id: string) => Promise<void>;
  addInsurance: (
    data: Omit<InsuranceRecord, "id" | "bookingId" | "profit" | "createdAt">
  ) => Promise<void>;
  updateInsurance: (id: string, patch: Partial<InsuranceRecord>) => Promise<void>;
  deleteInsurance: (id: string) => Promise<void>;
  addTravelBooking: (
    data: Omit<
      TravelBooking,
      | "id"
      | "bookingId"
      | "totalCostPKR"
      | "totalSale"
      | "totalProfit"
      | "createdAt"
      | "updatedAt"
    >
  ) => Promise<void>;
  updateTravelBooking: (id: string, patch: Partial<TravelBooking>) => Promise<void>;
  deleteTravelBooking: (id: string) => Promise<void>;
  addPayment: (data: Omit<Payment, "id" | "createdAt">) => Promise<void>;
  updatePayment: (id: string, patch: Partial<Payment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  markPaymentPaid: (id: string) => Promise<void>;
  addCashEntry: (data: Omit<CashEntry, "id">) => Promise<void>;
  updateCashEntry: (id: string, patch: Partial<CashEntry>) => Promise<void>;
  deleteCashEntry: (id: string) => Promise<void>;
  addRefund: (data: Omit<Refund, "id" | "createdAt">) => Promise<void>;
  updateRefund: (id: string, patch: Partial<Refund>) => Promise<void>;
  deleteRefund: (id: string) => Promise<void>;
  addUser: (data: Omit<AppUser, "id" | "createdAt">) => Promise<void>;
  updateUser: (id: string, patch: Partial<AppUser>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateUserPermissions: (id: string, permissions: UserPermissions) => Promise<void>;
}

type Store = AppState & AuthSlice & DataActions;

function applyBootstrap(set: (partial: Partial<Store>) => void, payload: BootstrapData) {
  set({
    users: payload.users as unknown as AppUser[],
    customers: payload.customers,
    suppliers: payload.suppliers,
    airTickets: payload.airTickets,
    visas: payload.visas,
    hotels: payload.hotels,
    transports: payload.transports,
    umrahPackages: payload.umrahPackages,
    tourPackages: payload.tourPackages,
    insurance: payload.insurance ?? [],
    travelBookings: payload.travelBookings ?? [],
    payments: payload.payments,
    cashBook: payload.cashBook,
    refunds: payload.refunds,
    activityLogs: payload.activityLogs,
    exchangeRates: payload.exchangeRates,
    currentUser: payload.currentUser,
    lastBackupAt: payload.lastBackupAt ?? null,
    hydrated: true,
    loading: false,
  });
}

function errMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

export const useAppStore = create<Store>((set, get) => ({
  ...EMPTY,
  currentUser: null,
  hydrated: false,
  loading: false,
  lastBackupAt: null,

  hydrateFromServer: async () => {
    set({ loading: true });
    try {
      await auth.me();
      const payload = await fetchBootstrap();
      applyBootstrap(set, payload);
      return true;
    } catch {
      set({ ...EMPTY, currentUser: null, hydrated: true, loading: false });
      return false;
    }
  },

  login: async (username, password) => {
    try {
      await auth.login(username, password);
      const payload = await fetchBootstrap();
      applyBootstrap(set, payload);
      return { ok: true, message: "Welcome" };
    } catch (error) {
      return { ok: false, message: errMessage(error, "Login failed") };
    }
  },

  logout: async () => {
    try {
      await auth.logout();
    } catch {
      /* ignore */
    }
    set({ ...EMPTY, currentUser: null, hydrated: true, loading: false });
  },

  resetDemo: async () => {
    await seedApi.run(true);
    const payload = await fetchBootstrap();
    applyBootstrap(set, payload);
  },

  logActivity: (action, module, details) => {
    void apiLogActivity(action, module, details)
      .then((entry) => set((s) => ({ activityLogs: [entry, ...s.activityLogs].slice(0, 500) })))
      .catch(() => undefined);
  },

  addCustomer: async (payload) => {
    const created = await data.create<Customer>("customers", {
      ...payload,
      outstanding: Number(payload.outstanding ?? 0),
    });
    set((s) => ({ customers: [created, ...s.customers] }));
  },

  updateCustomer: async (id, patch) => {
    const updated = await data.update<Customer>("customers", id, patch);
    set((s) => ({ customers: s.customers.map((c) => (c.id === id ? updated : c)) }));
  },

  deleteCustomer: async (id) => {
    await data.remove("customers", id);
    set((s) => ({ customers: s.customers.filter((c) => c.id !== id) }));
  },

  addSupplier: async (payload) => {
    const created = await data.create<Supplier>("suppliers", {
      ...payload,
      outstanding: Number(payload.outstanding ?? 0),
    });
    set((s) => ({ suppliers: [created, ...s.suppliers] }));
  },

  updateSupplier: async (id, patch) => {
    const updated = await data.update<Supplier>("suppliers", id, patch);
    set((s) => ({ suppliers: s.suppliers.map((x) => (x.id === id ? updated : x)) }));
  },

  deleteSupplier: async (id) => {
    await data.remove("suppliers", id);
    set((s) => ({ suppliers: s.suppliers.filter((supplier) => supplier.id !== id) }));
  },

  addTicket: async (payload) => {
    const created = await data.create<AirTicket>("airTickets", payload);
    set((s) => ({ airTickets: [created, ...s.airTickets] }));
  },

  updateTicket: async (id, patch) => {
    const updated = await data.update<AirTicket>("airTickets", id, patch);
    set((s) => ({ airTickets: s.airTickets.map((t) => (t.id === id ? updated : t)) }));
  },

  deleteTicket: async (id) => {
    await data.remove("airTickets", id);
    set((s) => ({ airTickets: s.airTickets.filter((t) => t.id !== id) }));
  },

  addVisa: async (payload) => {
    const created = await data.create<VisaRecord>("visas", payload);
    set((s) => ({ visas: [created, ...s.visas] }));
  },

  updateVisa: async (id, patch) => {
    const updated = await data.update<VisaRecord>("visas", id, patch);
    set((s) => ({ visas: s.visas.map((v) => (v.id === id ? updated : v)) }));
  },

  deleteVisa: async (id) => {
    await data.remove("visas", id);
    set((s) => ({ visas: s.visas.filter((visa) => visa.id !== id) }));
  },

  addHotel: async (payload) => {
    const created = await data.create<HotelBooking>("hotels", payload);
    set((s) => ({ hotels: [created, ...s.hotels] }));
  },

  updateHotel: async (id, patch) => {
    const updated = await data.update<HotelBooking>("hotels", id, patch);
    set((s) => ({ hotels: s.hotels.map((h) => (h.id === id ? updated : h)) }));
  },

  deleteHotel: async (id) => {
    await data.remove("hotels", id);
    set((s) => ({ hotels: s.hotels.filter((hotel) => hotel.id !== id) }));
  },

  addTransport: async (payload) => {
    const created = await data.create<TransportBooking>("transports", payload);
    set((s) => ({ transports: [created, ...s.transports] }));
  },

  updateTransport: async (id, patch) => {
    const updated = await data.update<TransportBooking>("transports", id, patch);
    set((s) => ({ transports: s.transports.map((t) => (t.id === id ? updated : t)) }));
  },

  deleteTransport: async (id) => {
    await data.remove("transports", id);
    set((s) => ({ transports: s.transports.filter((transport) => transport.id !== id) }));
  },

  addUmrah: async (payload) => {
    const created = await data.create<UmrahPackage>("umrahPackages", payload);
    set((s) => ({ umrahPackages: [created, ...s.umrahPackages] }));
  },

  updateUmrah: async (id, patch) => {
    const updated = await data.update<UmrahPackage>("umrahPackages", id, patch);
    set((s) => ({ umrahPackages: s.umrahPackages.map((u) => (u.id === id ? updated : u)) }));
  },

  deleteUmrah: async (id) => {
    await data.remove("umrahPackages", id);
    set((s) => ({ umrahPackages: s.umrahPackages.filter((umrah) => umrah.id !== id) }));
  },

  addTour: async (payload) => {
    const created = await data.create<TourPackage>("tourPackages", payload);
    set((s) => ({ tourPackages: [created, ...s.tourPackages] }));
  },

  updateTour: async (id, patch) => {
    const updated = await data.update<TourPackage>("tourPackages", id, patch);
    set((s) => ({ tourPackages: s.tourPackages.map((tour) => (tour.id === id ? updated : tour)) }));
  },

  deleteTour: async (id) => {
    await data.remove("tourPackages", id);
    set((s) => ({ tourPackages: s.tourPackages.filter((tour) => tour.id !== id) }));
  },

  addInsurance: async (payload) => {
    const created = await data.create<InsuranceRecord>("insurance", payload);
    set((s) => ({ insurance: [created, ...s.insurance] }));
  },

  updateInsurance: async (id, patch) => {
    const updated = await data.update<InsuranceRecord>("insurance", id, patch);
    set((s) => ({ insurance: s.insurance.map((record) => (record.id === id ? updated : record)) }));
  },

  deleteInsurance: async (id) => {
    await data.remove("insurance", id);
    set((s) => ({ insurance: s.insurance.filter((record) => record.id !== id) }));
  },

  addTravelBooking: async (payload) => {
    const created = await data.create<TravelBooking>("travelBookings", payload);
    set((s) => ({ travelBookings: [created, ...s.travelBookings] }));
  },

  updateTravelBooking: async (id, patch) => {
    const updated = await data.update<TravelBooking>("travelBookings", id, patch);
    set((s) => ({
      travelBookings: s.travelBookings.map((b) => (b.id === id ? updated : b)),
    }));
  },

  deleteTravelBooking: async (id) => {
    await data.remove("travelBookings", id);
    set((s) => ({ travelBookings: s.travelBookings.filter((b) => b.id !== id) }));
  },

  addPayment: async (payload) => {
    const created = await data.create<Payment>("payments", payload);
    set((s) => ({ payments: [created, ...s.payments] }));
  },

  updatePayment: async (id, patch) => {
    const updated = await data.update<Payment>("payments", id, patch);
    set((s) => ({ payments: s.payments.map((payment) => (payment.id === id ? updated : payment)) }));
  },

  deletePayment: async (id) => {
    await data.remove("payments", id);
    set((s) => ({ payments: s.payments.filter((payment) => payment.id !== id) }));
  },

  markPaymentPaid: async (id) => {
    const updated = await data.update<Payment>("payments", id, {
      status: "Paid",
      paidDate: todayISO(),
    });
    set((s) => ({ payments: s.payments.map((p) => (p.id === id ? updated : p)) }));
  },

  addCashEntry: async (payload) => {
    const created = await data.create<CashEntry>("cashBook", payload);
    set((s) => ({ cashBook: [created, ...s.cashBook] }));
  },

  updateCashEntry: async (id, patch) => {
    const updated = await data.update<CashEntry>("cashBook", id, patch);
    set((s) => ({ cashBook: s.cashBook.map((entry) => (entry.id === id ? updated : entry)) }));
  },

  deleteCashEntry: async (id) => {
    await data.remove("cashBook", id);
    set((s) => ({ cashBook: s.cashBook.filter((entry) => entry.id !== id) }));
  },

  addRefund: async (payload) => {
    const created = await data.create<Refund>("refunds", payload);
    set((s) => ({ refunds: [created, ...s.refunds] }));
  },

  updateRefund: async (id, patch) => {
    const updated = await data.update<Refund>("refunds", id, patch);
    set((s) => ({ refunds: s.refunds.map((refund) => (refund.id === id ? updated : refund)) }));
  },

  deleteRefund: async (id) => {
    await data.remove("refunds", id);
    set((s) => ({ refunds: s.refunds.filter((refund) => refund.id !== id) }));
  },

  addUser: async (payload) => {
    const created = await data.create<PublicUser>("users", payload);
    set((s) => ({
      users: [...s.users, created as unknown as AppUser],
    }));
  },

  updateUser: async (id, patch) => {
    const updated = await data.update<PublicUser>("users", id, patch);
    set((s) => ({
      users: s.users.map((u) => (u.id === id ? ({ ...u, ...updated } as AppUser) : u)),
      currentUser: s.currentUser?.id === id ? { ...s.currentUser, ...updated } : s.currentUser,
    }));
  },

  deleteUser: async (id) => {
    await data.remove("users", id);
    set((s) => ({ users: s.users.filter((user) => user.id !== id) }));
  },

  updateUserPermissions: async (id, permissions) => {
    await get().updateUser(id, { permissions });
  },
}));
