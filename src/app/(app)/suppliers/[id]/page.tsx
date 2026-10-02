"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { FileDown } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatDate, formatPKR, todayISO } from "@/lib/format";
import { buildPartyLedger } from "@/lib/accounting";
import { generateLedgerPDF } from "@/lib/pdf";
import { Button, Card, EmptyState, PageHeader } from "@/components/ui";

export default function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const suppliers = useAppStore((s) => s.suppliers);
  const customers = useAppStore((s) => s.customers);
  const airTickets = useAppStore((s) => s.airTickets);
  const visas = useAppStore((s) => s.visas);
  const hotels = useAppStore((s) => s.hotels);
  const transports = useAppStore((s) => s.transports);
  const umrahPackages = useAppStore((s) => s.umrahPackages);
  const tourPackages = useAppStore((s) => s.tourPackages);
  const travelBookings = useAppStore((s) => s.travelBookings);
  const payments = useAppStore((s) => s.payments);
  const refunds = useAppStore((s) => s.refunds);

  const supplier = suppliers.find((s) => s.id === id);
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

  const ledger = useMemo(
    () => (supplier ? buildPartyLedger("Supplier", supplier.id, data) : null),
    [supplier, data]
  );

  const statementPeriod = useMemo(() => {
    if (!ledger) return { from: "", to: todayISO() };
    const dates = ledger.rows.map((r) => r.date).filter(Boolean);
    return {
      from: dates[0]?.slice(0, 10) || "",
      to: dates[dates.length - 1]?.slice(0, 10) || todayISO(),
    };
  }, [ledger]);

  if (!supplier) {
    return (
      <div>
        <PageHeader title="Vendor Not Found" breadcrumb="Home / Vendors" />
        <Card>
          <EmptyState message="This vendor does not exist." />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={supplier.name} breadcrumb="Home / Vendors / Statement" />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => ledger && generateLedgerPDF(ledger, statementPeriod.from, statementPeriod.to)}
        >
          <FileDown size={16} /> Download Statement PDF
        </Button>
        <Link href="/suppliers">
          <Button variant="secondary">Back</Button>
        </Link>
      </div>

      {ledger && (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Opening Balance</p>
            <p className="mt-1 text-lg font-bold text-slate-800">{formatPKR(ledger.opening)}</p>
          </div>
          <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
            <p className="text-xs text-slate-500">Bills / Costs (Credit)</p>
            <p className="mt-1 text-lg font-bold text-rose-700">{formatPKR(ledger.totalCredit)}</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs text-slate-500">Payments Made (Debit)</p>
            <p className="mt-1 text-lg font-bold text-emerald-700">{formatPKR(ledger.totalDebit)}</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs text-slate-500">Closing Payable</p>
            <p className="mt-1 text-lg font-bold text-amber-800">{formatPKR(ledger.closing)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Opening Outstanding (saved)</p>
            <p className="mt-1 text-lg font-bold text-slate-800">{formatPKR(supplier.outstanding)}</p>
          </div>
        </div>
      )}

      <Card title="Vendor Account Statement">
        {!ledger ? (
          <EmptyState message="No statement." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="pb-2 font-medium">Ref</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Particulars</th>
                  <th className="pb-2 font-medium">Debit</th>
                  <th className="pb-2 font-medium">Credit</th>
                  <th className="pb-2 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledger.rows.map((e, i) => (
                  <tr
                    key={`${e.ref}-${i}`}
                    className={`border-b border-slate-50 last:border-0 ${e.ref === "OPEN" ? "bg-slate-50 font-medium" : ""}`}
                  >
                    <td className="py-2.5 font-medium text-blue-700">{e.ref}</td>
                    <td className="py-2.5 text-slate-600">{formatDate(e.date)}</td>
                    <td className="py-2.5 text-slate-700">{e.description}</td>
                    <td className="py-2.5 font-semibold text-rose-700">{e.debit ? formatPKR(e.debit) : "—"}</td>
                    <td className="py-2.5 font-semibold text-emerald-700">{e.credit ? formatPKR(e.credit) : "—"}</td>
                    <td className="py-2.5 font-medium text-slate-800">{formatPKR(e.balance)}</td>
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
