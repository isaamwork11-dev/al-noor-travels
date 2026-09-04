"use client";

import { formatPKR, sarToPkr } from "@/lib/format";
import { Input } from "@/components/ui";

/** Shared SAR cost + manual exchange rate → PKR display. */
export function SarCostFields({
  costSAR,
  exchangeRate,
  salePrice,
  onChange,
  showSale = true,
  showProfit = true,
}: {
  costSAR: number | string;
  exchangeRate: number | string;
  salePrice?: number | string;
  onChange: (patch: {
    costSAR?: number;
    exchangeRate?: number;
    salePrice?: number;
  }) => void;
  showSale?: boolean;
  showProfit?: boolean;
}) {
  const sar = Number(costSAR) || 0;
  const rate = Number(exchangeRate) || 0;
  const sale = Number(salePrice) || 0;
  const costPKR = sarToPkr(sar, rate);
  const profit = sale - costPKR;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Input
        label="Cost (SAR)"
        type="number"
        min={0}
        step="0.01"
        value={costSAR}
        onChange={(e) => onChange({ costSAR: Number(e.target.value) || 0 })}
      />
      <Input
        label="Exchange Rate (1 SAR → PKR)"
        type="number"
        min={0}
        step="0.01"
        value={exchangeRate}
        onChange={(e) => onChange({ exchangeRate: Number(e.target.value) || 0 })}
        placeholder="e.g. 73.9"
      />
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-[11px] font-medium text-slate-500">Cost in PKR</p>
        <p className="mt-0.5 text-sm font-semibold text-slate-800">{formatPKR(costPKR)}</p>
        <p className="text-[10px] text-slate-400">Rate locked with this record</p>
      </div>
      {showSale && (
        <Input
          label="Sale Price (PKR)"
          type="number"
          min={0}
          step="1"
          value={salePrice ?? 0}
          onChange={(e) => onChange({ salePrice: Number(e.target.value) || 0 })}
        />
      )}
      {showSale && showProfit && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 sm:col-span-2 lg:col-span-4">
          <p className="text-[11px] font-medium text-emerald-700">Profit / Loss</p>
          <p className={`mt-0.5 text-sm font-bold ${profit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
            {formatPKR(profit)}
          </p>
        </div>
      )}
    </div>
  );
}
