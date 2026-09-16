"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatDate, formatPKR, todayISO } from "@/lib/format";
import { monthlySummary, partyBalance, totalPayables, totalReceivables } from "@/lib/accounting";
import { Button, Card, EmptyState, Input, Modal, PageHeader, Select, StatusBadge } from "@/components/ui";

export default function AccountsPage() {
  const user = useAppStore((s) => s.currentUser);
  const customers = useAppStore((s) => s.customers);
  const suppliers = useAppStore((s) => s.suppliers);
  const payments = useAppStore((s) => s.payments);
  const markPaymentPaid = useAppStore((s) => s.markPaymentPaid);
  const addPayment = useAppStore((s) => s.addPayment);
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
  const [form, setForm] = useState({ type: "Customer" as "Customer" | "Supplier", partyId: "", bookingId: "", amount: 0, status: "Paid" as "Pending" | "Paid" | "Partial", dueDate: todayISO(), note: "" });

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
    }),
    [customers, suppliers, airTickets, visas, hotels, transports, umrahPackages, tourPackages, travelBookings, payments]
  );

  const summary = useMemo(() => monthlySummary(from, to, data), [from, to, data]);

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

  const pending = payments.filter((p) => p.status !== "Paid");
  const parties = form.type === "Customer" ? customers : suppliers;
  const bookingOptions = Array.from(new Set([
    ...airTickets.map((x) => x.bookingId),
    ...visas.map((x) => x.bookingId),
    ...hotels.map((x) => x.bookingId),
    ...transports.map((x) => x.bookingId),
    ...umrahPackages.map((x) => x.bookingId),
    ...travelBookings.map((x) => x.bookingId),
  ])).filter(Boolean);

  const submitPayment = async (event: FormEvent) => {
    event.preventDefault();
    if (savingPayment) return;
    const party = parties.find((item) => item.id === form.partyId);
    if (!party || !form.bookingId || form.amount <= 0) return;
    setSavingPayment(true);
    await addPayment({
      type: form.type,
      partyId: party.id,
      partyName: party.name,
      bookingId: form.bookingId,
      amount: Number(form.amount),
      currency: "PKR",
      amountPKR: Number(form.amount),
      dueDate: form.dueDate,
      status: form.status,
      note: form.note,
      ...(form.status === "Paid" ? { paidDate: todayISO() } : {}),
    });
    setPaymentOpen(false);
    setSavingPayment(false);
    setForm({ type: "Customer", partyId: "", bookingId: "", amount: 0, status: "Paid", dueDate: todayISO(), note: "" });
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Summarized label="Sales (Bookings)" value={formatPKR(summary.sales)} tone="text-blue-800" />
          <Summarized label="Cost" value={formatPKR(summary.costs)} tone="text-rose-700" />
          <Summarized label="Received from Clients" value={formatPKR(summary.received)} tone="text-emerald-700" />
          <Summarized label="Paid to Suppliers" value={formatPKR(summary.paid)} tone="text-orange-700" />
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

      <Card title="Payments" action={<Button onClick={() => setPaymentOpen(true)}>Payment Entry</Button>}>
        {pending.length === 0 ? (
          <EmptyState message="No pending payments." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Party</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Due</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Action</th>
                  <th className="pb-2 font-medium">Delete</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50">
                    <td className="py-2 text-slate-600">{p.type}</td>
                    <td className="py-2 text-slate-800">{p.partyName}</td>
                    <td className="py-2 font-medium">{formatPKR(p.amountPKR)}</td>
                    <td className="py-2 text-slate-600">{formatDate(p.dueDate)}</td>
                    <td className="py-2">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-2">
                      <Button
                        variant="secondary"
                        className="!px-2 !py-1 text-xs"
                        onClick={() => markPaymentPaid(p.id)}
                      >
                        Mark Paid
                      </Button>
                    </td>
                    <td className="py-2">
                      {canDelete && <button type="button" className="text-xs text-rose-600 hover:underline" onClick={() => confirm("Delete this payment permanently?") && deletePayment(p.id)}><Trash2 size={14} className="inline" /> Delete</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={paymentOpen} onClose={() => setPaymentOpen(false)} title="Payment Entry">
        <form onSubmit={submitPayment} className="grid gap-3 sm:grid-cols-2">
          <Select label="Account Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "Customer" | "Supplier", partyId: "" })}>
            <option value="Customer">Client / Customer (Received)</option>
            <option value="Supplier">Vendor / Supplier (Paid)</option>
          </Select>
          <Select label={form.type === "Customer" ? "Client" : "Vendor"} required value={form.partyId} onChange={(e) => setForm({ ...form, partyId: e.target.value })}>
            <option value="">Select account</option>
            {parties.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}
          </Select>
          <div className="sm:col-span-2">
            <Select label="Booking" required value={form.bookingId} onChange={(e) => setForm({ ...form, bookingId: e.target.value })}>
              <option value="">Select booking</option>
              {bookingOptions.map((bookingId) => <option key={bookingId} value={bookingId}>{bookingId}</option>)}
            </Select>
            <p className="mt-1 text-[11px] text-slate-400">Partial / installment payments: choose Partial and enter the amount received/paid today — it is added to the party&apos;s statement automatically.</p>
          </div>
          <Input label="Amount (PKR)" type="number" min={1} required value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "Pending" | "Paid" | "Partial" })}>
            <option value="Paid">Full Payment (Paid)</option><option value="Partial">Partial / Installment</option><option value="Pending">Pending</option>
          </Select>
          <Input label="Due Date" type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <Input label="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <div className="flex justify-end sm:col-span-2"><Button type="submit" disabled={savingPayment}>{savingPayment ? "Saving..." : "Save Payment"}</Button></div>
        </form>
      </Modal>
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