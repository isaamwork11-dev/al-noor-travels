"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { calcProfit, todayISO } from "@/lib/format";
import type { BookingStatus } from "@/lib/types";
import { Button, Card, Input, PageHeader, Select } from "@/components/ui";

export default function NewHotelPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.currentUser);
  const customers = useAppStore((s) => s.customers);
  const suppliers = useAppStore((s) => s.suppliers);
  const addHotel = useAppStore((s) => s.addHotel);
  const showCost = user?.role === "super_admin" || !!user?.permissions.viewCost;

  const [form, setForm] = useState({
    customerId: customers[0]?.id || "",
    hotelName: "",
    city: "",
    checkIn: todayISO(),
    checkOut: todayISO(),
    roomType: "Double",
    supplierId: suppliers.find((s) => s.type === "Hotel")?.id || suppliers[0]?.id || "",
    costPrice: 0,
    salePrice: 0,
    status: "Confirmed" as BookingStatus,
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    addHotel({
      ...form,
      costPrice: Number(form.costPrice),
      salePrice: Number(form.salePrice),
      createdBy: user.id,
    });
    router.push("/hotels");
  };

  return (
    <div>
      <PageHeader title="Add Hotel Booking" breadcrumb="Home / Hotels / New" />
      <Card title="Booking Details">
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
            label="Hotel Name"
            required
            value={form.hotelName}
            onChange={(e) => setForm({ ...form, hotelName: e.target.value })}
          />
          <Input
            label="City"
            required
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
          <Input
            label="Check-in"
            type="date"
            required
            value={form.checkIn}
            onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
          />
          <Input
            label="Check-out"
            type="date"
            required
            value={form.checkOut}
            onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
          />
          <Input
            label="Room Type"
            value={form.roomType}
            onChange={(e) => setForm({ ...form, roomType: e.target.value })}
          />
          <Select
            label="Supplier"
            value={form.supplierId}
            onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
          >
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
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
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 sm:col-span-2 lg:col-span-3">
              Estimated profit: PKR {calcProfit(Number(form.costPrice), Number(form.salePrice)).toLocaleString("en-PK")}
            </div>
          )}
          <div className="flex justify-end gap-2 sm:col-span-2 lg:col-span-3">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit">Save Booking</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
