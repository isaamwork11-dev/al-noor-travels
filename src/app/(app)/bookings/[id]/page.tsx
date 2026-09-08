"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { formatDate, formatDateTime, formatPKR } from "@/lib/format";
import { Button, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";

export default function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const user = useAppStore((s) => s.currentUser);
  const booking = useAppStore((s) => s.travelBookings.find((b) => b.id === id));
  const customers = useAppStore((s) => s.customers);
  const suppliers = useAppStore((s) => s.suppliers);
  const deleteTravelBooking = useAppStore((s) => s.deleteTravelBooking);

  const showCost = user?.role === "super_admin" || !!user?.permissions.viewCost;
  const showProfit = user?.role === "super_admin" || !!user?.permissions.viewProfit;
  const canDelete = user?.role === "super_admin" || !!user?.permissions.deleteRecords;
  const [deleting, setDeleting] = useState(false);

  if (!booking) {
    return (
      <div>
        <PageHeader title="Booking" breadcrumb="Home / Bookings" />
        <Card>
          <EmptyState message="Booking not found." />
        </Card>
      </div>
    );
  }

  const customer = customers.find((c) => c.id === booking.customerId);
  const supplierName = (sid: string) =>
    suppliers.find((s) => s.id === sid)?.name || "—";

  const onDelete = async () => {
    if (!confirm("Delete this booking permanently?")) return;
    setDeleting(true);
    try {
      await deleteTravelBooking(booking.id);
      router.push("/bookings");
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={booking.bookingId}
        breadcrumb="Home / Bookings / Detail"
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            {booking.title || "Travel Booking"}
          </h2>
          <p className="text-sm text-slate-500">
            Customer: {customer?.name || "—"} · Travel {formatDate(booking.travelDate)}
            {booking.returnDate ? ` → ${formatDate(booking.returnDate)}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={booking.status} />
          <Link href="/bookings">
            <Button variant="secondary">Back</Button>
          </Link>
          {canDelete && (
            <Button variant="danger" onClick={onDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Created</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {formatDateTime(booking.createdAt)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Last Updated</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {formatDateTime(booking.updatedAt)}
          </p>
        </div>
        {showCost && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Total Cost</p>
            <p className="mt-1 text-lg font-bold">{formatPKR(booking.totalCostPKR)}</p>
          </div>
        )}
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs text-slate-500">Total Sale</p>
          <p className="mt-1 text-lg font-bold text-blue-800">
            {formatPKR(booking.totalSale)}
          </p>
        </div>
        {showProfit && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 sm:col-span-2 lg:col-span-1">
            <p className="text-xs text-slate-500">Overall Profit</p>
            <p
              className={`mt-1 text-lg font-bold ${
                booking.totalProfit >= 0 ? "text-emerald-700" : "text-rose-600"
              }`}
            >
              {formatPKR(booking.totalProfit)}
            </p>
          </div>
        )}
      </div>

      {booking.notes && (
        <Card title="Notes" className="mb-4">
          <p className="text-sm text-slate-600">{booking.notes}</p>
        </Card>
      )}

      <div className="space-y-4">
        {booking.services.map((svc) => (
          <Card key={svc.id} title={`${svc.kind.toUpperCase()} — ${svc.title}`}>
            {svc.kind !== "ticket" && (
              <div className="mb-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <p>
                  <span className="text-slate-500">Vendor:</span>{" "}
                  {supplierName(svc.supplierId)}
                </p>
                {Object.entries(svc.details || {}).map(([k, v]) =>
                  v ? (
                    <p key={k}>
                      <span className="text-slate-500 capitalize">{k}:</span> {v}
                    </p>
                  ) : null
                )}
                {showCost && (
                  <>
                    <p>
                      <span className="text-slate-500">Cost SAR:</span> {svc.costSAR}
                    </p>
                    <p>
                      <span className="text-slate-500">Rate:</span> {svc.exchangeRate}
                    </p>
                    <p>
                      <span className="text-slate-500">Cost PKR:</span>{" "}
                      {formatPKR(svc.costPKR)}
                    </p>
                  </>
                )}
                <p>
                  <span className="text-slate-500">Sale:</span> {formatPKR(svc.salePrice)}
                </p>
                {showProfit && (
                  <p className={svc.profit >= 0 ? "text-emerald-700" : "text-rose-600"}>
                    <span className="text-slate-500">Profit:</span> {formatPKR(svc.profit)}
                  </p>
                )}
              </div>
            )}

            {svc.kind === "ticket" && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-500">
                      <th className="pb-2 font-medium">Passenger</th>
                      <th className="pb-2 font-medium">Vendor</th>
                      <th className="pb-2 font-medium">Flight</th>
                      <th className="pb-2 font-medium">PAX</th>
                      {showCost && <th className="pb-2 font-medium">Cost PKR</th>}
                      <th className="pb-2 font-medium">Sale</th>
                      {showProfit && <th className="pb-2 font-medium">Profit</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(svc.tickets ?? []).map((tk) => (
                      <tr key={tk.id} className="border-b border-slate-50">
                        <td className="py-2 font-medium">{tk.passengerName}</td>
                        <td className="py-2">{supplierName(tk.supplierId)}</td>
                        <td className="py-2 text-slate-600">
                          {tk.airline} · {tk.sector} · {tk.pnr}
                        </td>
                        <td className="py-2">1</td>
                        {showCost && <td className="py-2">{formatPKR(tk.costPKR)}</td>}
                        <td className="py-2">{formatPKR(tk.salePrice)}</td>
                        {showProfit && (
                          <td
                            className={`py-2 ${
                              tk.profit >= 0 ? "text-emerald-700" : "text-rose-600"
                            }`}
                          >
                            {formatPKR(tk.profit)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600">
                  {showCost && <span>Group cost: {formatPKR(svc.costPKR)}</span>}
                  <span>Group sale: {formatPKR(svc.salePrice)}</span>
                  {showProfit && (
                    <span className={svc.profit >= 0 ? "text-emerald-700" : "text-rose-600"}>
                      Group profit: {formatPKR(svc.profit)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
