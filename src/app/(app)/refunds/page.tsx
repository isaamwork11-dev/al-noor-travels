"use client";

import { FormEvent, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatDate, formatPKR } from "@/lib/format";
import type { ServiceType } from "@/lib/types";
import { Button, Card, EmptyState, Input, Modal, PageHeader, Select, StatusBadge } from "@/components/ui";

export default function RefundsPage() {
  const user = useAppStore((s) => s.currentUser);
  const refunds = useAppStore((s) => s.refunds);
  const airTickets = useAppStore((s) => s.airTickets);
  const customers = useAppStore((s) => s.customers);
  const addRefund = useAppStore((s) => s.addRefund);
  const deleteRefund = useAppStore((s) => s.deleteRefund);
  const canCreate =
    user?.role === "super_admin" || !!user?.permissions.createRecords;
  const canDelete = user?.role === "super_admin" || !!user?.permissions.deleteRecords;

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ticketId, setTicketId] = useState(airTickets[0]?.id || "");
  const [form, setForm] = useState({
    serviceType: "air_ticket" as ServiceType,
    refundType: "Full" as "Full" | "Partial" | "Used + Refunded",
    airlineCharges: 0,
    serviceCharges: 0,
    status: "Pending" as "Pending" | "Processed",
  });

  const selected = airTickets.find((t) => t.id === ticketId);
  const customerName =
    customers.find((c) => c.id === selected?.customerId)?.name || selected?.passengerName || "";

  const refundAmount = selected
    ? Math.max(0, selected.salePrice - Number(form.airlineCharges) - Number(form.serviceCharges))
    : 0;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!user || !selected) return;
    setSaving(true);
    await addRefund({
      serviceType: form.serviceType,
      referenceId: selected.id,
      bookingId: selected.bookingId,
      customerName,
      refundType: form.refundType,
      originalAmount: selected.salePrice,
      airlineCharges: Number(form.airlineCharges),
      serviceCharges: Number(form.serviceCharges),
      refundAmount,
      status: form.status,
      createdBy: user.id,
    });
    setOpen(false);
    setSaving(false);
  };

  return (
    <div>
      <PageHeader title="Refunds & Cancellations" breadcrumb="Home / Refunds" />
      <Card
        title="All Refunds"
        action={
          canCreate ? (
            <Button onClick={() => setOpen(true)}>
              <Plus size={16} /> Add Refund
            </Button>
          ) : undefined
        }
      >
        {refunds.length === 0 ? (
          <EmptyState message="No refunds yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="pb-2 font-medium">Booking</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Original</th>
                  <th className="pb-2 font-medium">Charges</th>
                  <th className="pb-2 font-medium">Refund</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Action</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 font-medium text-blue-700">{r.bookingId}</td>
                    <td className="py-2.5 text-slate-800">{r.customerName}</td>
                    <td className="py-2.5 text-slate-600">{r.refundType}</td>
                    <td className="py-2.5">{formatPKR(r.originalAmount)}</td>
                    <td className="py-2.5 text-slate-600">
                      {formatPKR(r.airlineCharges + r.serviceCharges)}
                    </td>
                    <td className="py-2.5 font-medium text-rose-700">{formatPKR(r.refundAmount)}</td>
                    <td className="py-2.5">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-2.5">
                      {canDelete && <button type="button" className="text-xs text-rose-600 hover:underline" onClick={() => confirm("Delete this refund permanently?") && deleteRefund(r.id)}><Trash2 size={14} className="inline" /> Delete</button>}
                    </td>
                    <td className="py-2.5 text-slate-500">{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Refund" wide>
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Air Ticket Booking"
            required
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
          >
            {airTickets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.bookingId} — {t.passengerName} ({formatPKR(t.salePrice)})
              </option>
            ))}
          </Select>
          <Select
            label="Refund Type"
            value={form.refundType}
            onChange={(e) =>
              setForm({ ...form, refundType: e.target.value as typeof form.refundType })
            }
          >
            <option value="Full">Full</option>
            <option value="Partial">Partial</option>
            <option value="Used + Refunded">Used + Refunded</option>
          </Select>
          <Input
            label="Airline Charges"
            type="number"
            min={0}
            value={form.airlineCharges}
            onChange={(e) => setForm({ ...form, airlineCharges: Number(e.target.value) })}
          />
          <Input
            label="Service Charges"
            type="number"
            min={0}
            value={form.serviceCharges}
            onChange={(e) => setForm({ ...form, serviceCharges: Number(e.target.value) })}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as "Pending" | "Processed" })}
          >
            <option value="Pending">Pending</option>
            <option value="Processed">Processed</option>
          </Select>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Refund amount: <span className="font-bold text-rose-700">{formatPKR(refundAmount)}</span>
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selected || saving}>
              {saving ? "Saving..." : "Save Refund"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
