"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { todayISO } from "@/lib/format";
import type { BookingStatus } from "@/lib/types";
import { SarCostFields } from "@/components/SarCostFields";
import { Button, Card, Input, PageHeader, Select } from "@/components/ui";

export default function NewHotelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAppStore((s) => s.currentUser);
  const customers = useAppStore((s) => s.customers);
  const suppliers = useAppStore((s) => s.suppliers);
  const addHotel = useAppStore((s) => s.addHotel);
  const updateHotel = useAppStore((s) => s.updateHotel);
  const existing = useAppStore((s) => s.hotels.find((hotel) => hotel.id === searchParams.get("edit")));
  const showCost = user?.role === "super_admin" || !!user?.permissions.viewCost;

  const [form, setForm] = useState({
    customerId: customers[0]?.id || "",
    hotelName: "",
    city: "",
    checkIn: todayISO(),
    checkOut: todayISO(),
    roomType: "Double",
    supplierId: suppliers.find((s) => s.type === "Hotel")?.id || suppliers[0]?.id || "",
    costSAR: 0,
    exchangeRate: 73.9,
    salePrice: 0,
    status: "Confirmed" as BookingStatus,
  });

  // Edit mode hydrates from the client store after the record becomes available.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (existing) { setForm({ customerId: existing.customerId, hotelName: existing.hotelName, city: existing.city, checkIn: existing.checkIn, checkOut: existing.checkOut, roomType: existing.roomType, supplierId: existing.supplierId, costSAR: existing.costSAR || 0, exchangeRate: existing.exchangeRate || 73.9, salePrice: existing.salePrice, status: existing.status }); } }, [existing]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const payload = {
      ...form,
      costSAR: Number(form.costSAR),
      exchangeRate: Number(form.exchangeRate),
      costPrice: 0,
      salePrice: Number(form.salePrice),
      createdBy: user.id,
    };
    if (existing) await updateHotel(existing.id, payload);
    else await addHotel(payload);
    if ((e.nativeEvent as SubmitEvent).submitter?.getAttribute("name") === "addAnother") {
      window.location.reload();
      return;
    }
    router.push("/hotels");
  };

  return (
    <div>
      <PageHeader title={existing ? "Edit Hotel Booking" : "Add Hotel Booking"} breadcrumb="Home / Hotels / New" />
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
          {showCost ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <SarCostFields
                costSAR={form.costSAR}
                exchangeRate={form.exchangeRate}
                salePrice={form.salePrice}
                onChange={(patch) => setForm({ ...form, ...patch })}
              />
            </div>
          ) : (
            <Input
              label="Sale Price (PKR)"
              type="number"
              min={0}
              required
              value={form.salePrice}
              onChange={(e) => setForm({ ...form, salePrice: Number(e.target.value) })}
            />
          )}
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
          <div className="flex justify-end gap-2 sm:col-span-2 lg:col-span-3">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" name="addAnother" variant="secondary"><Plus size={15} /> Save &amp; Add Another</Button>
            <Button type="submit">Save Booking</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
