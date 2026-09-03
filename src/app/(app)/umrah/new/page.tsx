"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { calcProfit, todayISO } from "@/lib/format";
import type { BookingStatus } from "@/lib/types";
import { Button, Card, Input, PageHeader, Select } from "@/components/ui";

export default function NewUmrahPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.currentUser);
  const customers = useAppStore((s) => s.customers);
  const addUmrah = useAppStore((s) => s.addUmrah);
  const showCost = user?.role === "super_admin" || !!user?.permissions.viewCost;

  const [form, setForm] = useState({
    customerId: customers[0]?.id || "",
    packageName: "",
    includesVisa: true,
    includesTicket: true,
    includesHotel: true,
    includesTransport: false,
    travelDate: todayISO(),
    returnDate: todayISO(),
    costPrice: 0,
    salePrice: 0,
    status: "Confirmed" as BookingStatus,
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    addUmrah({
      ...form,
      costPrice: Number(form.costPrice),
      salePrice: Number(form.salePrice),
      createdBy: user.id,
    });
    router.push("/umrah");
  };

  return (
    <div>
      <PageHeader title="New Umrah Package" breadcrumb="Home / Umrah / New" />
      <Card title="Package Details">
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            label="Customer"
            required
            value={form.customerId}
            onChange={(e) => setForm({ ...form, customerId: e.target.value })}
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input
            label="Package Name"
            required
            value={form.packageName}
            onChange={(e) => setForm({ ...form, packageName: e.target.value })}
          />
          <Input
            label="Travel Date"
            type="date"
            required
            value={form.travelDate}
            onChange={(e) => setForm({ ...form, travelDate: e.target.value })}
          />
          <Input
            label="Return Date"
            type="date"
            required
            value={form.returnDate}
            onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
          />
          {showCost && (
            <Input
              label="Cost Price (PKR)"
              type="number"
              min={0}
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })}
            />
          )}
          <Input
            label="Sale Price (PKR)"
            type="number"
            min={0}
            required
            value={form.salePrice}
            onChange={(e) => setForm({ ...form, salePrice: Number(e.target.value) })}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as BookingStatus })}
          >
            {["Confirmed", "Pending", "Cancelled", "Completed"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>

          <div className="sm:col-span-2 lg:col-span-3">
            <p className="mb-2 text-xs font-medium text-slate-600">Includes</p>
            <div className="flex flex-wrap gap-4">
              {(
                [
                  ["includesVisa", "Visa"],
                  ["includesTicket", "Air Ticket"],
                  ["includesHotel", "Hotel"],
                  ["includesTransport", "Transport"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {showCost && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 sm:col-span-2 lg:col-span-3">
              Estimated profit: PKR {calcProfit(Number(form.costPrice), Number(form.salePrice)).toLocaleString("en-PK")}
            </div>
          )}
          <div className="flex justify-end gap-2 sm:col-span-2 lg:col-span-3">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit">Save Package</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
