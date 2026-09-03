"use client";

import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { calcProfit, formatDate, formatPKR, todayISO } from "@/lib/format";
import type { BookingStatus } from "@/lib/types";
import { Button, Card, EmptyState, Input, Modal, PageHeader, Select, StatusBadge } from "@/components/ui";

export default function ToursPage() {
  const user = useAppStore((s) => s.currentUser);
  const tourPackages = useAppStore((s) => s.tourPackages);
  const customers = useAppStore((s) => s.customers);
  const addTour = useAppStore((s) => s.addTour);
  const showCost = user?.role === "super_admin" || !!user?.permissions.viewCost;
  const showProfit = user?.role === "super_admin" || !!user?.permissions.viewProfit;
  const customerName = (id: string) => customers.find((c) => c.id === id)?.name || "—";

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customerId: customers[0]?.id || "",
    packageName: "",
    destination: "",
    travelDate: todayISO(),
    returnDate: todayISO(),
    costPrice: 0,
    salePrice: 0,
    status: "Confirmed" as BookingStatus,
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    addTour({
      ...form,
      costPrice: Number(form.costPrice),
      salePrice: Number(form.salePrice),
      createdBy: user.id,
    });
    setOpen(false);
    setForm({
      customerId: customers[0]?.id || "",
      packageName: "",
      destination: "",
      travelDate: todayISO(),
      returnDate: todayISO(),
      costPrice: 0,
      salePrice: 0,
      status: "Confirmed",
    });
  };

  return (
    <div>
      <PageHeader title="Tour Packages" breadcrumb="Home / Tours" />
      <Card
        title="All Tours"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Add Tour
          </Button>
        }
      >
        {tourPackages.length === 0 ? (
          <EmptyState message="No tour packages yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="pb-2 font-medium">Booking</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Package</th>
                  <th className="pb-2 font-medium">Destination</th>
                  <th className="pb-2 font-medium">Travel</th>
                  {showCost && <th className="pb-2 font-medium">Cost</th>}
                  <th className="pb-2 font-medium">Sale</th>
                  {showProfit && <th className="pb-2 font-medium">Profit</th>}
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {tourPackages.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 font-medium text-blue-700">{t.bookingId}</td>
                    <td className="py-2.5 text-slate-800">{customerName(t.customerId)}</td>
                    <td className="py-2.5 text-slate-600">{t.packageName}</td>
                    <td className="py-2.5 text-slate-600">{t.destination}</td>
                    <td className="py-2.5 text-slate-600">{formatDate(t.travelDate)}</td>
                    {showCost && <td className="py-2.5">{formatPKR(t.costPrice)}</td>}
                    <td className="py-2.5 font-medium">{formatPKR(t.salePrice)}</td>
                    {showProfit && (
                      <td className="py-2.5 font-medium text-emerald-700">{formatPKR(t.profit)}</td>
                    )}
                    <td className="py-2.5">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Tour Package" wide>
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
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
            label="Destination"
            required
            value={form.destination}
            onChange={(e) => setForm({ ...form, destination: e.target.value })}
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
          {showCost && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 sm:col-span-2">
              Estimated profit: PKR {calcProfit(Number(form.costPrice), Number(form.salePrice)).toLocaleString("en-PK")}
            </div>
          )}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Tour</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
