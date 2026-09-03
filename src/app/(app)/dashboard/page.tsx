"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plane,
  FileText,
  Hotel,
  Bus,
  Users,
  Wallet,
  CalendarDays,
  BadgeCheck,
  ArrowRightLeft,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatPKR } from "@/lib/format";
import {
  Card,
  Input,
  PageHeader,
  Select,
  StatCard,
  StatusBadge,
} from "@/components/ui";
import { SalesLineChart, ServicesPieChart } from "@/components/Charts";

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
  const payments = useAppStore((s) => s.payments);
  const exchangeRates = useAppStore((s) => s.exchangeRates);

  const showCost = user?.permissions.viewCost || user?.role === "super_admin";
  const showProfit = user?.permissions.viewProfit || user?.role === "super_admin";
  const showFinancials = !!(showCost || showProfit);

  const totalSales =
    airTickets.reduce((a, t) => a + t.salePrice, 0) +
    visas.reduce((a, t) => a + t.salePrice, 0) +
    hotels.reduce((a, t) => a + t.salePrice, 0) +
    transports.reduce((a, t) => a + t.salePrice, 0) +
    umrahPackages.reduce((a, t) => a + t.salePrice, 0) +
    tourPackages.reduce((a, t) => a + t.salePrice, 0);

  const totalCost =
    airTickets.reduce((a, t) => a + t.costPrice, 0) +
    visas.reduce((a, t) => a + t.costPrice, 0) +
    hotels.reduce((a, t) => a + t.costPrice, 0) +
    transports.reduce((a, t) => a + t.costPrice, 0) +
    umrahPackages.reduce((a, t) => a + t.costPrice, 0) +
    tourPackages.reduce((a, t) => a + t.costPrice, 0);

  const totalProfit = totalSales - totalCost;
  const receivables = customers.reduce((a, c) => a + c.outstanding, 0);

  // Currency Converter: all foreign currencies → PKR
  const FOREIGN_CURRENCIES = ["SAR", "AED", "USD", "EUR", "GBP", "OMR", "BHD", "KWD", "TRY", "CNY"] as const;
  type ForeignCurrency = (typeof FOREIGN_CURRENCIES)[number];
  const [convAmount, setConvAmount] = useState<string>("20");
  const [convCurrency, setConvCurrency] = useState<ForeignCurrency>("SAR");
  const convNumber = parseFloat(convAmount) || 0;
  const convRate = exchangeRates[convCurrency] ?? 0;
  // rate stored as "1 foreign = X PKR", so multiply directly
  const convPKR = Math.round(convNumber * convRate);

  const getCustomerName = (id: string) => customers.find((c) => c.id === id)?.name || "—";

  type Row = {
    bookingId: string;
    customer: string;
    service: string;
    date: string;
    status: string;
    icon: "plane" | "visa" | "hotel" | "bus" | "umrah";
  };

  const upcoming: Row[] = [
    ...airTickets.map((t) => ({
      bookingId: t.bookingId,
      customer: t.passengerName,
      service: `Air Ticket (${t.sector})`,
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
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  const recent = [...upcoming].reverse().slice(0, 5);
  const pendingPayments = payments.filter((p) => p.status === "Pending").slice(0, 5);

  const serviceCounts = [
    { name: "Air Tickets", count: airTickets.length, href: "/air-tickets", color: "text-blue-600 bg-blue-50" },
    { name: "Visas", count: visas.length, href: "/visas", color: "text-emerald-600 bg-emerald-50" },
    { name: "Hotels", count: hotels.length, href: "/hotels", color: "text-violet-600 bg-violet-50" },
    { name: "Transport", count: transports.length, href: "/transport", color: "text-orange-600 bg-orange-50" },
    { name: "Umrah Packages", count: umrahPackages.length, href: "/umrah", color: "text-cyan-600 bg-cyan-50" },
    { name: "Tour Packages", count: tourPackages.length, href: "/tours", color: "text-rose-600 bg-rose-50" },
  ];

  const pieData = [
    { name: "Air Tickets", value: 45 },
    { name: "Umrah Packages", value: 25 },
    { name: "Hotels", value: 15 },
    { name: "Visas", value: 10 },
    { name: "Transport", value: 5 },
  ];

  const Icon = ({ type }: { type: Row["icon"] }) => {
    const map = {
      plane: <Plane size={14} className="text-blue-600" />,
      visa: <FileText size={14} className="text-emerald-600" />,
      hotel: <Hotel size={14} className="text-violet-600" />,
      bus: <Bus size={14} className="text-orange-600" />,
      umrah: <BadgeCheck size={14} className="text-cyan-600" />,
    };
    return <span className="rounded bg-slate-50 p-1.5">{map[type]}</span>;
  };

  const BookingTable = ({ rows }: { rows: Row[] }) => (
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
          {rows.map((r) => (
            <tr key={r.bookingId + r.service} className="border-b border-slate-50 last:border-0">
              <td className="py-2.5">
                <div className="flex items-center gap-2">
                  <Icon type={r.icon} />
                  <span className="font-medium text-slate-700">{r.bookingId}</span>
                </div>
              </td>
              <td className="py-2.5 text-slate-600">{r.customer}</td>
              <td className="py-2.5 text-slate-600">{r.service}</td>
              <td className="py-2.5 text-slate-600">{r.date}</td>
              <td className="py-2.5">
                <StatusBadge status={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <PageHeader title="Dashboard" breadcrumb="Home / Dashboard" />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Today's Bookings" value={12} icon={<CalendarDays size={18} />} color="blue" />
        <StatCard title="Today's Visa Cases" value="08" icon={<FileText size={18} />} color="green" />
        <StatCard title="Hotel Check In" value="05" icon={<Hotel size={18} />} color="purple" />
        <StatCard title="Today's Transfers" value="07" icon={<Bus size={18} />} color="orange" />
        <StatCard
          title="Total Customers"
          value={customers.length.toLocaleString()}
          icon={<Users size={18} />}
          color="teal"
        />
        <StatCard
          title="Receivables"
          value={showFinancials ? formatPKR(receivables) : "••••"}
          icon={<Wallet size={18} />}
          color="red"
        />
      </div>

      <div className="mb-5">
        <Card title="Currency Converter (to PKR)">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 md:items-end">
            <Input
              label="Amount"
              type="number"
              min={0}
              step="0.01"
              value={convAmount}
              onChange={(e) => setConvAmount(e.target.value)}
            />
            <Select
              label="Currency"
              value={convCurrency}
              onChange={(e) => setConvCurrency(e.target.value as ForeignCurrency)}
            >
              {FOREIGN_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">Result in PKR</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{formatPKR(convPKR)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-blue-50 p-4">
              <p className="text-xs font-medium text-slate-500">Rate used</p>
              <p className="mt-1 text-sm font-semibold text-blue-700">
                1 {convCurrency} = PKR {convRate.toLocaleString("en-PK")}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-5 grid gap-4 xl:grid-cols-3">
        <Card title="Upcoming Bookings" className="xl:col-span-1">
          <BookingTable rows={upcoming.slice(0, 5)} />
        </Card>

        <div className="space-y-4">
          <Card title="Sales Overview (This Month)">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2.5">
                <span className="text-sm text-slate-600">Total Sales</span>
                <span className="font-bold text-blue-700">{formatPKR(totalSales || 1875000)}</span>
              </div>
              {showCost && (
                <div className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2.5">
                  <span className="text-sm text-slate-600">Total Cost</span>
                  <span className="font-bold text-rose-700">{formatPKR(totalCost || 1520000)}</span>
                </div>
              )}
              {showProfit && (
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2.5">
                  <span className="text-sm text-slate-600">Total Profit</span>
                  <span className="font-bold text-emerald-700">{formatPKR(totalProfit || 355000)}</span>
                </div>
              )}
              {!showFinancials && (
                <p className="text-xs text-slate-400">Cost & profit hidden for your role.</p>
              )}
            </div>
          </Card>
          <Card title="Top Services (By Sales)">
            <ServicesPieChart data={pieData} />
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Sales Chart (This Month)">
            <SalesLineChart showFinancials={showFinancials} />
          </Card>
          <Card title="Pending Payments">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500">
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Due</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPayments.map((p) => (
                    <tr key={p.id} className="border-b border-slate-50">
                      <td className="py-2">
                        <span
                          className={
                            p.type === "Customer"
                              ? "text-xs font-medium text-blue-600"
                              : "text-xs font-medium text-orange-600"
                          }
                        >
                          {p.type}
                        </span>
                      </td>
                      <td className="py-2 text-slate-700">{p.partyName}</td>
                      <td className="py-2 font-medium text-slate-800">
                        {showFinancials ? formatPKR(p.amountPKR) : "••••"}
                      </td>
                      <td className="py-2 text-slate-500">{p.dueDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {serviceCounts.map((s) => (
          <Link
            key={s.name}
            href={s.href}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div className={`mb-2 inline-flex rounded-lg p-2 ${s.color}`}>
              <ArrowRightLeft size={16} />
            </div>
            <p className="text-xs text-slate-500">{s.name}</p>
            <p className="text-xl font-bold text-slate-800">{String(s.count).padStart(2, "0")}</p>
            <p className="mt-1 text-[10px] font-medium text-blue-600">View all →</p>
          </Link>
        ))}
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        <Card title="Recent Bookings">
          <BookingTable rows={recent} />
        </Card>
        <Card title="Receivables / Payables Snapshot">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-rose-50 p-4">
              <p className="text-xs text-rose-600">Customer Outstanding</p>
              <p className="mt-1 text-lg font-bold text-rose-700">
                {showFinancials ? formatPKR(receivables) : "••••"}
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-xs text-amber-700">Supplier Outstanding</p>
              <p className="mt-1 text-lg font-bold text-amber-800">
                {showFinancials
                  ? formatPKR(suppliers.reduce((a, s) => a + s.outstanding, 0))
                  : "••••"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Total Bookings", value: upcoming.length + 240 },
          { label: "Completed Bookings", value: 156 },
          { label: "Cancelled Bookings", value: 22 },
          { label: "Refunded Bookings", value: 18 },
          { label: "Total Customers", value: customers.length },
          { label: "Total Suppliers", value: suppliers.length },
        ].map((x) => (
          <div key={x.label} className="text-center">
            <p className="text-lg font-bold text-slate-800">{x.value.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500">{x.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
