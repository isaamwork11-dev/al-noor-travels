"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatDate, formatDateTime, formatPKR, todayISO } from "@/lib/format";
import { bookingMoney } from "@/lib/accounting";
import { Button, Card, EmptyState, PageHeader, Select, StatusBadge } from "@/components/ui";

type Kind = "All" | "Ticket" | "Visa" | "Hotel" | "Transport" | "Umrah" | "Tour" | "Booking";

interface Row {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  entryDate: string;
  kind: string;
  particulars: string;
  passenger: string;
  travelLabel: string;
  returnLabel: string;
  amount: number;
  status: string;
  detailHref?: string;
}

export default function BookingsPage() {
  const user = useAppStore((s) => s.currentUser);
  const customers = useAppStore((s) => s.customers);
  const airTickets = useAppStore((s) => s.airTickets);
  const visas = useAppStore((s) => s.visas);
  const hotels = useAppStore((s) => s.hotels);
  const transports = useAppStore((s) => s.transports);
  const umrahPackages = useAppStore((s) => s.umrahPackages);
  const tourPackages = useAppStore((s) => s.tourPackages);
  const travelBookings = useAppStore((s) => s.travelBookings);
  const payments = useAppStore((s) => s.payments);
  const refunds = useAppStore((s) => s.refunds);

  const canCreate = user?.role === "super_admin" || !!user?.permissions.createRecords;

  const monthStart = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  };

  const [kind, setKind] = useState<Kind>("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(todayISO);

  const data = useMemo(
    () => ({
      customers,
      suppliers: [],
      airTickets,
      visas,
      hotels,
      transports,
      umrahPackages,
      tourPackages,
      travelBookings,
      payments,
      refunds,
    }),
    [customers, airTickets, visas, hotels, transports, umrahPackages, tourPackages, travelBookings, payments, refunds]
  );

  const rows: Row[] = useMemo(() => {
    const customerName = (id: string) => customers.find((c) => c.id === id)?.name || "—";
    const list: Row[] = [
      ...airTickets.map((t) => ({
        id: t.id,
        bookingId: t.bookingId,
        customerId: t.customerId,
        customerName: customerName(t.customerId),
        entryDate: t.createdAt,
        kind: "Ticket",
        particulars: `Air Ticket — ${t.sector}`,
        passenger: t.passengerName,
        travelLabel: formatDate(t.travelDate),
        returnLabel: t.tripType === "Return" && t.returnDate ? formatDate(t.returnDate) : "—",
        amount: t.totalAmount || t.salePrice,
        status: t.status,
      })),
      ...visas.map((v) => ({
        id: v.id,
        bookingId: v.bookingId,
        customerId: v.customerId,
        customerName: customerName(v.customerId),
        entryDate: v.createdAt,
        kind: "Visa",
        particulars: v.visaType,
        passenger: "—",
        travelLabel: formatDate(v.submissionDate),
        returnLabel: v.approvalDate ? formatDate(v.approvalDate) : "—",
        amount: v.salePrice,
        status: v.status,
      })),
      ...hotels.map((h) => ({
        id: h.id,
        bookingId: h.bookingId,
        customerId: h.customerId,
        customerName: customerName(h.customerId),
        entryDate: h.createdAt,
        kind: "Hotel",
        particulars: `${h.hotelName} — ${h.city}`,
        passenger: "—",
        travelLabel: formatDate(h.checkIn),
        returnLabel: formatDate(h.checkOut),
        amount: h.salePrice,
        status: h.status,
      })),
      ...transports.map((t) => ({
        id: t.id,
        bookingId: t.bookingId,
        customerId: t.customerId,
        customerName: customerName(t.customerId),
        entryDate: t.createdAt,
        kind: "Transport",
        particulars: `${t.type} — ${t.pickup} → ${t.dropoff}`,
        passenger: "—",
        travelLabel: formatDate(t.date),
        returnLabel: "—",
        amount: t.salePrice,
        status: t.status,
      })),
      ...umrahPackages.map((u) => ({
        id: u.id,
        bookingId: u.bookingId,
        customerId: u.customerId,
        customerName: customerName(u.customerId),
        entryDate: u.createdAt,
        kind: "Umrah",
        particulars: u.packageName,
        passenger: "—",
        travelLabel: formatDate(u.travelDate),
        returnLabel: formatDate(u.returnDate),
        amount: u.salePrice,
        status: u.status,
      })),
      ...tourPackages.map((t) => ({
        id: t.id,
        bookingId: t.bookingId,
        customerId: t.customerId,
        customerName: customerName(t.customerId),
        entryDate: t.createdAt,
        kind: "Tour",
        particulars: t.packageName,
        passenger: "—",
        travelLabel: formatDate(t.travelDate),
        returnLabel: formatDate(t.returnDate),
        amount: t.salePrice,
        status: t.status,
      })),
      ...travelBookings.map((b) => ({
        id: b.id,
        bookingId: b.bookingId,
        customerId: b.customerId,
        customerName: customerName(b.customerId),
        entryDate: b.createdAt,
        kind: "Booking",
        particulars: b.title || "Travel Booking",
        passenger: "—",
        travelLabel: formatDate(b.travelDate),
        returnLabel: formatDate(b.returnDate),
        amount: b.totalSale,
        status: b.status,
        detailHref: `/bookings/${b.id}`,
      })),
    ];

    const inRange = (d: string) => {
      if (!from && !to) return true;
      if (from && d < from) return false;
      if (to && d > to + "T23:59:59.999") return false;
      return true;
    };

    return list
      .filter((r) => inRange(r.entryDate))
      .filter((r) => kind === "All" || r.kind === kind)
      .sort((a, b) => b.entryDate.localeCompare(a.entryDate));
  }, [airTickets, customers, visas, hotels, transports, umrahPackages, tourPackages, travelBookings, kind, from, to]);

  const money = (bookingId: string) => bookingMoney(bookingId, data);

  return (
    <div>
      <PageHeader title="All Bookings (Date-wise)" breadcrumb="Home / Bookings" />
      <Card
        title="All Entries — Tickets · Visas · Hotels · Transport · Umrah · Tours"
        action={
          canCreate ? (
            <Link href="/bookings/new">
              <Button>
                <Plus size={16} /> New Booking
              </Button>
            </Link>
          ) : undefined
        }
      >
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="Type" value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
            <option value="All">All Types</option>
            <option value="Ticket">Air Ticket</option>
            <option value="Visa">Visa</option>
            <option value="Hotel">Hotel</option>
            <option value="Transport">Transport</option>
            <option value="Umrah">Umrah</option>
            <option value="Tour">Tour</option>
            <option value="Booking">Travel Booking</option>
          </Select>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-600">From Date</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-600">To Date</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <div className="flex items-end gap-2">
            <Button variant="secondary" className="!py-2 text-xs" onClick={() => { setFrom(monthStart()); setTo(todayISO); }}>
              This Month
            </Button>
            <Button variant="secondary" className="!py-2 text-xs" onClick={() => { setFrom(""); setTo(""); }}>
              Show All
            </Button>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState message="No bookings in this period. Adjust the date range or create a new booking." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="pb-2 font-medium">Date of Entry</th>
                  <th className="pb-2 font-medium">Booking No</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Passenger / Guest</th>
                  <th className="pb-2 font-medium">Travel / Check-in</th>
                  <th className="pb-2 font-medium">Return / Check-out</th>
                  <th className="pb-2 font-medium">Particulars</th>
                  <th className="pb-2 font-medium">Total</th>
                  <th className="pb-2 font-medium">Received</th>
                  <th className="pb-2 font-medium">Balance</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const m = money(r.bookingId);
                  const cell = r.detailHref ? (
                    <Link href={r.detailHref} className="font-medium text-blue-600 hover:underline">
                      {r.bookingId}
                    </Link>
                  ) : (
                    <span className="font-medium text-blue-700">{r.bookingId}</span>
                  );
                  return (
                    <tr key={r.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 text-slate-600">{formatDate(r.entryDate)}</td>
                      <td className="py-2.5">{cell}</td>
                      <td className="py-2.5">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-600">
                          {r.kind}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-600">{r.customerName}</td>
                      <td className="py-2.5 text-slate-600">{r.passenger}</td>
                      <td className="py-2.5 text-slate-600">{r.travelLabel}</td>
                      <td className="py-2.5 text-slate-600">{r.returnLabel}</td>
                      <td className="py-2.5 text-slate-700">{r.particulars}</td>
                      <td className="py-2.5 font-medium text-slate-800">{formatPKR(r.amount)}</td>
                      <td className="py-2.5 font-medium text-emerald-700">{formatPKR(m.received)}</td>
                      <td className={`py-2.5 font-medium ${m.balance > 0 ? "text-rose-600" : "text-slate-500"}`}>
                        {formatPKR(m.balance)}
                      </td>
                      <td className="py-2.5">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-2.5 text-xs text-slate-400">{formatDateTime(r.entryDate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}