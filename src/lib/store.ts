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
  ActivityLog,
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
  addCustomer: (data: Omit<Customer, "id" | "customerId" | "createdAt" | "outstanding">) => Promise<void>;
  updateCustomer: (id: string, patch: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addSupplier: (data: Omit<Supplier, "id" | "createdAt" | "outstanding">) => Promise<void>;
  updateSupplier: (id: string, patch: Partial<Supplier>) => Promise<void>;
  addTicket: (data: Omit<AirTicket, "id" | "bookingId" | "profit" | "createdAt">) => Promise<void>;
  updateTicket: (id: string, patch: Partial<AirTicket>) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  addVisa: (data: Omit<VisaRecord, "id" | "bookingId" | "profit" | "createdAt">) => Promise<void>;
  updateVisa: (id: string, patch: Partial<VisaRecord>) => Promise<void>;
  addHotel: (data: Omit<HotelBooking, "id" | "bookingId" | "profit" | "createdAt">) => Promise<void>;
  updateHotel: (id: string, patch: Partial<HotelBooking>) => Promise<void>;
  addTransport: (
    data: Omit<TransportBooking, "id" | "bookingId" | "profit" | "createdAt">
  ) => Promise<void>;
  updateTransport: (id: string, patch: Partial<TransportBooking>) => Promise<void>;
  addUmrah: (data: Omit<UmrahPackage, "id" | "bookingId" | "profit" | "createdAt">) => Promise<void>;
  updateUmrah: (id: string, patch: Partial<UmrahPackage>) => Promise<void>;
  addTour: (data: Omit<TourPackage, "id" | "bookingId" | "profit" | "createdAt">) => Promise<void>;
  addInsurance: (
    data: Omit<InsuranceRecord, "id" | "bookingId" | "profit" | "createdAt">
  ) => Promise<void>;
  addPayment: (data: Omit<Payment, "id" | "createdAt">) => Promise<void>;
  markPaymentPaid: (id: string) => Promise<void>;
  addCashEntry: (data: Omit<CashEntry, "id">) => Promise<void>;
  addRefund: (data: Omit<Refund, "id" | "createdAt">) => Promise<void>;
  addUser: (data: Omit<AppUser, "id" | "createdAt">) => Promise<void>;
  updateUser: (id: string, patch: Partial<AppUser>) => Promise<void>;
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
    const created = await data.create<Customer>("customers", { ...payload, outstanding: 0 });
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
    const created = await data.create<Supplier>("suppliers", { ...payload, outstanding: 0 });
    set((s) => ({ suppliers: [created, ...s.suppliers] }));
  },

  updateSupplier: async (id, patch) => {
    const updated = await data.update<Supplier>("suppliers", id, patch);
    set((s) => ({ suppliers: s.suppliers.map((x) => (x.id === id ? updated : x)) }));
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

  addHotel: async (payload) => {
    const created = await data.create<HotelBooking>("hotels", payload);
    set((s) => ({ hotels: [created, ...s.hotels] }));
  },

  updateHotel: async (id, patch) => {
    const updated = await data.update<HotelBooking>("hotels", id, patch);
    set((s) => ({ hotels: s.hotels.map((h) => (h.id === id ? updated : h)) }));
  },

  addTransport: async (payload) => {
    const created = await data.create<TransportBooking>("transports", payload);
    set((s) => ({ transports: [created, ...s.transports] }));
  },

  updateTransport: async (id, patch) => {
    const updated = await data.update<TransportBooking>("transports", id, patch);
    set((s) => ({ transports: s.transports.map((t) => (t.id === id ? updated : t)) }));
  },

  addUmrah: async (payload) => {
    const created = await data.create<UmrahPackage>("umrahPackages", payload);
    set((s) => ({ umrahPackages: [created, ...s.umrahPackages] }));
  },

  updateUmrah: async (id, patch) => {
    const updated = await data.update<UmrahPackage>("umrahPackages", id, patch);
    set((s) => ({ umrahPackages: s.umrahPackages.map((u) => (u.id === id ? updated : u)) }));
  },

  addTour: async (payload) => {
    const created = await data.create<TourPackage>("tourPackages", payload);
    set((s) => ({ tourPackages: [created, ...s.tourPackages] }));
  },

  addInsurance: async (payload) => {
    const created = await data.create<InsuranceRecord>("insurance", payload);
    set((s) => ({ insurance: [created, ...s.insurance] }));
  },

  addPayment: async (payload) => {
    const created = await data.create<Payment>("payments", payload);
    set((s) => ({ payments: [created, ...s.payments] }));
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

  addRefund: async (payload) => {
    const created = await data.create<Refund>("refunds", payload);
    set((s) => ({ refunds: [created, ...s.refunds] }));
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

  updateUserPermissions: async (id, permissions) => {
    await get().updateUser(id, { permissions });
  },
}));
