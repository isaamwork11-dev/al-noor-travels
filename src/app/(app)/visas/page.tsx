"use client";

import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatDate, formatDateTime, formatPKR } from "@/lib/format";
import { Button, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";

export default function VisasPage() {
  const user = useAppStore((s) => s.currentUser);
  const visas = useAppStore((s) => s.visas);
  const customers = useAppStore((s) => s.customers);
  const showCost = user?.role === "super_admin" || !!user?.permissions.viewCost;
  const showProfit = user?.role === "super_admin" || !!user?.permissions.viewProfit;
  const canCreate = user?.role === "super_admin" || !!user?.permissions.createRecords;
  const deleteVisa = useAppStore((s) => s.deleteVisa);
  const canEdit = user?.role === "super_admin" || !!user?.permissions.editRecords;
  const canDelete = user?.role === "super_admin" || !!user?.permissions.deleteRecords;
  const customerName = (id: string) => customers.find((c) => c.id === id)?.name || "—";

  return (
    <div>
      <PageHeader title="Visa Management" breadcrumb="Home / Visas" />
      <Card
        title="All Visas"
        action={
          canCreate ? (
            <Link href="/visas/new">
              <Button>
                <Plus size={16} /> Add Visa
              </Button>
            </Link>
          ) : undefined
        }
      >
        {visas.length === 0 ? (
          <EmptyState message="No visa records yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="pb-2 font-medium">Booking</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Passport</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Submitted</th>
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
                {visas.map((v) => (
                  <tr key={v.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 font-medium text-blue-700">{v.bookingId}</td>
                    <td className="py-2.5 text-slate-800">{customerName(v.customerId)}</td>
                    <td className="py-2.5 text-slate-600">{v.passportNo}</td>
                    <td className="py-2.5 text-slate-600">{v.visaType}</td>
                    <td className="py-2.5 text-slate-600">{formatDate(v.submissionDate)}</td>
                    {showCost && <td className="py-2.5">{formatPKR(v.costPrice)}</td>}
                    <td className="py-2.5 font-medium">{formatPKR(v.salePrice)}</td>
                    {showProfit && (
                      <td className="py-2.5 font-medium text-emerald-700">{formatPKR(v.profit)}</td>
                    )}
                    <td className="py-2.5">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="py-2.5 text-xs text-slate-500">{formatDateTime(v.createdAt)}</td>
                    <td className="py-2.5 text-xs text-slate-500">{formatDateTime(v.updatedAt || v.createdAt)}</td>
                    <td className="py-2.5 whitespace-nowrap">
                      {canEdit && <Link href={`/visas/new?edit=${v.id}`} className="mr-2 text-xs text-slate-600 hover:underline"><Pencil size={14} className="inline" /> Edit</Link>}
                      {canDelete && <button type="button" className="text-xs text-rose-600 hover:underline" onClick={() => confirm("Delete this visa permanently?") && deleteVisa(v.id)}><Trash2 size={14} className="inline" /> Delete</button>}
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
