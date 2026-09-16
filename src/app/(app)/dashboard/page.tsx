"use client";

import { useState } from "react";
import {
  Plane,
  FileText,
  Hotel,
  Bus,
  Users,
  Wallet,
  BadgeCheck,
  ArrowRightLeft,
  Eye,
  EyeOff,
  Truck,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatDate, formatPKR, todayISO } from "@/lib/format";
import { totalPayables, totalReceivables } from "@/lib/accounting";
import { Button, Card, PageHeader, StatusBadge } from "@/components/ui";
import type { ReactNode } from "react";

type DashboardRow = {
  bookingId: string;
  customer: string;
  service: string;
  date: string;
  status: string;
  icon: "plane" | "visa" | "hotel" | "bus" | "umrah";
};

function BookingTable({ rows }: { rows: DashboardRow[] }) {
  const Icon = ({ type }: { type: DashboardRow["icon"] }) => {
    const map = {
      plane: <Plane size={14} className="text-blue-600" />,
      visa: <FileText size={14} className="text-emerald-600" />,
      hotel: <Hotel size={14} className="text-violet-600" />,
      bus: <Bus size={14} className="text-orange-600" />,
      umrah: <BadgeCheck size={14} className="text-cyan-600" />,
    };
    return <span className="rounded bg-slate-50 p-1.5">{map[type]}</span>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs text-slate-500">
            <th className="pb-2 font-medium">Booking ID</th>
            <th className="pb-2 font-medium">Customer</th>
            <th className="pb-2 font-medium">Service</th>
            <th className="pb-2 font-medium">Date</th>
            <th className="pb-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.bookingId + row.service} className="border-b border-slate-50 last:border-0">
              <td className="py-2.5">
                <div className="flex items-center gap-2">
                  <Icon type={row.icon} />
                  <span className="font-medium text-slate-700">{row.bookingId}</span>
                </div>
              </td>
              <td className="py-2.5 text-slate-600">{row.customer}</td>
              <td className="py-2.5 text-slate-600">{row.service}</td>
              <td className="py-2.5 text-slate-600">{row.date}</td>
              <td className="py-2.5">
                <StatusBadge status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Masked() {
  return <span className="tracking-widest text-slate-500">••••••••</span>;
}

export default function DashboardPage() {
  const user = useAppStore((s) => s.currentUser);
  const customers = useAppStore((s) => s.customers);
  const suppliers = useAppStore((s) => s.suppliers);
  const airTickets = useAppStore((s) => s.airTickets);
  const visas = useAppStore((s) => s.visas);
  const hotels = useAppStore((s) => s.hotels);
  const transports = useAppStore((s) => s.transports);
  const umrahPackages = useAppStore((s) => s.umrahPackages);
  const tourPackages = useAppStore((s) => s.tourPackages);
  const travelBookings = useAppStore((s) => s.travelBookings);
  const payments = useAppStore((s) => s.payments);

  const canShow = user?.role === "super_admin";
  const [showFinancials, setShowFinancials] = useState(false);
  const reveal = canShow && showFinancials;

  const totalSales =
    airTickets.reduce((a, t) => a + (t.salePrice || 0), 0) +
    visas.reduce((a, t) => a + (t.salePrice || 0), 0) +
    hotels.reduce((a, t) => a + (t.salePrice || 0), 0) +
    transports.reduce((a, t) => a + (t.salePrice || 0), 0) +
    umrahPackages.reduce((a, t) => a + (t.salePrice || 0), 0) +
    tourPackages.reduce((a, t) => a + (t.salePrice || 0), 0) +
    travelBookings.reduce((a, t) => a + (t.totalSale || 0), 0);

  const totalCost =
    airTickets.reduce((a, t) => a + (t.costPrice || 0), 0) +
    visas.reduce((a, t) => a + (t.costPrice || 0), 0) +
    hotels.reduce((a, t) => a + (t.costPrice || 0), 0) +
    transports.reduce((a, t) => a + (t.costPrice || 0), 0) +
    umrahPackages.reduce((a, t) => a + (t.costPrice || 0), 0) +
    tourPackages.reduce((a, t) => a + (t.costPrice || 0), 0) +
    travelBookings.reduce((a, t) => a + (t.totalCostPKR || 0), 0);

  const totalProfit = totalSales - totalCost;

  const receivable = totalReceivables({ customers, suppliers, airTickets, visas, hotels, transports, umrahPackages, tourPackages, travelBookings, payments });
  const payable = totalPayables({ customers, suppliers, airTickets, visas, hotels, transports, umrahPackages, tourPackages, travelBookings, payments });

  const getCustomerName = (id: string) => customers.find((c) => c.id === id)?.name || "—";

  const allBookings: DashboardRow[] = [
    ...airTickets.map((t) => ({
      bookingId: t.bookingId,
      customer: t.passengerName,
      service: `Air Ticket (${t.sector})${t.tripType === "Return" ? " — Return" : ""}`,
      date: t.travelDate,
      status: t.status,
      icon: "plane" as const,
    })),
    ...visas.map((v) => ({
      bookingId: v.bookingId,
      customer: getCustomerName(v.customerId),
      service: v.visaType,
      date: v.submissionDate,
      status: v.status,
      icon: "visa" as const,
    })),
    ...hotels.map((h) => ({
      bookingId: h.bookingId,
      customer: getCustomerName(h.customerId),
      service: `Hotel — ${h.hotelName}`,
      date: h.checkIn,
      status: h.status,
      icon: "hotel" as const,
    })),
    ...transports.map((t) => ({
      bookingId: t.bookingId,
      customer: getCustomerName(t.customerId),
      service: t.type,
      date: t.date,
      status: t.status,
      icon: "bus" as const,
    })),
    ...umrahPackages.map((u) => ({
      bookingId: u.bookingId,
      customer: getCustomerName(u.customerId),
      service: u.packageName,
      date: u.travelDate,
      status: u.status,
      icon: "umrah" as const,
    })),
    ...travelBookings.flatMap((b) =>
      b.services.map((service) => ({
        bookingId: b.bookingId,
        customer: getCustomerName(b.customerId),
        service: `${service.kind.toUpperCase()} — ${service.title}`,
        date:
          service.kind === "hotel"
            ? service.details.checkIn || b.travelDate
            : service.kind === "transport"
              ? service.details.date || b.travelDate
              : service.kind === "ticket"
                ? service.tickets?.map((ticket) => ticket.travelDate).filter(Boolean).sort()[0] || b.travelDate
                : b.travelDate,
        status: b.status,
        icon: service.kind === "hotel" ? "hotel" as const : service.kind === "transport" ? "bus" as const : service.kind === "ticket" ? "plane" as const : "visa" as const,
      }))
    ),
  ];

  const upcoming = allBookings
    .filter((b) => b.date >= todayISO() && !["Completed", "Cancelled", "Refunded"].includes(b.status))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  const recent = allBookings
    .filter((b) => !["Cancelled", "Refunded"].includes(b.status))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  const pendingPayments = payments.filter((p) => p.status === "Pending").slice(0, 6);

  const totalRecords =
    airTickets.length +
    visas.length +
    hotels.length +
    transports.length +
    umrahPackages.length +
    tourPackages.length +
    travelBookings.length;

  return (
    <div>
      <PageHeader title="Dashboard" breadcrumb="Home / Dashboard" />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="All Bookings (Tickets · Visas · Hotels · Transport · Umrah)" value={totalRecords.toLocaleString()} icon={<ArrowRightLeft size={18} />} tone="from-blue-500 to-blue-600" />
        <MiniStat label="Total Customers" value={customers.length.toLocaleString()} icon={<Users size={18} />} tone="from-emerald-500 to-emerald-600" />
        <MiniStat label="Total Suppliers" value={suppliers.length.toLocaleString()} icon={<Truck size={18} />} tone="from-violet-500 to-violet-600" />
        <MiniStat label="Pending Payments" value={payments.filter((p) => p.status !== "Paid").length.toLocaleString()} icon={<Wallet size={18} />} tone="from-orange-500 to-orange-600" />
      </div>

      <div className="mb-5">
        <Card
          title="Financials (Sale & Profit)"
          action={
            <Button
              variant="secondary"
              className="!px-2 !py-1 text-xs"
              onClick={() => setShowFinancials((v) => !v)}
              disabled={!canShow}
            >
              {reveal ? <EyeOff size={14} /> : <Eye size={14} />}
              {reveal ? "Hide" : "Show Sale / Profit"}
            </Button>
          }
        >
          {!canShow ? (
            <p className="py-6 text-center text-sm text-slate-400">
              You do not have permission to view sale &amp; profit figures.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-xs text-slate-500">Total Sales</p>
                <p className="mt-1 text-xl font-bold text-blue-700">
                  {reveal ? formatPKR(totalSales) : <Masked />}
                </p>
              </div>
              <div className="rounded-xl bg-rose-50 p-4">
                <p className="text-xs text-slate-500">Total Cost</p>
                <p className="mt-1 text-xl font-bold text-rose-700">
                  {reveal ? formatPKR(totalCost) : <Masked />}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-xs text-slate-500">Total Profit</p>
                <p className="mt-1 text-xl font-bold text-emerald-700">
                  {reveal ? formatPKR(totalProfit) : <Masked />}
                </p>
              </div>
            </div>
          )}
          <p className="mt-3 text-xs text-slate-400">
            Sale / profit figures stay hidden by default — press “Show Sale / Profit” whenever you need them.
          </p>
        </Card>
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs text-rose-600">Customer Outstanding (Receivables)</p>
          <p className="mt-1 text-lg font-bold text-rose-700">
            {reveal ? formatPKR(receivable) : <Masked />}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs text-amber-700">Supplier Payables</p>
          <p className="mt-1 text-lg font-bold text-amber-800">
            {reveal ? formatPKR(payable) : <Masked />}
          </p>
        </div>
      </div>

      <div className="mb-5 grid gap-4 xl:grid-cols-2">
        <Card title="Upcoming Bookings">
          {upcoming.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No upcoming bookings.</p>
          ) : (
            <BookingTable rows={upcoming} />
          )}
        </Card>
        <Card title="Recent Bookings">
          {recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No bookings yet.</p>
          ) : (
            <BookingTable rows={recent} />
          )}
        </Card>
      </div>

      <Card title="Pending Payments">
        {pendingPayments.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No pending payments.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayments.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50">
                    <td className="py-2">
                      <span className={p.type === "Customer" ? "text-xs font-medium text-blue-600" : "text-xs font-medium text-orange-600"}>
                        {p.type}
                      </span>
                    </td>
                    <td className="py-2 text-slate-700">{p.partyName}</td>
                    <td className="py-2 font-medium text-slate-800">
                      {reveal ? formatPKR(p.amountPKR) : <Masked />}
                    </td>
                    <td className="py-2 text-slate-500">{formatDate(p.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <div className={`rounded-xl bg-gradient-to-br p-4 text-white shadow-sm ${tone}`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-white/90">{label}</p>
        <span className="rounded-lg bg-white/20 p-1.5">{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
    </div>
  );
}
