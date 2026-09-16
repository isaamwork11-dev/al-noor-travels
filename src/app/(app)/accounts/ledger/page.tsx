"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { formatDate, formatPKR, todayISO } from "@/lib/format";
import { buildPartyLedger } from "@/lib/accounting";
import { generateLedgerPDF } from "@/lib/pdf";
import { Button, Card, EmptyState, PageHeader, Select } from "@/components/ui";
import { FileDown } from "lucide-react";

export default function LedgerPage() {
  const user = useAppStore((s) => s.currentUser);
  const customers = useAppStore((s) => s.customers);
  const suppliers = useAppStore((s) => s.suppliers);
  const payments = useAppStore((s) => s.payments);
  const airTickets = useAppStore((s) => s.airTickets);
  const visas = useAppStore((s) => s.visas);
  const hotels = useAppStore((s) => s.hotels);
  const transports = useAppStore((s) => s.transports);
  const umrahPackages = useAppStore((s) => s.umrahPackages);
  const tourPackages = useAppStore((s) => s.tourPackages);
  const travelBookings = useAppStore((s) => s.travelBookings);

  const canView = user?.role === "super_admin" || !!user?.permissions.viewAccounts;

  const monthStart = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  };

  const [partyType, setPartyType] = useState<"Customer" | "Supplier">("Customer");
  const [partyId, setPartyId] = useState(customers[0]?.id || "");
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(todayISO);

  const parties = partyType === "Customer" ? customers : suppliers;

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

  const ledger = useMemo(
    () => (partyId ? buildPartyLedger(partyType, partyId, data, from, to) : null),
    [partyType, partyId, data, from, to]
  );

  if (!canView) {
    return (
      <div>
        <PageHeader title="Ledgers" breadcrumb="Home / Accounts / Ledgers" />
        <Card>
          <EmptyState message="You do not have permission to view accounts." />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Party Ledgers" breadcrumb="Home / Accounts / Ledgers" />
      <Card
        title="Statement"
        action={
          ledger && (
            <Button
              variant="secondary"
              className="!px-2 !py-1 text-xs"
              onClick={() => generateLedgerPDF(ledger, from, to)}
            >
              <FileDown size={14} /> Download PDF Statement
            </Button>
          )
        }
      >
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Party Type"
            value={partyType}
            onChange={(e) => {
              const t = e.target.value as "Customer" | "Supplier";
              setPartyType(t);
              setPartyId(t === "Customer" ? customers[0]?.id || "" : suppliers[0]?.id || "");
            }}
          >
            <option value="Customer">Client / Customer</option>
            <option value="Supplier">Vendor / Supplier</option>
          </Select>
          <Select label="Party" value={partyId} onChange={(e) => setPartyId(e.target.value)}>
            {parties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
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
        </div>

        {ledger && (
          <>
            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Opening Balance</p>
                <p className="mt-1 text-lg font-bold text-slate-800">{formatPKR(ledger.opening)}</p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                <p className="text-xs text-slate-500">Total Debit</p>
                <p className="mt-1 text-lg font-bold text-rose-700">{formatPKR(ledger.totalDebit)}</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs text-slate-500">Total Credit</p>
                <p className="mt-1 text-lg font-bold text-emerald-700">{formatPKR(ledger.totalCredit)}</p>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs text-slate-500">Closing Balance</p>
                <p className="mt-1 text-lg font-bold text-blue-800">{formatPKR(ledger.closing)}</p>
              </div>
            </div>

            {ledger.rows.length === 0 ? (
              <EmptyState message="No ledger entries for this party in the selected period." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-500">
                      <th className="pb-2 font-medium">Ref / Booking No</th>
                      <th className="pb-2 font-medium">Date of Entry</th>
                      <th className="pb-2 font-medium">Particulars</th>
                      <th className="pb-2 font-medium">Debit</th>
                      <th className="pb-2 font-medium">Credit</th>
                      <th className="pb-2 font-medium">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.rows.map((e, i) => (
                      <tr key={`${e.ref}-${i}`} className="border-b border-slate-50 last:border-0">
                        <td className="py-2.5 font-medium text-blue-700">{e.ref}</td>
                        <td className="py-2.5 text-slate-600">{formatDate(e.date)}</td>
                        <td className="py-2.5 text-slate-700">{e.description}</td>
                        <td className="py-2.5 font-semibold text-rose-700">
                          {e.debit ? formatPKR(e.debit) : "—"}
                        </td>
                        <td className="py-2.5 font-semibold text-emerald-700">
                          {e.credit ? formatPKR(e.credit) : "—"}
                        </td>
                        <td className="py-2.5 font-medium text-slate-800">{formatPKR(e.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}