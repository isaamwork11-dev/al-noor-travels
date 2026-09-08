"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { todayISO } from "@/lib/format";
import type { BookingStatus, TransportType } from "@/lib/types";
import { SarCostFields } from "@/components/SarCostFields";
import { Button, Card, Input, PageHeader, Select } from "@/components/ui";

const types: TransportType[] = ["Airport Transfer", "Ziyarat Transport", "Local Transport"];

export default function NewTransportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAppStore((s) => s.currentUser);
  const customers = useAppStore((s) => s.customers);
  const addTransport = useAppStore((s) => s.addTransport);
  const updateTransport = useAppStore((s) => s.updateTransport);
  const existing = useAppStore((s) => s.transports.find((transport) => transport.id === searchParams.get("edit")));
  const showCost = user?.role === "super_admin" || !!user?.permissions.viewCost;

  const [form, setForm] = useState({
    customerId: customers[0]?.id || "",
    type: "Airport Transfer" as TransportType,
    pickup: "",
    dropoff: "",
    date: todayISO(),
    time: "10:00",
    vehicle: "Hiace",
    driver: "",
    costSAR: 0,
    exchangeRate: 73.9,
    salePrice: 0,
    status: "Confirmed" as BookingStatus,
  });

  // Edit mode hydrates from the client store after the record becomes available.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (existing) { setForm({ customerId: existing.customerId, type: existing.type, pickup: existing.pickup, dropoff: existing.dropoff, date: existing.date, time: existing.time, vehicle: existing.vehicle, driver: existing.driver, costSAR: existing.costSAR || 0, exchangeRate: existing.exchangeRate || 73.9, salePrice: existing.salePrice, status: existing.status }); } }, [existing]);

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
    if (existing) await updateTransport(existing.id, payload);
    else await addTransport(payload);
    if ((e.nativeEvent as SubmitEvent).submitter?.getAttribute("name") === "addAnother") {
      window.location.reload();
      return;
    }
    router.push("/transport");
  };

  return (
    <div>
      <PageHeader title={existing ? "Edit Transfer" : "Add Transfer"} breadcrumb="Home / Transport / New" />
      <Card title="Transfer Details">
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
          <Select
            label="Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as TransportType })}
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Input
            label="Pickup"
            required
            value={form.pickup}
            onChange={(e) => setForm({ ...form, pickup: e.target.value })}
          />
          <Input
            label="Drop-off"
            required
            value={form.dropoff}
            onChange={(e) => setForm({ ...form, dropoff: e.target.value })}
          />
          <Input
            label="Date"
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <Input
            label="Time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
          />
          <Input
            label="Vehicle"
            value={form.vehicle}
            onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
          />
          <Input
            label="Driver"
            value={form.driver}
            onChange={(e) => setForm({ ...form, driver: e.target.value })}
          />
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
            <Button type="submit">Save Transfer</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
