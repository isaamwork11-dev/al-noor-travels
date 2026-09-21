"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatDate, formatDateTime, formatPKR } from "@/lib/format";
import { Button, Card, ConfirmDialog, EmptyState, PageHeader, StatusBadge } from "@/components/ui";

export default function AirTicketsPage() {
  const user = useAppStore((s) => s.currentUser);
  const airTickets = useAppStore((s) => s.airTickets);
  const customers = useAppStore((s) => s.customers);
  const suppliers = useAppStore((s) => s.suppliers);
  const refunds = useAppStore((s) => s.refunds);
  const showCost = user?.role === "super_admin" || !!user?.permissions.viewCost;
  const showProfit = user?.role === "super_admin" || !!user?.permissions.viewProfit;
  const canCreate = user?.role === "super_admin" || !!user?.permissions.createRecords;
  const deleteTicket = useAppStore((s) => s.deleteTicket);
  const canEdit = user?.role === "super_admin" || !!user?.permissions.editRecords;
  const canDelete = user?.role === "super_admin" || !!user?.permissions.deleteRecords;
  const [confirmDelete, setConfirmDelete] = useState<(typeof airTickets)[number] | null>(null);

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name || "—";
  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.name || "—";

  const refundOf = (ticketId: string) => refunds.find((r) => r.referenceId === ticketId);

  return (
    <div>
      <PageHeader title="Air Tickets" breadcrumb="Home / Air Tickets" />
      <Card
        title="All Tickets"
        action={
          canCreate ? (
            <Link href="/air-tickets/new">
              <Button>
                <Plus size={16} /> Add Ticket
              </Button>
            </Link>
          ) : undefined
        }
      >
        {airTickets.length === 0 ? (
          <EmptyState message="No air tickets yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="pb-2 font-medium">Booking</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Passenger / PAX</th>
                  <th className="pb-2 font-medium">Airline</th>
                  <th className="pb-2 font-medium">PNR</th>
                  <th className="pb-2 font-medium">Sector</th>
                  <th className="pb-2 font-medium">Travel</th>
                  <th className="pb-2 font-medium">Supplier</th>
                  {showCost && <th className="pb-2 font-medium">Cost</th>}
                  <th className="pb-2 font-medium">Sale</th>
                  {showProfit && <th className="pb-2 font-medium">Profit</th>}
                  <th className="pb-2 font-medium">Refund</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Created</th>
                  <th className="pb-2 font-medium">Updated</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {airTickets.map((t) => {
                  const refund = refundOf(t.id);
                  return (
                  <tr key={t.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5">
                      <Link href={`/customers/${t.customerId}`} className="font-medium text-blue-700 hover:underline">
                        {t.bookingId}
                      </Link>
                    </td>
                    <td className="py-2.5">
                      <Link href={`/customers/${t.customerId}`} className="text-slate-800 hover:text-blue-600 hover:underline">
                        {customerName(t.customerId)}
                      </Link>
                    </td>
                    <td className="py-2.5 text-slate-800">
                      <div>{t.passengerNames?.length ? t.passengerNames.join(", ") : t.passengerName} ({t.pax || 1})</div>
                    </td>
                    <td className="py-2.5 text-slate-600">{t.airline}</td>
                    <td className="py-2.5 text-slate-600">{t.pnr}</td>
                    <td className="py-2.5 text-slate-600">{t.sector}</td>
                    <td className="py-2.5 text-slate-600">{formatDate(t.travelDate)}</td>
                    <td className="py-2.5 text-slate-600">{supplierName(t.supplierId)}</td>
                    {showCost && (
                      <td className="py-2.5 text-slate-700">
                        {formatPKR(t.costPrice)}
                      </td>
                    )}
                    <td className="py-2.5 font-medium text-slate-800">{formatPKR(t.salePrice)}</td>
                    {showProfit && (
                      <td className="py-2.5 font-medium text-emerald-700">{formatPKR(t.profit)}</td>
                    )}
                    <td className="py-2.5">
                      {refund ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                          Refunded · {formatPKR(refund.refundAmount)}
                        </span>
                      ) : t.refundable ? (
                        <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                          Refundable
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                          Non-refundable
                        </span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-2.5 text-xs text-slate-500">{formatDateTime(t.createdAt)}</td>
                    <td className="py-2.5 text-xs text-slate-500">{formatDateTime(t.updatedAt || t.createdAt)}</td>
                    <td className="py-2.5 whitespace-nowrap">
                      {canEdit && <Link href={`/air-tickets/new?edit=${t.id}`} className="mr-2 text-xs text-slate-600 hover:underline"><Pencil size={14} className="inline" /> Edit</Link>}
                      {canDelete && <button type="button" className="text-xs text-rose-600 hover:underline" onClick={() => setConfirmDelete(t)}><Trash2 size={14} className="inline" /> Delete</button>}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this air ticket?"
        message={`Are you sure you want to delete ${confirmDelete?.sector || "this air ticket"} — ${confirmDelete?.passengerName || ""} permanently? This cannot be undone.`}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) void deleteTicket(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}
