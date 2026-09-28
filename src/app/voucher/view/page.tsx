"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileDown, Printer } from "lucide-react";
import { COMPANY, companyTelLine } from "@/lib/company";
import { generateVoucherPDF } from "@/lib/pdf";
import {
  VOUCHER_TITLES,
  readVoucherPayload,
  type VoucherPayload,
} from "@/lib/voucher";

function VoucherViewInner() {
  const searchParams = useSearchParams();
  const [payload, setPayload] = useState<VoucherPayload | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const key = searchParams.get("k");
    if (!key) {
      setMissing(true);
      return;
    }
    const data = readVoucherPayload(key);
    if (!data) {
      setMissing(true);
      return;
    }
    setPayload(data);
  }, [searchParams]);

  if (missing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <p className="text-sm text-slate-600">Voucher not found. Open it again from the app.</p>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const title = VOUCHER_TITLES[payload.kind];

  return (
    <div className="min-h-screen bg-slate-200 print:bg-white">
      <div className="no-print sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <p className="text-sm font-medium text-slate-700">{title}</p>
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
            onClick={() => generateVoucherPDF(payload)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <FileDown size={16} /> Save PDF
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[720px] p-4 print:p-0 sm:p-8">
        <article className="overflow-hidden rounded-xl bg-white shadow-md print:rounded-none print:shadow-none">
          <header className="flex items-start justify-between gap-4 bg-[#0f1c3f] px-5 py-4 text-white">
            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-tight sm:text-xl">{COMPANY.name}</h1>
              <p className="mt-1 text-[11px] leading-snug text-slate-300 sm:text-xs">{COMPANY.address}</p>
              <p className="mt-1 text-[11px] text-slate-200 sm:text-xs">Tel: {companyTelLine()}</p>
              <p className="text-[11px] text-slate-200 sm:text-xs">Email: {COMPANY.email}</p>
            </div>
            <img
              src={COMPANY.logo}
              alt=""
              className="h-14 w-14 shrink-0 rounded-lg bg-white object-contain p-0.5 sm:h-16 sm:w-16"
            />
          </header>

          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-slate-600">
              <span>
                <span className="text-slate-400">Customer:</span> {payload.customerName}
              </span>
              <span>
                <span className="text-slate-400">Booking:</span> {payload.bookingId}
              </span>
            </div>
          </div>

          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="px-5 py-2 font-medium">Field</th>
                <th className="px-5 py-2 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {payload.lines.map((line) => (
                <tr key={line.label} className="border-b border-slate-100">
                  <td className="px-5 py-2.5 font-medium text-slate-700">{line.label}</td>
                  <td className="px-5 py-2.5 text-slate-800">{line.value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {(payload.amount || payload.note) && (
            <div className="space-y-1 px-5 py-4">
              {payload.amount && (
                <p className="text-base font-semibold text-slate-900">Amount: {payload.amount}</p>
              )}
              {payload.note && <p className="text-xs text-slate-500">{payload.note}</p>}
            </div>
          )}

          <footer className="border-t border-slate-100 px-5 py-3 text-center text-[10px] text-slate-400">
            {COMPANY.name} · {COMPANY.email}
          </footer>
        </article>
      </div>
    </div>
  );
}

export default function VoucherViewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <VoucherViewInner />
    </Suspense>
  );
}
