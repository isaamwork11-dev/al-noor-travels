"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { calcProfit, sarToPkr, todayISO } from "@/lib/format";
import type { BookingStatus, Currency } from "@/lib/types";
import { SarCostFields } from "@/components/SarCostFields";
import { Button, Card, Input, PageHeader, Select } from "@/components/ui";

export default function NewAirTicketPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.currentUser);
  const customers = useAppStore((s) => s.customers);
  const suppliers = useAppStore((s) => s.suppliers);
  const addTicket = useAppStore((s) => s.addTicket);
  const showCost = user?.role === "super_admin" || !!user?.permissions.viewCost;
  const showProfit = user?.role === "super_admin" || !!user?.permissions.viewProfit;

  const [form, setForm] = useState({
    passengerName: "",
    customerId: customers[0]?.id || "",
    airline: "",
    pnr: "",
    ticketNumber: "",
    sector: "",
    issueDate: todayISO(),
    travelDate: todayISO(),
    flightTime: "",
    supplierId: suppliers[0]?.id || "",
    costSAR: 0,
    exchangeRate: 73.9,
    salePrice: 0,
    status: "Confirmed" as BookingStatus,
    currency: "PKR" as Currency,
  });

  const costPKR = sarToPkr(form.costSAR, form.exchangeRate);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    await addTicket({
      passengerName: form.passengerName,
      customerId: form.customerId,
      airline: form.airline,
      pnr: form.pnr,
      ticketNumber: form.ticketNumber,
      sector: form.sector,
      issueDate: form.issueDate,
      travelDate: form.travelDate,
      flightTime: form.flightTime,
      supplierId: form.supplierId,
      costSAR: form.costSAR,
      exchangeRate: form.exchangeRate,
      costPrice: costPKR,
      salePrice: Number(form.salePrice),
      status: form.status,
      currency: form.currency,
      createdBy: user.id,
    });
    if ((e.nativeEvent as SubmitEvent).submitter?.getAttribute("name") === "addAnother") {
      window.location.reload();
      return;
    }
    router.push("/air-tickets");
  };

  return (
    <div>
      <PageHeader title="Add Air Ticket" breadcrumb="Home / Air Tickets / New" />
      <Card title="Ticket Details">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Passenger Name"
              required
              value={form.passengerName}
              onChange={(e) => setForm({ ...form, passengerName: e.target.value })}
            />
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
              label="Airline"
              required
              value={form.airline}
              onChange={(e) => setForm({ ...form, airline: e.target.value })}
            />
            <Input
              label="PNR"
              required
              value={form.pnr}
              onChange={(e) => setForm({ ...form, pnr: e.target.value })}
            />
            <Input
              label="Ticket Number"
              value={form.ticketNumber}
              onChange={(e) => setForm({ ...form, ticketNumber: e.target.value })}
            />
            <Input
              label="Sector (e.g. KHI-JED)"
              required
              value={form.sector}
              onChange={(e) => setForm({ ...form, sector: e.target.value })}
            />
            <Input
              label="Issue Date"
              type="date"
              value={form.issueDate}
              onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
            />
            <Input
              label="Travel Date"
              type="date"
              required
              value={form.travelDate}
              onChange={(e) => setForm({ ...form, travelDate: e.target.value })}
            />
            <Input
              label="Flight Time"
              value={form.flightTime}
              onChange={(e) => setForm({ ...form, flightTime: e.target.value })}
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
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as BookingStatus })}
            >
              {["Confirmed", "Pending", "Cancelled", "Refunded", "Completed"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>

          {showCost ? (
            <SarCostFields
              costSAR={form.costSAR}
              exchangeRate={form.exchangeRate}
              salePrice={form.salePrice}
              showProfit={showProfit}
              onChange={(patch) => setForm({ ...form, ...patch })}
            />
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

          {!showCost && showProfit && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Estimated profit: PKR{" "}
              {calcProfit(costPKR, Number(form.salePrice)).toLocaleString("en-PK")}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" name="addAnother" variant="secondary"><Plus size={15} /> Save &amp; Add Another</Button>
            <Button type="submit">Save Ticket</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
