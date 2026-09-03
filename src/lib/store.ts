"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEMO_DATA } from "./demo-data";
import { calcProfit, nextBookingId, nextId, todayISO } from "./format";
import type {
  ActivityLog,
  AirTicket,
  AppState,
  AppUser,
  CashEntry,
  Customer,
  HotelBooking,
  Payment,
  Refund,
  Supplier,
  TourPackage,
  TransportBooking,
  UmrahPackage,
  UserPermissions,
  VisaRecord,
} from "./types";

interface AuthSlice {
  currentUser: AppUser | null;
  login: (username: string, password: string) => { ok: boolean; message: string };
  logout: () => void;
}

interface DataActions {
  resetDemo: () => void;
  logActivity: (action: string, module: string, details: string) => void;
  // Customers
  addCustomer: (data: Omit<Customer, "id" | "customerId" | "createdAt" | "outstanding">) => void;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  // Suppliers
  addSupplier: (data: Omit<Supplier, "id" | "createdAt" | "outstanding">) => void;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;
  // Tickets
  addTicket: (data: Omit<AirTicket, "id" | "bookingId" | "profit" | "createdAt">) => void;
  updateTicket: (id: string, data: Partial<AirTicket>) => void;
  deleteTicket: (id: string) => void;
  // Visas
  addVisa: (data: Omit<VisaRecord, "id" | "bookingId" | "profit" | "createdAt">) => void;
  updateVisa: (id: string, data: Partial<VisaRecord>) => void;
  // Hotels
  addHotel: (data: Omit<HotelBooking, "id" | "bookingId" | "profit" | "createdAt">) => void;
  updateHotel: (id: string, data: Partial<HotelBooking>) => void;
  // Transport
  addTransport: (data: Omit<TransportBooking, "id" | "bookingId" | "profit" | "createdAt">) => void;
  updateTransport: (id: string, data: Partial<TransportBooking>) => void;
  // Umrah
  addUmrah: (data: Omit<UmrahPackage, "id" | "bookingId" | "profit" | "createdAt">) => void;
  updateUmrah: (id: string, data: Partial<UmrahPackage>) => void;
  // Tours
  addTour: (data: Omit<TourPackage, "id" | "bookingId" | "profit" | "createdAt">) => void;
  // Payments
  addPayment: (data: Omit<Payment, "id" | "createdAt">) => void;
  markPaymentPaid: (id: string) => void;
  // Cash
  addCashEntry: (data: Omit<CashEntry, "id">) => void;
  // Refunds
  addRefund: (data: Omit<Refund, "id" | "createdAt">) => void;
  // Users
  addUser: (data: Omit<AppUser, "id" | "createdAt">) => void;
  updateUser: (id: string, data: Partial<AppUser>) => void;
  updateUserPermissions: (id: string, permissions: UserPermissions) => void;
}

type Store = AppState & AuthSlice & DataActions;

function allBookingIds(s: AppState): string[] {
  return [
    ...s.airTickets.map((x) => x.bookingId),
    ...s.visas.map((x) => x.bookingId),
    ...s.hotels.map((x) => x.bookingId),
    ...s.transports.map((x) => x.bookingId),
    ...s.umrahPackages.map((x) => x.bookingId),
    ...s.tourPackages.map((x) => x.bookingId),
  ];
}

function pushLog(
  logs: ActivityLog[],
  user: AppUser | null,
  action: string,
  module: string,
  details: string
): ActivityLog[] {
  if (!user) return logs;
  return [
    {
      id: nextId("log"),
      userId: user.id,
      userName: user.name,
      action,
      module,
      details,
      createdAt: new Date().toISOString(),
    },
    ...logs,
  ].slice(0, 500);
}

export const useAppStore = create<Store>()(
  persist(
    (set, get) => ({
      ...DEMO_DATA,
      currentUser: null,

      login: (username, password) => {
        const user = get().users.find(
          (u) => u.username === username && u.password === password && u.active
        );
        if (!user) return { ok: false, message: "Invalid username or password" };
        set((s) => ({
          currentUser: user,
          activityLogs: pushLog(s.activityLogs, user, "LOGIN", "Auth", "User logged in"),
        }));
        return { ok: true, message: "Welcome" };
      },

      logout: () => {
        const user = get().currentUser;
        set((s) => ({
          currentUser: null,
          activityLogs: pushLog(s.activityLogs, user, "LOGOUT", "Auth", "User logged out"),
        }));
      },

      resetDemo: () => set({ ...DEMO_DATA, currentUser: get().currentUser }),

      logActivity: (action, module, details) => {
        set((s) => ({
          activityLogs: pushLog(s.activityLogs, s.currentUser, action, module, details),
        }));
      },

      addCustomer: (data) => {
        const num = get().customers.length + 1;
        const customer: Customer = {
          ...data,
          id: nextId("c"),
          customerId: `CUS-${String(num).padStart(4, "0")}`,
          outstanding: 0,
          createdAt: todayISO(),
        };
        set((s) => ({
          customers: [customer, ...s.customers],
          activityLogs: pushLog(s.activityLogs, s.currentUser, "CREATE", "Customers", `Added ${customer.name}`),
        }));
      },

      updateCustomer: (id, data) => {
        set((s) => ({
          customers: s.customers.map((c) => (c.id === id ? { ...c, ...data } : c)),
          activityLogs: pushLog(s.activityLogs, s.currentUser, "UPDATE", "Customers", `Updated customer ${id}`),
        }));
      },

      deleteCustomer: (id) => {
        set((s) => ({
          customers: s.customers.filter((c) => c.id !== id),
          activityLogs: pushLog(s.activityLogs, s.currentUser, "DELETE", "Customers", `Deleted customer ${id}`),
        }));
      },

      addSupplier: (data) => {
        const supplier: Supplier = {
          ...data,
          id: nextId("s"),
          outstanding: 0,
          createdAt: todayISO(),
        };
        set((s) => ({
          suppliers: [supplier, ...s.suppliers],
          activityLogs: pushLog(s.activityLogs, s.currentUser, "CREATE", "Suppliers", `Added ${supplier.name}`),
        }));
      },

      updateSupplier: (id, data) => {
        set((s) => ({
          suppliers: s.suppliers.map((x) => (x.id === id ? { ...x, ...data } : x)),
        }));
      },

      addTicket: (data) => {
        const bookingId = nextBookingId(allBookingIds(get()));
        const ticket: AirTicket = {
          ...data,
          id: nextId("t"),
          bookingId,
          profit: calcProfit(data.costPrice, data.salePrice),
          createdAt: todayISO(),
        };
        set((s) => ({
          airTickets: [ticket, ...s.airTickets],
          activityLogs: pushLog(
            s.activityLogs,
            s.currentUser,
            "CREATE",
            "Air Tickets",
            `Created ${bookingId} for ${ticket.passengerName}`
          ),
        }));
      },

      updateTicket: (id, data) => {
        set((s) => ({
          airTickets: s.airTickets.map((t) => {
            if (t.id !== id) return t;
            const next = { ...t, ...data };
            next.profit = calcProfit(next.costPrice, next.salePrice);
            return next;
          }),
          activityLogs: pushLog(s.activityLogs, s.currentUser, "UPDATE", "Air Tickets", `Updated ticket ${id}`),
        }));
      },

      deleteTicket: (id) => {
        set((s) => ({
          airTickets: s.airTickets.filter((t) => t.id !== id),
          activityLogs: pushLog(s.activityLogs, s.currentUser, "DELETE", "Air Tickets", `Deleted ticket ${id}`),
        }));
      },

      addVisa: (data) => {
        const bookingId = nextBookingId(allBookingIds(get()));
        const visa: VisaRecord = {
          ...data,
          id: nextId("v"),
          bookingId,
          profit: calcProfit(data.costPrice, data.salePrice),
          createdAt: todayISO(),
        };
        set((s) => ({
          visas: [visa, ...s.visas],
          activityLogs: pushLog(s.activityLogs, s.currentUser, "CREATE", "Visa", `Created ${bookingId}`),
        }));
      },

      updateVisa: (id, data) => {
        set((s) => ({
          visas: s.visas.map((v) => {
            if (v.id !== id) return v;
            const next = { ...v, ...data };
            next.profit = calcProfit(next.costPrice, next.salePrice);
            return next;
          }),
        }));
      },

      addHotel: (data) => {
        const bookingId = nextBookingId(allBookingIds(get()));
        const hotel: HotelBooking = {
          ...data,
          id: nextId("h"),
          bookingId,
          profit: calcProfit(data.costPrice, data.salePrice),
          createdAt: todayISO(),
        };
        set((s) => ({
          hotels: [hotel, ...s.hotels],
          activityLogs: pushLog(s.activityLogs, s.currentUser, "CREATE", "Hotel", `Created ${bookingId}`),
        }));
      },

      updateHotel: (id, data) => {
        set((s) => ({
          hotels: s.hotels.map((h) => {
            if (h.id !== id) return h;
            const next = { ...h, ...data };
            next.profit = calcProfit(next.costPrice, next.salePrice);
            return next;
          }),
        }));
      },

      addTransport: (data) => {
        const bookingId = nextBookingId(allBookingIds(get()));
        const transport: TransportBooking = {
          ...data,
          id: nextId("tr"),
          bookingId,
          profit: calcProfit(data.costPrice, data.salePrice),
          createdAt: todayISO(),
        };
        set((s) => ({
          transports: [transport, ...s.transports],
          activityLogs: pushLog(s.activityLogs, s.currentUser, "CREATE", "Transport", `Created ${bookingId}`),
        }));
      },

      updateTransport: (id, data) => {
        set((s) => ({
          transports: s.transports.map((t) => {
            if (t.id !== id) return t;
            const next = { ...t, ...data };
            next.profit = calcProfit(next.costPrice, next.salePrice);
            return next;
          }),
        }));
      },

      addUmrah: (data) => {
        const bookingId = nextBookingId(allBookingIds(get()));
        const pkg: UmrahPackage = {
          ...data,
          id: nextId("um"),
          bookingId,
          profit: calcProfit(data.costPrice, data.salePrice),
          createdAt: todayISO(),
        };
        set((s) => ({
          umrahPackages: [pkg, ...s.umrahPackages],
          activityLogs: pushLog(s.activityLogs, s.currentUser, "CREATE", "Umrah", `Created ${bookingId}`),
        }));
      },

      updateUmrah: (id, data) => {
        set((s) => ({
          umrahPackages: s.umrahPackages.map((u) => {
            if (u.id !== id) return u;
            const next = { ...u, ...data };
            next.profit = calcProfit(next.costPrice, next.salePrice);
            return next;
          }),
        }));
      },

      addTour: (data) => {
        const bookingId = nextBookingId(allBookingIds(get()));
        const pkg: TourPackage = {
          ...data,
          id: nextId("tp"),
          bookingId,
          profit: calcProfit(data.costPrice, data.salePrice),
          createdAt: todayISO(),
        };
        set((s) => ({
          tourPackages: [pkg, ...s.tourPackages],
          activityLogs: pushLog(s.activityLogs, s.currentUser, "CREATE", "Tours", `Created ${bookingId}`),
        }));
      },

      addPayment: (data) => {
        const payment: Payment = { ...data, id: nextId("p"), createdAt: todayISO() };
        set((s) => ({
          payments: [payment, ...s.payments],
          activityLogs: pushLog(
            s.activityLogs,
            s.currentUser,
            "CREATE",
            "Payments",
            `Added ${payment.type} payment for ${payment.partyName}`
          ),
        }));
      },

      markPaymentPaid: (id) => {
        set((s) => ({
          payments: s.payments.map((p) =>
            p.id === id ? { ...p, status: "Paid" as const, paidDate: todayISO() } : p
          ),
        }));
      },

      addCashEntry: (data) => {
        set((s) => ({
          cashBook: [{ ...data, id: nextId("cb") }, ...s.cashBook],
        }));
      },

      addRefund: (data) => {
        const refund: Refund = { ...data, id: nextId("r"), createdAt: todayISO() };
        set((s) => ({
          refunds: [refund, ...s.refunds],
          activityLogs: pushLog(
            s.activityLogs,
            s.currentUser,
            "CREATE",
            "Refunds",
            `Refund ${refund.bookingId} — ${refund.refundType}`
          ),
        }));
      },

      addUser: (data) => {
        const user: AppUser = { ...data, id: nextId("u"), createdAt: todayISO() };
        set((s) => ({
          users: [...s.users, user],
          activityLogs: pushLog(s.activityLogs, s.currentUser, "CREATE", "Users", `Created user ${user.username}`),
        }));
      },

      updateUser: (id, data) => {
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, ...data } : u)),
          currentUser: s.currentUser?.id === id ? { ...s.currentUser, ...data } : s.currentUser,
        }));
      },

      updateUserPermissions: (id, permissions) => {
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, permissions } : u)),
          currentUser:
            s.currentUser?.id === id ? { ...s.currentUser, permissions } : s.currentUser,
          activityLogs: pushLog(s.activityLogs, s.currentUser, "UPDATE", "Users", `Updated permissions for ${id}`),
        }));
      },
    }),
    {
      name: "al-noor-travels-store",
      partialize: (s) => {
        const { currentUser, login, logout, resetDemo, logActivity, ...rest } = s;
        // persist data + session
        void login;
        void logout;
        void resetDemo;
        void logActivity;
        return { ...rest, currentUser };
      },
    }
  )
);
