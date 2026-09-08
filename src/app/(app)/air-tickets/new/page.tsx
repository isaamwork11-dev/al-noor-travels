"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { calcProfit, formatPKR, todayISO } from "@/lib/format";
import type { BookingStatus, Currency, PassengerDetail } from "@/lib/types";
import { Button, Card, Input, PageHeader, Select } from "@/components/ui";

export default function NewAirTicketPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAppStore((s) => s.currentUser);
  const customers = useAppStore((s) => s.customers);
  const suppliers = useAppStore((s) => s.suppliers);
  const addTicket = useAppStore((s) => s.addTicket);
  const updateTicket = useAppStore((s) => s.updateTicket);
  const existingTicket = useAppStore((s) => s.airTickets.find((ticket) => ticket.id === searchParams.get("edit")));
  const showCost = user?.role === "super_admin" || !!user?.permissions.viewCost;
  const showProfit = user?.role === "super_admin" || !!user?.permissions.viewProfit;

  const [form, setForm] = useState({
    passengerName: "",
    passengerNames: [""],
    passengers: [{ fullName: "" } as PassengerDetail],
    pax: 1,
    customerId: customers[0]?.id || "",
    airline: "",
    pnr: "",
    ticketNumber: "",
    sector: "",
    issueDate: todayISO(),
    travelDate: todayISO(),
    flightTime: "",
    supplierId: suppliers[0]?.id || "",
    costPrice: 0,
    perTicketPrice: 0,
    status: "Confirmed" as BookingStatus,
    currency: "PKR" as Currency,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existingTicket) return;
    const passengers = existingTicket.passengers?.length
      ? existingTicket.passengers
      : (existingTicket.passengerNames?.length ? existingTicket.passengerNames : [existingTicket.passengerName]).map((fullName) => ({ fullName }));
    // Hydrate the edit form after the client store finishes loading the record.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      passengerName: existingTicket.passengerName,
      passengerNames: passengers.map((passenger) => passenger.fullName),
      passengers,
      pax: existingTicket.pax || passengers.length || 1,
      customerId: existingTicket.customerId,
      airline: existingTicket.airline,
      pnr: existingTicket.pnr,
      ticketNumber: existingTicket.ticketNumber,
      sector: existingTicket.sector,
      issueDate: existingTicket.issueDate,
      travelDate: existingTicket.travelDate,
      flightTime: existingTicket.flightTime,
      supplierId: existingTicket.supplierId,
      costPrice: existingTicket.costPrice,
      perTicketPrice: existingTicket.perTicketPrice || existingTicket.salePrice / (existingTicket.pax || 1),
      status: existingTicket.status,
      currency: "PKR",
    });
  }, [existingTicket]);

  const totalAmount = form.perTicketPrice * form.pax;

  const updatePax = (pax: number) => {
    const safePax = Math.max(1, pax || 1);
    setForm((current) => ({
      ...current,
      pax: safePax,
      passengerNames: Array.from({ length: safePax }, (_, index) => current.passengerNames[index] || ""),
      passengers: Array.from({ length: safePax }, (_, index) => current.passengers[index] || { fullName: current.passengerNames[index] || "" }),
    }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
      passengerName: form.passengerName,
      passengerNames: form.passengerNames,
      passengers: form.passengers,
      pax: form.pax,
      customerId: form.customerId,
      airline: form.airline,
      pnr: form.pnr,
      ticketNumber: form.ticketNumber,
      sector: form.sector,
      issueDate: form.issueDate,
      travelDate: form.travelDate,
      flightTime: form.flightTime,
      supplierId: form.supplierId,
      costPrice: Number(form.costPrice),
      perTicketPrice: Number(form.perTicketPrice),
      totalAmount,
      salePrice: totalAmount,
      status: form.status,
      currency: form.currency,
      createdBy: user.id,
      };
      if (existingTicket) await updateTicket(existingTicket.id, payload);
      else await addTicket(payload);
      if ((e.nativeEvent as SubmitEvent).submitter?.getAttribute("name") === "addAnother") {
        window.location.reload();
        return;
      }
      router.push("/air-tickets");
    } catch {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title={existingTicket ? "Edit Air Ticket" : "Add Air Ticket"} breadcrumb="Home / Air Tickets / New" />
      <Card title="Ticket Details">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="PAX" type="number" min={1} required value={form.pax} onChange={(e) => updatePax(Number(e.target.value))} />
            {form.passengerNames.map((name, index) => (
              <div key={index} className="contents">
                <Input label={`Passenger ${index + 1} Name`} required value={form.passengers[index]?.fullName || name} onChange={(e) => {
                  const passengers = [...form.passengers];
                  passengers[index] = { ...passengers[index], fullName: e.target.value };
                  setForm({ ...form, passengerName: index === 0 ? e.target.value : form.passengerName, passengerNames: passengers.map((passenger) => passenger.fullName), passengers });
                }} />
                <Input label="Passport (Optional)" value={form.passengers[index]?.passportNumber || ""} onChange={(e) => { const passengers = [...form.passengers]; passengers[index] = { ...passengers[index], passportNumber: e.target.value }; setForm({ ...form, passengers }); }} />
                <Input label="CNIC (Optional)" value={form.passengers[index]?.cnic || ""} onChange={(e) => { const passengers = [...form.passengers]; passengers[index] = { ...passengers[index], cnic: e.target.value }; setForm({ ...form, passengers }); }} />
                <Input label="Date of Birth (Optional)" type="date" value={form.passengers[index]?.dateOfBirth || ""} onChange={(e) => { const passengers = [...form.passengers]; passengers[index] = { ...passengers[index], dateOfBirth: e.target.value }; setForm({ ...form, passengers }); }} />
                <Select label="Gender (Optional)" value={form.passengers[index]?.gender || ""} onChange={(e) => { const passengers = [...form.passengers]; passengers[index] = { ...passengers[index], gender: e.target.value }; setForm({ ...form, passengers }); }}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></Select>
              </div>
            ))}
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

          <div className="grid gap-3 sm:grid-cols-3">
            {showCost && <Input label="Cost Price (PKR)" type="number" min={0} value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })} />}
            <Input label="Per Ticket Price (PKR)" type="number" min={0} required value={form.perTicketPrice} onChange={(e) => setForm({ ...form, perTicketPrice: Number(e.target.value) })} />
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm">
              <p className="text-xs text-slate-500">Total Amount</p>
              <p className="mt-1 text-lg font-bold text-blue-800">{formatPKR(totalAmount)}</p>
            </div>
          </div>

          {!showCost && showProfit && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Estimated profit: PKR{" "}
              {calcProfit(Number(form.costPrice), totalAmount).toLocaleString("en-PK")}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" name="addAnother" variant="secondary" disabled={saving}><Plus size={15} /> {saving ? "Saving..." : "Save & Add Another"}</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : existingTicket ? "Update Ticket" : "Save Ticket"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
