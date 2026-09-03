"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button, Card, PageHeader } from "@/components/ui";

export default function SettingsPage() {
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

      <div className="grid gap-4 lg:grid-cols-1">
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
