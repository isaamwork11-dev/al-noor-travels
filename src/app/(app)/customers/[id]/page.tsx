"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { formatDate, formatPKR, todayISO } from "@/lib/format";
import { buildPartyLedger } from "@/lib/accounting";
import { generateLedgerPDF } from "@/lib/pdf";
import { Button, Card, EmptyState, Input, Modal, PageHeader, Select, StatusBadge } from "@/components/ui";
import { FileDown, HandCoins } from "lucide-react";

const tabs = ["Tickets", "Visas", "Hotels", "Umrah", "Transport", "Payments", "Refunds"] as const;

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const customers = useAppStore((s) => s.customers);
  const suppliers = useAppStore((s) => s.suppliers);
  const airTickets = useAppStore((s) => s.airTickets);
  const visas = useAppStore((s) => s.visas);
  const hotels = useAppStore((s) => s.hotels);
  const umrahPackages = useAppStore((s) => s.umrahPackages);
  const transports = useAppStore((s) => s.transports);
  const tourPackages = useAppStore((s) => s.tourPackages);
  const travelBookings = useAppStore((s) => s.travelBookings);
  const payments = useAppStore((s) => s.payments);
  const refunds = useAppStore((s) => s.refunds);
  const addPayment = useAppStore((s) => s.addPayment);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Tickets");

  const [payOpen, setPayOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [payForm, setPayForm] = useState({
    bookingId: "",
    amount: 0,
    status: "Partial" as "Pending" | "Paid" | "Partial",
    method: "Cash" as "Cash" | "Bank" | "Card" | "Cheque" | "Other" | "",
    note: "",
  });

  const customer = customers.find((c) => c.id === id);

  const ledgerSource = useMemo(
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

  const ledger = useMemo(() => (customer ? buildPartyLedger("Customer", customer.id, ledgerSource) : null), [customer, ledgerSource]);

  const statementPeriod = useMemo(() => {
    if (!ledger || ledger.rows.length === 0) return { from: "", to: todayISO() };
    const from = ledger.rows[0].date;
    const to = ledger.rows[ledger.rows.length - 1].date;
    return { from: from.slice(0, 10), to: to.slice(0, 10) };
  }, [ledger]);

  const bookingOptions = useMemo(() => {
    const rows: { bookingId: string; label: string }[] = [];
    const push = (bookingId: string, kind: string, dates: string, amount: number) =>
      rows.push({ bookingId, label: `${bookingId} — ${kind} · ${formatDate(dates)} · ${formatPKR(amount)}` });
    for (const t of airTickets) if (t.customerId === id) push(t.bookingId, "Ticket", t.travelDate, t.totalAmount || t.salePrice);
    for (const v of visas) if (v.customerId === id) push(v.bookingId, "Visa", v.submissionDate, v.salePrice);
    for (const h of hotels) if (h.customerId === id) push(h.bookingId, "Hotel", h.checkIn, h.salePrice);
    for (const u of umrahPackages) if (u.customerId === id) push(u.bookingId, "Umrah", u.travelDate, u.salePrice);
    for (const t of transports) if (t.customerId === id) push(t.bookingId, "Transport", t.date, t.salePrice);
    for (const t of tourPackages) if (t.customerId === id) push(t.bookingId, "Tour", t.travelDate, t.salePrice);
    for (const b of travelBookings) if (b.customerId === id) push(b.bookingId, "Booking", b.travelDate, b.totalSale);
    const seen = new Set<string>();
    return rows.filter((r) => {
      if (seen.has(r.bookingId)) return false;
      seen.add(r.bookingId);
      return true;
    });
  }, [id, airTickets, visas, hotels, umrahPackages, transports, tourPackages, travelBookings]);

  const submitPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!customer || saving) return;
    if (payForm.amount <= 0) return;
    setSaving(true);
    try {
      await addPayment({
        type: "Customer",
        partyId: customer.id,
        partyName: customer.name,
        ...(payForm.bookingId ? { bookingId: payForm.bookingId } : {}),
        amount: Number(payForm.amount),
        currency: "PKR",
        amountPKR: Number(payForm.amount),
        dueDate: todayISO(),
        status: payForm.status,
        method: payForm.method,
        note: payForm.note,
        ...(payForm.status === "Paid" ? { paidDate: todayISO() } : {}),
      });
      setPayOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const history = useMemo(() => {
    if (!customer) return null;
    return {
      Tickets: airTickets.filter((t) => t.customerId === customer.id),
      Visas: visas.filter((v) => v.customerId === customer.id),
      Hotels: hotels.filter((h) => h.customerId === customer.id),
      Umrah: umrahPackages.filter((u) => u.customerId === customer.id),
      Transport: transports.filter((t) => t.customerId === customer.id),
      Payments: payments.filter((p) => p.type === "Customer" && p.partyId === customer.id),
      Refunds: refunds.filter((r) => r.customerId === customer.id),
    };
  }, [customer, airTickets, visas, hotels, umrahPackages, transports, payments, refunds]);

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

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => ledger && generateLedgerPDF(ledger, statementPeriod.from, statementPeriod.to)}
        >
          <FileDown size={16} /> Download Statement PDF
        </Button>
        <Button onClick={() => setPayOpen(true)}>
          <HandCoins size={16} /> Receive Payment
        </Button>
        <span className="text-xs text-slate-500">
          Statement period: {statementPeriod.from ? formatDate(statementPeriod.from) : "Beginning"} — {formatDate(statementPeriod.to)}
        </span>
      </div>

      {ledger && (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs text-slate-500">Total Bookings (Debit)</p>
            <p className="mt-1 text-lg font-bold text-blue-800">{formatPKR(ledger.totalDebit)}</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs text-slate-500">Payments Received (Credit)</p>
            <p className="mt-1 text-lg font-bold text-emerald-700">{formatPKR(ledger.totalCredit)}</p>
          </div>
          <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
            <p className="text-xs text-slate-500">Balance Payable</p>
            <p className="mt-1 text-lg font-bold text-rose-700">{formatPKR(ledger.closing)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">No. of Entries</p>
            <p className="mt-1 text-lg font-bold text-slate-800">{ledger.rows.length}</p>
          </div>
        </div>
      )}

      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card title="Profile">
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
                <dt className="text-xs text-slate-500">Outstanding (computed)</dt>
                <dd className="font-semibold text-rose-600">{formatPKR(ledger?.closing ?? customer.outstanding)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Joined</dt>
                <dd className="text-slate-700">{formatDate(customer.createdAt)}</dd>
              </div>
            </dl>
          </Card>

          <Card title="WhatsApp Notes">
            {(!customer.messages || customer.messages.length === 0) ? (
              <EmptyState message="No WhatsApp notes for this customer." />
            ) : (
              <div className="space-y-3 rounded-2xl bg-[#111827] p-3 text-sm text-slate-200 shadow-inner">
                {customer.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.direction === "outgoing" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[90%] rounded-2xl px-3 py-2 ${
                        message.direction === "outgoing"
                          ? "bg-[#1f2937] text-slate-100"
                          : "bg-[#2b3443] text-slate-100"
                      }`}
                    >
                      {message.forwarded && (
                        <div className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                          <span>↪</span>
                          <span>Forwarded</span>
                        </div>
                      )}
                      <p className="leading-relaxed whitespace-pre-line">{message.text}</p>
                      <div className="mt-1 text-right text-[10px] text-slate-400">
                        {new Date(message.sentAt).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

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
          {tab === "Refunds" && (
            <HistoryTable
              empty="No refunds."
              rows={history!.Refunds.map((r) => [
                r.referenceId,
                r.refundType,
                formatPKR(r.originalAmount),
                formatPKR(r.refundAmount),
                formatDate(r.createdAt),
                r.status,
              ])}
              headers={["Ticket", "Type", "Original", "Refunded", "Date", "Status"]}
            />
          )}
        </Card>
      </div>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Receive Payment">
        <form onSubmit={submitPayment} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Select
              label="Booking (optional — leave blank to record against the account alone)"
              value={payForm.bookingId}
              onChange={(e) => setPayForm({ ...payForm, bookingId: e.target.value })}
            >
              <option value="">No specific booking (account only)</option>
              {bookingOptions.map((option) => (
                <option key={option.bookingId} value={option.bookingId}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <Input
            label="Amount (PKR)"
            type="number"
            min={1}
            required
            value={payForm.amount}
            onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) })}
          />
          <Select
            label="Status"
            value={payForm.status}
            onChange={(e) => setPayForm({ ...payForm, status: e.target.value as "Pending" | "Paid" | "Partial" })}
          >
            <option value="Paid">Full Payment (Paid)</option>
            <option value="Partial">Partial / Installment</option>
            <option value="Pending">Pending</option>
          </Select>
          <Select
            label="Payment Method"
            value={payForm.method}
            onChange={(e) => setPayForm({ ...payForm, method: e.target.value as typeof payForm.method })}
          >
            <option value="Cash">Cash</option>
            <option value="Bank">Bank Transfer</option>
            <option value="Card">Card</option>
            <option value="Cheque">Cheque</option>
            <option value="Other">Other</option>
          </Select>
          <Input
            label="Note (optional)"
            className="sm:col-span-2"
            value={payForm.note}
            onChange={(e) => setPayForm({ ...payForm, note: e.target.value })}
          />
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setPayOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Payment"}
            </Button>
          </div>
        </form>
      </Modal>
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
