"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button, Card, PageHeader } from "@/components/ui";

export default function SettingsPage() {
  const exchangeRates = useAppStore((s) => s.exchangeRates);
  const resetDemo = useAppStore((s) => s.resetDemo);
  const [msg, setMsg] = useState("");

  const onReset = async () => {
    if (!confirm("Reset all MongoDB data to demo defaults?")) return;
    try {
      await resetDemo();
      setMsg("MongoDB demo data has been reset.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Reset failed");
    }
    setTimeout(() => setMsg(""), 4000);
  };

  return (
    <div>
      <PageHeader title="Settings" breadcrumb="Home / Settings" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Exchange Rates (to PKR)">
          <p className="mb-3 text-xs text-slate-500">
            Rates used when converting SAR, AED, and USD entries into PKR.
          </p>
          <div className="space-y-2">
            {(Object.keys(exchangeRates) as (keyof typeof exchangeRates)[]).map((cur) => (
              <div
                key={cur}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"
              >
                <span className="text-sm font-medium text-slate-700">1 {cur}</span>
                <span className="text-sm font-semibold text-slate-900">
                  = PKR {exchangeRates[cur].toLocaleString("en-PK")}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Database">
          <p className="mb-2 text-xs font-medium text-emerald-700">MongoDB Atlas connected</p>
          <p className="mb-4 text-sm text-slate-600">
            Wipe and reseed the Atlas database with sample customers, bookings, and users.
          </p>
          <Button variant="danger" onClick={onReset}>
            Reseed MongoDB Demo Data
          </Button>
          {msg && <p className="mt-3 text-sm font-medium text-emerald-700">{msg}</p>}
        </Card>
      </div>
    </div>
  );
}
