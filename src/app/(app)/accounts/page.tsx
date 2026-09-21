"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatDate, formatPKR, todayISO } from "@/lib/format";
import { monthlySummary, partyBalance, totalPayables, totalReceivables } from "@/lib/accounting";
import { Button, Card, ConfirmDialog, EmptyState, Input, Modal, PageHeader, Select, StatusBadge } from "@/components/ui";
import type { Payment, PaymentMethod } from "@/lib/types";

export default function AccountsPage() {
  const user = useAppStore((s) => s.currentUser);
  const users = useAppStore((s) => s.users);
  const customers = useAppStore((s) => s.customers);
  const suppliers = useAppStore((s) => s.suppliers);
  const payments = useAppStore((s) => s.payments);
  const refunds = useAppStore((s) => s.refunds);
  const markPaymentPaid = useAppStore((s) => s.markPaymentPaid);
  const addPayment = useAppStore((s) => s.addPayment);
  const updatePayment = useAppStore((s) => s.updatePayment);
  const deletePayment = useAppStore((s) => s.deletePayment);
  const canDelete = user?.role === "super_admin" || !!user?.permissions.deleteRecords;
  const airTickets = useAppStore((s) => s.airTickets);
  const visas = useAppStore((s) => s.visas);
  const hotels = useAppStore((s) => s.hotels);
  const transports = useAppStore((s) => s.transports);
  const umrahPackages = useAppStore((s) => s.umrahPackages);
  const tourPackages = useAppStore((s) => s.tourPackages);
  const travelBookings = useAppStore((s) => s.travelBookings);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [confirmDeletePayment, setConfirmDeletePayment] = useState<Payment | null>(null);
  const [form, setForm] = useState({
    type: "Customer" as "Customer" | "Supplier",
    partyId: "",
    bookingId: "",
    direction: "out" as "out" | "in",
    amount: 0,
    status: "Paid" as "Pending" | "Paid" | "Partial",
    method: "" as PaymentMethod | "",
    dueDate: todayISO(),
    paidDate: todayISO(),
    note: "",
  });
  const [paymentFilter, setPaymentFilter] = useState<"Pending" | "All">("Pending");

  const monthStart = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  };
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(todayISO);

  const canView =
    user?.role === "super_admin" || !!user?.permissions.viewAccounts;

  const data = useMemo(
    () => ({
      customers,
      suppliers,
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
    [customers, suppliers, airTickets, visas, hotels, transports, umrahPackages, tourPackages, travelBookings, payments, refunds]
  );

  const summary = useMemo(() => monthlySummary(from, to, data), [from, to, data]);

  const visiblePayments = useMemo(
    () =>
      [...payments]
        .filter((p) => (paymentFilter === "All" ? true : p.status !== "Paid"))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [payments, paymentFilter]
  );

  interface BookingOption {
    bookingId: string;
    partyId: string;
    label: string;
  }
  const bookingRecords = useMemo<BookingOption[]>(
    () => {
      const rows: BookingOption[] = [];
      const push = (b: BookingOption) => rows.push(b);
      for (const t of airTickets)
        push({ bookingId: t.bookingId, partyId: t.customerId, label: `Ticket · ${formatDate(t.travelDate)} · ${formatPKR(t.totalAmount || t.salePrice)}` });
      for (const v of visas)
        push({ bookingId: v.bookingId, partyId: v.customerId, label: `Visa · ${formatDate(v.submissionDate)} · ${formatPKR(v.salePrice)}` });
      for (const h of hotels)
        push({ bookingId: h.bookingId, partyId: h.customerId, label: `Hotel · ${formatDate(h.checkIn)} · ${formatPKR(h.salePrice)}` });
      for (const t of transports)
        push({ bookingId: t.bookingId, partyId: t.customerId, label: `Transport · ${formatDate(t.date)} · ${formatPKR(t.salePrice)}` });
      for (const u of umrahPackages)
        push({ bookingId: u.bookingId, partyId: u.customerId, label: `Umrah · ${formatDate(u.travelDate)} · ${formatPKR(u.salePrice)}` });
      for (const t of tourPackages)
        push({ bookingId: t.bookingId, partyId: t.customerId, label: `Tour · ${formatDate(t.travelDate)} · ${formatPKR(t.salePrice)}` });
      for (const t of travelBookings)
        push({ bookingId: t.bookingId, partyId: t.customerId, label: `Booking · ${formatDate(t.travelDate)} · ${formatPKR(t.totalSale)}` });
      const seen = new Set<string>();
      return rows.filter((r) => {
        if (seen.has(r.bookingId)) return false;
        seen.add(r.bookingId);
        return true;
      });
    },
    [airTickets, visas, hotels, transports, umrahPackages, tourPackages, travelBookings]
  );

  if (!canView) {
    return (
      <div>
        <PageHeader title="Accounts & Finance" breadcrumb="Home / Accounts" />
        <Card>
          <EmptyState message="You do not have permission to view accounts." />
        </Card>
      </div>
    );
  }

  const receivables = customers
    .map((c) => ({ name: c.name, id: c.id, outstanding: partyBalance("Customer", c.id, data) }))
    .filter((c) => c.outstanding > 0)
    .sort((a, b) => b.outstanding - a.outstanding);
  const payables = suppliers
    .map((s) => ({ name: s.name, id: s.id, outstanding: partyBalance("Supplier", s.id, data) }))
    .filter((s) => s.outstanding > 0)
    .sort((a, b) => b.outstanding - a.outstanding);

  const parties = form.type === "Customer" ? customers : suppliers;

  const bookingOptions = bookingRecords.filter(
    (b) => b.bookingId === form.bookingId || (form.partyId && b.partyId === form.partyId)
  );

  const openNewPayment = () => {
    setEditingPayment(null);
    setForm({
      type: "Customer",
      partyId: "",
      bookingId: "",
      direction: "out",
      amount: 0,
      status: "Paid",
      method: customers.length ? "Cash" : "Other",
      dueDate: todayISO(),
      paidDate: todayISO(),
      note: "",
    });
    setPaymentOpen(true);
  };

  const openEditPayment = (p: Payment) => {
    setEditingPayment(p);
    setForm({
      type: p.type,
      partyId: p.partyId,
      bookingId: p.bookingId || "",
      direction: p.direction || "out",
      amount: p.amountPKR,
      status: p.status,
      method: p.method || "",
      dueDate: p.dueDate,
      paidDate: p.paidDate || todayISO(),
      note: p.note || "",
    });
    setPaymentOpen(true);
  };

  const submitPayment = async (event: FormEvent) => {
    event.preventDefault();
    if (savingPayment) return;
    const party = parties.find((item) => item.id === form.partyId);
    if (!party || form.amount <= 0) return;
    setSavingPayment(true);
    const payload = {
      type: form.type,
      ...(form.bookingId ? { bookingId: form.bookingId } : { bookingId: "" }),
      partyId: party.id,
      partyName: party.name,
      direction: form.type === "Supplier" ? form.direction : "in",
      amount: Number(form.amount),
      currency: "PKR" as const,
      amountPKR: Number(form.amount),
      dueDate: form.dueDate,
      status: form.status,
      method: form.method || "Other",
      note: form.note,
      ...(form.status === "Paid" ? { paidDate: form.paidDate || todayISO() } : {}),
    };
    if (editingPayment) {
      await updatePayment(editingPayment.id, payload);
    } else {
      await addPayment(payload);
    }
    setPaymentOpen(false);
    setSavingPayment(false);
    setEditingPayment(null);
  };

  return (
    <div>
      <PageHeader title="Accounts Overview" breadcrumb="Home / Accounts" />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/accounts/cashbook">
          <Button variant="secondary">Cash Book</Button>
        </Link>
        <Link href="/accounts/ledger">
          <Button variant="secondary">Ledgers</Button>
        </Link>
      </div>

      <Card title="Month Review (Date-wise Hisaab)" className="mb-5">
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              All Time
            </Button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Summarized label="Sales (Bookings)" value={formatPKR(summary.sales)} tone="text-blue-800" />
          <Summarized label="Cost" value={formatPKR(summary.costs)} tone="text-rose-700" />
          <Summarized label="Received from Clients" value={formatPKR(summary.received)} tone="text-emerald-700" />
          <Summarized label="Paid to Suppliers" value={formatPKR(summary.paid)} tone="text-orange-700" />
          <Summarized label="Received from Vendors" value={formatPKR(summary.receivedFromVendors)} tone="text-cyan-700" />
          <Summarized label="Receivables (Clients owe)" value={formatPKR(summary.receivables)} tone="text-rose-700" />
          <Summarized label="Payables (We owe)" value={formatPKR(summary.payables)} tone="text-amber-700" />
        </div>
      </Card>

      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        <Card title="Customer Receivables">
          <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm">
            Total:{" "}
            <span className="font-bold text-rose-700">
              {formatPKR(totalReceivables(data))}
            </span>
          </div>
          {receivables.length === 0 ? (
            <EmptyState message="No outstanding receivables." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500">
                    <th className="pb-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium">Outstanding</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {receivables.map((c) => (
                    <tr key={c.id} className="border-b border-slate-50">
                      <td className="py-2 text-slate-800">{c.name}</td>
                      <td className="py-2 font-medium text-rose-700">{formatPKR(c.outstanding)}</td>
                      <td className="py-2 text-right">
                        <Link href="/accounts/ledger" className="text-xs text-blue-600 hover:underline">View ledger</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Supplier Payables">
          <div className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm">
            Total:{" "}
            <span className="font-bold text-amber-800">
              {formatPKR(totalPayables(data))}
            </span>
          </div>
          {payables.length === 0 ? (
            <EmptyState message="No outstanding payables." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500">
                    <th className="pb-2 font-medium">Supplier</th>
                    <th className="pb-2 font-medium">Outstanding</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {payables.map((s) => (
                    <tr key={s.id} className="border-b border-slate-50">
                      <td className="py-2 text-slate-800">{s.name}</td>
                      <td className="py-2 font-medium text-amber-800">{formatPKR(s.outstanding)}</td>
                      <td className="py-2 text-right">
                        <Link href="/accounts/ledger" className="text-xs text-blue-600 hover:underline">View ledger</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Card
        title="Payments"
        action={<Button onClick={openNewPayment}>Payment Entry</Button>}
      >
        <div className="mb-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPaymentFilter("Pending")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              paymentFilter === "Pending" ? "bg-amber-500 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Pending / Partial ({payments.filter((p) => p.status !== "Paid").length})
          </button>
          <button
            type="button"
            onClick={() => setPaymentFilter("All")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              paymentFilter === "All" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Payments ({payments.length})
          </button>
        </div>

        {visiblePayments.length === 0 ? (
          <EmptyState message="No payments to show." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Party</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Method</th>
                  <th className="pb-2 font-medium">Booking</th>
                  <th className="pb-2 font-medium">Due</th>
                  <th className="pb-2 font-medium">Paid</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Entry By</th>
                  <th className="pb-2 font-medium">Actions</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {visiblePayments.map((p) => {
                  const entryBy = users.find((u) => u.id === p.createdBy)?.name || p.createdBy || "—";
                  const partyLabel =
                    p.type === "Customer" && customers.find((c) => c.id === p.partyId) ? (
                      <Link href={`/customers/${p.partyId}`} className="text-blue-600 hover:underline">
                        {p.partyName}
                      </Link>
                    ) : (
                      p.partyName
                    );
                  return (
                    <tr key={p.id} className="border-b border-slate-50">
                      <td className="py-2 text-slate-600">
                        {p.type === "Supplier" ? (
                          <span>
                            {p.type}
                            <span
                              className={`ml-1.5 rounded px-1 py-0.5 text-[10px] font-semibold ${
                                p.direction === "in"
                                  ? "bg-cyan-100 text-cyan-700"
                                  : "bg-orange-100 text-orange-700"
                              }`}
                            >
                              {p.direction === "in" ? "Money In" : "Paid Out"}
                            </span>
                          </span>
                        ) : (
                          <span>Client</span>
                        )}
                      </td>
                      <td className="py-2 text-slate-800">{partyLabel}</td>
                      <td className="py-2 font-medium">{formatPKR(p.amountPKR)}</td>
                      <td className="py-2 text-slate-600">{p.method || "—"}</td>
                      <td className="py-2 text-slate-600">{p.bookingId || "—"}</td>
                      <td className="py-2 text-slate-600">{formatDate(p.dueDate)}</td>
                      <td className="py-2 text-slate-600">{p.paidDate ? formatDate(p.paidDate) : "—"}</td>
                      <td className="py-2">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="py-2 text-xs text-slate-500">{entryBy}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 hover:underline"
                            onClick={() => openEditPayment(p)}
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          {p.status !== "Paid" && (
                            <Button
                              variant="secondary"
                              className="!px-2 !py-1 text-xs"
                              onClick={() => markPaymentPaid(p.id)}
                            >
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="py-2">
                        {canDelete && (
                          <button
                            type="button"
                            className="text-xs text-rose-600 hover:underline"
                            onClick={() => setConfirmDeletePayment(p)}
                          >
                            <Trash2 size={14} className="inline" /> Delete
                          </button>
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

      <Modal open={paymentOpen} onClose={() => setPaymentOpen(false)} title={editingPayment ? "Edit Payment" : "Payment Entry"}>
        <form onSubmit={submitPayment} className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Account Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as "Customer" | "Supplier", partyId: "", bookingId: "" })}
          >
            <option value="Customer">Client / Customer (Received)</option>
            <option value="Supplier">Vendor / Supplier (Paid)</option>
          </Select>
          <Select label={form.type === "Customer" ? "Client" : "Vendor"} required value={form.partyId} onChange={(e) => setForm({ ...form, partyId: e.target.value, bookingId: "" })}>
            <option value="">Select account</option>
            {parties.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}
          </Select>
          {form.type === "Supplier" && (
            <div className="sm:col-span-2">
              <Select
                label="Direction (Vendors can give AND take money — len-den)"
                value={form.direction}
                onChange={(e) => setForm({ ...form, direction: e.target.value as "out" | "in" })}
              >
                <option value="out">We paid the vendor (vendor took money from us)</option>
                <option value="in">Vendor gave us money (we took money from vendor)</option>
              </Select>
            </div>
          )}
          <div className="sm:col-span-2">
            <Select label="Booking (optional — leave blank to record against the account alone)" value={form.bookingId} onChange={(e) => setForm({ ...form, bookingId: e.target.value })}>
              <option value="">No specific booking (account only)</option>
              {form.partyId && bookingOptions.length > 0 ? (
                bookingOptions.map((b) => (
                  <option key={b.bookingId} value={b.bookingId}>
                    {b.bookingId} — {b.label}
                  </option>
                ))
              ) : (
                <option value="" disabled>Select a client/vendor above to see its bookings</option>
              )}
            </Select>
            <p className="mt-1 text-[11px] text-slate-400">Partial / installment payments: choose Partial and enter the amount received/paid today — it is added to the party&apos;s statement automatically.</p>
          </div>
          <Input label="Amount (PKR)" type="number" min={1} required value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "Pending" | "Paid" | "Partial" })}>
            <option value="Paid">Full Payment (Paid)</option><option value="Partial">Partial / Installment</option><option value="Pending">Pending</option>
          </Select>
          <Select label="Payment Method" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as PaymentMethod | "" })}>
            <option value="Cash">Cash</option>
            <option value="Bank">Bank Transfer</option>
            <option value="Card">Card</option>
            <option value="Cheque">Cheque</option>
            <option value="Other">Other</option>
          </Select>
          <Input label="Due Date" type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <Input label="Paid Date" type="date" value={form.paidDate} onChange={(e) => setForm({ ...form, paidDate: e.target.value })} />
          <Input label="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setPaymentOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={savingPayment}>{savingPayment ? "Saving..." : editingPayment ? "Save Changes" : "Save Payment"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDeletePayment}
        title="Delete this payment?"
        message={`Are you sure you want to delete this ${confirmDeletePayment?.partyName || ""} payment of ${confirmDeletePayment ? formatPKR(confirmDeletePayment.amountPKR) : ""}? This cannot be undone.`}
        onCancel={() => setConfirmDeletePayment(null)}
        onConfirm={() => {
          if (confirmDeletePayment) void deletePayment(confirmDeletePayment.id);
          setConfirmDeletePayment(null);
        }}
      />
    </div>
  );
}

function Summarized({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className={`mt-1 text-base font-bold ${tone}`}>{value}</p>
    </div>
  );
}