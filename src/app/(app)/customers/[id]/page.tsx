"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { formatDate, formatPKR } from "@/lib/format";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";

const tabs = ["Tickets", "Visas", "Hotels", "Umrah", "Transport", "Payments"] as const;

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const customers = useAppStore((s) => s.customers);
  const airTickets = useAppStore((s) => s.airTickets);
  const visas = useAppStore((s) => s.visas);
  const hotels = useAppStore((s) => s.hotels);
  const umrahPackages = useAppStore((s) => s.umrahPackages);
  const transports = useAppStore((s) => s.transports);
  const payments = useAppStore((s) => s.payments);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Tickets");

  const customer = customers.find((c) => c.id === id);

  const history = useMemo(() => {
    if (!customer) return null;
    return {
      Tickets: airTickets.filter((t) => t.customerId === customer.id),
      Visas: visas.filter((v) => v.customerId === customer.id),
      Hotels: hotels.filter((h) => h.customerId === customer.id),
      Umrah: umrahPackages.filter((u) => u.customerId === customer.id),
      Transport: transports.filter((t) => t.customerId === customer.id),
      Payments: payments.filter((p) => p.type === "Customer" && p.partyId === customer.id),
    };
  }, [customer, airTickets, visas, hotels, umrahPackages, transports, payments]);

  if (!customer) {
    return (
      <div>
        <PageHeader title="Customer Not Found" breadcrumb="Home / Customers" />
        <Card>
          <EmptyState message="This customer does not exist." />
          <Link href="/customers" className="mt-2 block text-center text-sm text-blue-600">
            Back to customers
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={customer.name} breadcrumb={`Home / Customers / ${customer.customerId}`} />

      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <Card title="Profile" className="lg:col-span-1">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Customer ID</dt>
              <dd className="font-medium text-slate-800">{customer.customerId}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Mobile</dt>
              <dd className="text-slate-700">{customer.mobile}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">CNIC</dt>
              <dd className="text-slate-700">{customer.cnic || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Passport</dt>
              <dd className="text-slate-700">{customer.passportNumber || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Email</dt>
              <dd className="text-slate-700">{customer.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Address</dt>
              <dd className="text-slate-700">{customer.address || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Outstanding</dt>
              <dd className="font-semibold text-rose-600">{formatPKR(customer.outstanding)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Joined</dt>
              <dd className="text-slate-700">{formatDate(customer.createdAt)}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Booking History" className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap gap-1 border-b border-slate-100 pb-2">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  tab === t ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "Tickets" && (
            <HistoryTable
              empty="No air tickets."
              rows={history!.Tickets.map((t) => [
                t.bookingId,
                t.sector,
                t.airline,
                formatDate(t.travelDate),
                formatPKR(t.salePrice),
                t.status,
              ])}
              headers={["Booking", "Sector", "Airline", "Travel", "Sale", "Status"]}
            />
          )}
          {tab === "Visas" && (
            <HistoryTable
              empty="No visa records."
              rows={history!.Visas.map((v) => [
                v.bookingId,
                v.visaType,
                formatDate(v.submissionDate),
                formatPKR(v.salePrice),
                v.status,
              ])}
              headers={["Booking", "Type", "Submitted", "Sale", "Status"]}
            />
          )}
          {tab === "Hotels" && (
            <HistoryTable
              empty="No hotel bookings."
              rows={history!.Hotels.map((h) => [
                h.bookingId,
                h.hotelName,
                h.city,
                formatDate(h.checkIn),
                formatPKR(h.salePrice),
                h.status,
              ])}
              headers={["Booking", "Hotel", "City", "Check-in", "Sale", "Status"]}
            />
          )}
          {tab === "Umrah" && (
            <HistoryTable
              empty="No Umrah packages."
              rows={history!.Umrah.map((u) => [
                u.bookingId,
                u.packageName,
                formatDate(u.travelDate),
                formatPKR(u.salePrice),
                u.status,
              ])}
              headers={["Booking", "Package", "Travel", "Sale", "Status"]}
            />
          )}
          {tab === "Transport" && (
            <HistoryTable
              empty="No transport bookings."
              rows={history!.Transport.map((t) => [
                t.bookingId,
                t.type,
                `${t.pickup} → ${t.dropoff}`,
                formatDate(t.date),
                formatPKR(t.salePrice),
                t.status,
              ])}
              headers={["Booking", "Type", "Route", "Date", "Sale", "Status"]}
            />
          )}
          {tab === "Payments" && (
            <HistoryTable
              empty="No payments."
              rows={history!.Payments.map((p) => [
                p.id,
                formatPKR(p.amountPKR),
                formatDate(p.dueDate),
                p.paidDate ? formatDate(p.paidDate) : "—",
                p.status,
              ])}
              headers={["ID", "Amount", "Due", "Paid", "Status"]}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

function HistoryTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: (string | number)[][];
  empty: string;
}) {
  if (rows.length === 0) return <EmptyState message={empty} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs text-slate-500">
            {headers.map((h) => (
              <th key={h} className="pb-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-50 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="py-2 text-slate-700">
                  {j === row.length - 1 && typeof cell === "string" && headers[headers.length - 1] === "Status" ? (
                    <StatusBadge status={String(cell)} />
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
