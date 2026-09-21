"use client";

import { FormEvent, useMemo, useState } from "react";
import { FileDown, Plus, Trash2, Pencil } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatDate, formatDateTime, formatPKR, todayISO } from "@/lib/format";
import { exportCSV } from "@/lib/csv";
import type { Payment, PaymentMethod } from "@/lib/types";
import { Button, Card, ConfirmDialog, EmptyState, Input, Modal, PageHeader, Select, StatusBadge } from "@/components/ui";

export default function PaymentsPage() {
  const user = useAppStore((s) => s.currentUser);
  const customers = useAppStore((s) => s.customers);
  const suppliers = useAppStore((s) => s.suppliers);
  const payments = useAppStore((s) => s.payments);
  const addPayment = useAppStore((s) => s.addPayment);
  const updatePayment = useAppStore((s) => s.updatePayment);
  const deletePayment = useAppStore((s) => s.deletePayment);

  const canView = user?.role === "super_admin" || !!user?.permissions.viewAccounts;
  const canCreate = user?.role === "super_admin" || !!user?.permissions.createRecords;
  const canDelete = user?.role === "super_admin" || !!user?.permissions.deleteRecords;

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Payment | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(todayISO);

  const [form, setForm] = useState({
    date: todayISO(),
    type: "Customer" as "Customer" | "Supplier",
    partyId: "",
    direction: "out" as "out" | "in",
    amount: 0,
    method: "Cash" as PaymentMethod | "",
    status: "Paid" as "Pending" | "Paid" | "Partial",
    note: "",
  });

  const visible = useMemo(
    () =>
      [...payments]
        .filter((p) => {
          const d = p.paidDate || p.createdAt;
          if (from && d < from) return false;
          if (to && d > to + "T23:59:59.999") return false;
          return true;
        })
        .sort((a, b) => (b.paidDate || b.createdAt).localeCompare(a.paidDate || a.createdAt))
        .slice(0, 100),
    [payments, from, to]
  );

  if (!canView) {
    return (
      <div>
        <PageHeader title="Payment Entry" breadcrumb="Home / Accounts / Payment Entry" />
        <Card>
          <EmptyState message="You do not have permission to view accounts." />
        </Card>
      </div>
    );
  }

  const parties = form.type === "Customer" ? customers : suppliers;

  const moneyIn = (p: Payment) =>
    p.type === "Customer" ? true : p.direction === "in";

  const totals = visible.reduce(
    (acc, p) => {
      if (p.status === "Pending" || p.status === "Partial") return acc;
      if (moneyIn(p)) acc.received += p.amountPKR;
      else acc.paid += p.amountPKR;
      return acc;
    },
    { received: 0, paid: 0 }
  );

  const openNew = () => {
    setEditing(null);
    setForm({
      date: todayISO(),
      type: "Customer",
      partyId: "",
      direction: "out",
      amount: 0,
      method: "Cash",
      status: "Paid",
      note: "",
    });
    setOpen(true);
  };

  const openEdit = (p: Payment) => {
    setEditing(p);
    setForm({
      date: p.paidDate || todayISO(),
      type: p.type,
      partyId: p.partyId,
      direction: p.direction || (p.type === "Supplier" ? "out" : "out"),
      amount: p.amountPKR,
      method: p.method || "Cash",
      status: p.status,
      note: p.note || "",
    });
    setOpen(true);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const party = parties.find((item) => item.id === form.partyId);
    if (!party || form.amount <= 0) return;
    setSaving(true);
    const amount = Number(form.amount);
    const direction = form.type === "Customer" ? "in" : form.direction;
    const payload = {
      type: form.type,
      partyId: party.id,
      partyName: party.name,
      direction,
      amount,
      currency: "PKR" as const,
      amountPKR: amount,
      dueDate: form.date,
      paidDate: form.status === "Pending" ? "" : form.date,
      status: form.status,
      method: form.method || "Other",
      note: form.note,
    };
    try {
      if (editing) await updatePayment(editing.id, payload);
      else await addPayment(payload);
      setOpen(false);
      setSaving(false);
      setEditing(null);
    } catch {
      setSaving(false);
    }
  };

  const downloadCSV = () => {
    exportCSV(
      `payments-${from || "all"}-${to || "today"}.csv`,
      ["Date", "Type", "Party", "In / Out", "Amount (PKR)", "Method", "Status", "Note"],
      visible.map((p) => [
        formatDate(p.paidDate || p.createdAt),
        p.type,
        p.partyName,
        moneyIn(p) ? "In" : "Out",
        p.amountPKR,
        p.method || "",
        p.status,
        p.note || "",
      ])
    );
  };

  return (
    <div>
      <PageHeader title="Payment Entry" breadcrumb="Home / Accounts / Payment Entry" />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs text-slate-500">Money In (Clients + Vendors)</p>
          <p className="mt-1 text-lg font-bold text-emerald-700">{formatPKR(totals.received)}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <p className="text-xs text-slate-500">Money Out (Paid to Vendors / Clients)</p>
          <p className="mt-1 text-lg font-bold text-rose-700">{formatPKR(totals.paid)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Net (Date-wise Hisaab)</p>
          <p className="mt-1 text-lg font-bold text-slate-800">{formatPKR(totals.received - totals.paid)}</p>
        </div>
      </div>

      <Card
        title="Transactions"
        action={
          canCreate ? (
            <Button onClick={openNew}>
              <Plus size={16} /> New Payment
            </Button>
          ) : undefined
        }
      >
        <div className="mb-4 flex flex-wrap items-end gap-2">
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
          <Button variant="secondary" className="!py-2 text-xs" onClick={downloadCSV}>
            <FileDown size={14} /> Excel (CSV)
          </Button>
        </div>

        {visible.length === 0 ? (
          <EmptyState message="No payments in this period. Add one using the New Payment button." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Party</th>
                  <th className="pb-2 font-medium">In / Out</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Method</th>
                  <th className="pb-2 font-medium">Note</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Entered</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => {
                  const incoming = moneyIn(p);
                  return (
                    <tr key={p.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 text-slate-600">{formatDate(p.paidDate || p.createdAt)}</td>
                      <td className="py-2.5 text-slate-600">{p.type}</td>
                      <td className="py-2.5 font-medium text-slate-800">{p.partyName}</td>
                      <td className="py-2.5">
                        <span
                          className={
                            incoming
                              ? "rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700"
                              : "rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700"
                          }
                        >
                          {incoming ? "In" : "Out"}
                        </span>
                      </td>
                      <td className={`py-2.5 font-medium ${incoming ? "text-emerald-700" : "text-rose-700"}`}>
                        {formatPKR(p.amountPKR)}
                      </td>
                      <td className="py-2.5 text-slate-600">{p.method || "—"}</td>
                      <td className="py-2.5 text-slate-600">{p.note || "—"}</td>
                      <td className="py-2.5">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="py-2.5 text-xs text-slate-500">{formatDateTime(p.createdAt)}</td>
                      <td className="py-2.5 whitespace-nowrap">
                        {canDelete && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 hover:underline"
                              onClick={() => openEdit(p)}
                            >
                              <Pencil size={12} /> Edit
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:underline"
                              onClick={() => setConfirmDelete(p)}
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Payment / Receipt" : "New Payment / Receipt"}>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Account Type"
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value as "Customer" | "Supplier", partyId: "", direction: "out" })
            }
          >
            <option value="Customer">Client / Customer</option>
            <option value="Supplier">Vendor / Supplier</option>
          </Select>
          <Select
            label={form.type === "Customer" ? "Client" : "Vendor"}
            required
            value={form.partyId}
            onChange={(e) => setForm({ ...form, partyId: e.target.value })}
          >
            <option value="">Select account</option>
            {parties.map((party) => (
              <option key={party.id} value={party.id}>
                {party.name}
              </option>
            ))}
          </Select>

          {form.type === "Supplier" ? (
            <div className="sm:col-span-2">
              <Select
                label="Direction — some vendors give AND take money (len-den)"
                value={form.direction}
                onChange={(e) => setForm({ ...form, direction: e.target.value as "out" | "in" })}
              >
                <option value="out">We paid the vendor (vendor took money from us)</option>
                <option value="in">Vendor gave us money (we took money from vendor)</option>
              </Select>
              <p className="mt-1 text-[11px] text-slate-400">
                Record both sides — the vendor&apos;s ledger will show the full khatta automatically.
              </p>
            </div>
          ) : (
            <div className="flex items-end pb-1 text-xs text-slate-500 sm:col-span-2">
              Client is paying us — money comes IN to us.
            </div>
          )}

          <Input
            label="Amount (PKR)"
            type="number"
            min={1}
            required
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as "Pending" | "Paid" | "Partial" })}
          >
            <option value="Paid">Full Payment (Paid)</option>
            <option value="Partial">Partial / Installment</option>
            <option value="Pending">Pending</option>
          </Select>
          <Select
            label="Payment Method"
            value={form.method}
            onChange={(e) => setForm({ ...form, method: e.target.value as PaymentMethod | "" })}
          >
            <option value="Cash">Cash</option>
            <option value="Bank">Bank Transfer</option>
            <option value="Card">Card</option>
            <option value="Cheque">Cheque</option>
            <option value="Other">Other</option>
          </Select>
          <Input
            label="Date"
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <Input
            label="Note"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Save Entry"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this payment?"
        message={`Delete this ${confirmDelete?.partyName || ""} entry of ${confirmDelete ? formatPKR(confirmDelete.amountPKR) : ""}? This cannot be undone.`}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) void deletePayment(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}