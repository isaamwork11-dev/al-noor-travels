"use client";

import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatDate, formatDateTime, formatPKR } from "@/lib/format";
import { Button, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";

export default function AirTicketsPage() {
  const user = useAppStore((s) => s.currentUser);
  const airTickets = useAppStore((s) => s.airTickets);
  const customers = useAppStore((s) => s.customers);
  const suppliers = useAppStore((s) => s.suppliers);
  const showCost = user?.role === "super_admin" || !!user?.permissions.viewCost;
  const showProfit = user?.role === "super_admin" || !!user?.permissions.viewProfit;
  const canCreate = user?.role === "super_admin" || !!user?.permissions.createRecords;
  const deleteTicket = useAppStore((s) => s.deleteTicket);
  const canEdit = user?.role === "super_admin" || !!user?.permissions.editRecords;
  const canDelete = user?.role === "super_admin" || !!user?.permissions.deleteRecords;

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name || "—";
  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.name || "—";

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
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="pb-2 font-medium">Booking</th>
                  <th className="pb-2 font-medium">Passengers / PAX</th>
                  <th className="pb-2 font-medium">Airline</th>
                  <th className="pb-2 font-medium">PNR</th>
                  <th className="pb-2 font-medium">Sector</th>
                  <th className="pb-2 font-medium">Travel</th>
                  <th className="pb-2 font-medium">Supplier</th>
                  {showCost && <th className="pb-2 font-medium">Cost</th>}
                  <th className="pb-2 font-medium">Sale</th>
                  {showProfit && <th className="pb-2 font-medium">Profit</th>}
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Created</th>
                  <th className="pb-2 font-medium">Updated</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {airTickets.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 font-medium text-blue-700">{t.bookingId}</td>
                    <td className="py-2.5 text-slate-800">
                      <div>{t.passengerNames?.length ? t.passengerNames.join(", ") : t.passengerName} ({t.pax || 1})</div>
                      <div className="text-xs text-slate-400">{customerName(t.customerId)}</div>
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
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-2.5 text-xs text-slate-500">{formatDateTime(t.createdAt)}</td>
                    <td className="py-2.5 text-xs text-slate-500">{formatDateTime(t.updatedAt || t.createdAt)}</td>
                    <td className="py-2.5 whitespace-nowrap">
                      {canEdit && <Link href={`/air-tickets/new?edit=${t.id}`} className="mr-2 text-xs text-slate-600 hover:underline"><Pencil size={14} className="inline" /> Edit</Link>}
                      {canDelete && <button type="button" className="text-xs text-rose-600 hover:underline" onClick={() => confirm("Delete this air ticket permanently?") && deleteTicket(t.id)}><Trash2 size={14} className="inline" /> Delete</button>}
                    </td>
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
