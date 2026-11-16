"use client";

import { Suspense, useEffect, useState } from "react";
import { FileDown, Printer } from "lucide-react";
import { COMPANY, companyTelLine } from "@/lib/company";
import { formatDate, formatPKR } from "@/lib/format";
import { displayRef } from "@/lib/format";
import { generateLedgerPDF, readStatementPayload } from "@/lib/pdf";
import type { PartyLedger } from "@/lib/accounting";

function StatementViewInner() {
  const [data, setData] = useState<{ ledger: PartyLedger; from: string; to: string } | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("k");
    if (!key) {
      setMissing(true);
      return;
    }
    const payload = readStatementPayload(key);
    if (!payload) {
      setMissing(true);
      return;
    }
    setData(payload);
  }, []);

  if (missing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <p className="text-sm text-slate-600">Statement not found. Open it again from the app.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const { ledger, from, to } = data;

  return (
    <div className="min-h-screen bg-slate-200 print:bg-white">
      <div className="no-print sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <p className="text-sm font-medium text-slate-700">Account Statement</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            <Printer size={16} /> Print
          </button>
          <button
            type="button"
            onClick={() => generateLedgerPDF(ledger, from, to)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <FileDown size={16} /> Save PDF
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[900px] p-4 print:p-0 sm:p-8">
        <article className="overflow-hidden rounded-xl bg-white shadow-md print:rounded-none print:shadow-none">
          <header className="flex items-start justify-between gap-4 bg-[#0f1c3f] px-5 py-4 text-white">
            <div>
              <h1 className="text-lg font-bold">{COMPANY.name}</h1>
              <p className="mt-1 text-[11px] text-slate-300">{COMPANY.address}</p>
              <p className="mt-1 text-[11px] text-slate-200">Tel: {companyTelLine()}</p>
              <p className="text-[11px] text-slate-200">Email: {COMPANY.email}</p>
            </div>
            <img src={COMPANY.logo} alt="" className="h-16 w-16 rounded-lg bg-white object-contain p-1 sm:h-20 sm:w-20" />
          </header>

          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-base font-semibold text-slate-900">Account Statement</h2>
            <p className="mt-1 text-sm text-slate-600">
              {ledger.partyType}: {ledger.partyName}
            </p>
            <p className="text-sm text-slate-500">
              Period: {from ? formatDate(from) : "Beginning"} — {to ? formatDate(to) : "Today"}
            </p>
            <p className="text-sm text-slate-500">Opening Balance: {formatPKR(ledger.opening)}</p>
          </div>

          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#0f1c3f] text-white">
                <th className="px-3 py-2 font-medium">#</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Ref</th>
                <th className="px-3 py-2 font-medium">Details</th>
                <th className="px-3 py-2 text-right font-medium">Debit</th>
                <th className="px-3 py-2 text-right font-medium">Credit</th>
                <th className="px-3 py-2 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledger.rows.map((row, index) => (
                <tr key={`${row.ref}-${index}`} className="border-b border-slate-100">
                  <td className="px-3 py-2 text-slate-500">{index + 1}</td>
                  <td className="px-3 py-2 text-slate-600">{formatDate(row.date)}</td>
                  <td className="px-3 py-2 font-medium text-blue-700">{displayRef(row.ref)}</td>
                  <td className="px-3 py-2 text-slate-800">{row.description}</td>
                  <td className="px-3 py-2 text-right text-rose-700">
                    {row.debit ? formatPKR(row.debit) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-emerald-700">
                    {row.credit ? formatPKR(row.credit) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-slate-800">
                    {formatPKR(row.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-5 py-4 text-sm font-semibold text-slate-900">
            Closing Balance: {formatPKR(ledger.closing)}
          </div>
        </article>
      </div>
    </div>
  );
}

export default function StatementViewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <StatementViewInner />
    </Suspense>
  );
}
