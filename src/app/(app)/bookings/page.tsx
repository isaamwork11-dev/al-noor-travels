"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatDate, formatDateTime, formatPKR } from "@/lib/format";
import { Button, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";

export default function BookingsPage() {
  const user = useAppStore((s) => s.currentUser);
  const bookings = useAppStore((s) => s.travelBookings);
  const customers = useAppStore((s) => s.customers);
  const canCreate = user?.role === "super_admin" || !!user?.permissions.createRecords;
  const showCost = user?.role === "super_admin" || !!user?.permissions.viewCost;
  const showProfit = user?.role === "super_admin" || !!user?.permissions.viewProfit;

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name || "—";

  return (
    <div>
      <PageHeader title="Travel Bookings" breadcrumb="Home / Bookings" />
      <Card
        title="All Bookings"
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
        {bookings.length === 0 ? (
          <EmptyState message="No multi-service bookings yet. Create one to bundle visa, hotel, transport and tickets." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="pb-2 font-medium">Booking</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Services</th>
                  <th className="pb-2 font-medium">Travel</th>
                  {showCost && <th className="pb-2 font-medium">Total Cost</th>}
                  <th className="pb-2 font-medium">Total Sale</th>
                  {showProfit && <th className="pb-2 font-medium">Profit</th>}
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Created</th>
                  <th className="pb-2 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5">
                      <Link href={`/bookings/${b.id}`} className="font-medium text-blue-600 hover:underline">
                        {b.bookingId}
                      </Link>
                      <p className="text-xs text-slate-500">{b.title || "—"}</p>
                    </td>
                    <td className="py-2.5 text-slate-700">{customerName(b.customerId)}</td>
                    <td className="py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {b.services.map((s) => (
                          <span
                            key={s.id}
                            className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-600"
                          >
                            {s.kind}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 text-slate-600">{formatDate(b.travelDate)}</td>
                    {showCost && (
                      <td className="py-2.5 text-slate-700">{formatPKR(b.totalCostPKR)}</td>
                    )}
                    <td className="py-2.5 font-medium text-slate-800">{formatPKR(b.totalSale)}</td>
                    {showProfit && (
                      <td className={`py-2.5 font-medium ${b.totalProfit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                        {formatPKR(b.totalProfit)}
                      </td>
                    )}
                    <td className="py-2.5">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="py-2.5 text-xs text-slate-500">{formatDateTime(b.createdAt)}</td>
                    <td className="py-2.5 text-xs text-slate-500">{formatDateTime(b.updatedAt)}</td>
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
