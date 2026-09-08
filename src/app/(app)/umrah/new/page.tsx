"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { computeBookingTotals, normalizeServiceItem, normalizeTicketLine } from "@/lib/booking-calc";
import { calcProfit, formatPKR, nextId, todayISO } from "@/lib/format";
import type { BookingServiceItem, BookingServiceKind, BookingStatus, BookingTicketLine } from "@/lib/types";
import { SarCostFields } from "@/components/SarCostFields";
import { Button, Card, Input, PageHeader, Select } from "@/components/ui";

function emptyTicket(exchangeRate: number): BookingTicketLine {
  return normalizeTicketLine({ passengerName: "", airline: "", pnr: "", ticketNumber: "", sector: "", travelDate: todayISO(), supplierId: "", costSAR: 0, exchangeRate, salePrice: 0 });
}

function emptyService(kind: BookingServiceKind, exchangeRate: number): BookingServiceItem {
  return normalizeServiceItem(kind === "ticket"
    ? { kind, title: "Tickets", supplierId: "", details: {}, tickets: [emptyTicket(exchangeRate)] }
    : { kind, title: kind[0].toUpperCase() + kind.slice(1), supplierId: "", details: {}, costSAR: 0, exchangeRate, salePrice: 0 });
}

export default function NewUmrahPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAppStore((s) => s.currentUser);
  const customers = useAppStore((s) => s.customers);
  const suppliers = useAppStore((s) => s.suppliers);
  const exchangeRates = useAppStore((s) => s.exchangeRates);
  const addUmrah = useAppStore((s) => s.addUmrah);
  const updateUmrah = useAppStore((s) => s.updateUmrah);
  const existing = useAppStore((s) => s.umrahPackages.find((packageRecord) => packageRecord.id === searchParams.get("edit")));
  const showCost = user?.role === "super_admin" || !!user?.permissions.viewCost;
  const showProfit = user?.role === "super_admin" || !!user?.permissions.viewProfit;

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
  const [services, setServices] = useState<BookingServiceItem[]>([
    emptyService("visa", exchangeRates.SAR || 73.9),
  ]);
  const [addKind, setAddKind] = useState<BookingServiceKind>("hotel");
  const [saving, setSaving] = useState(false);
  // Edit mode hydrates the existing package and its nested services.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (existing) { setForm({ customerId: existing.customerId, packageName: existing.packageName, includesVisa: existing.includesVisa, includesTicket: existing.includesTicket, includesHotel: existing.includesHotel, includesTransport: existing.includesTransport, travelDate: existing.travelDate, returnDate: existing.returnDate, costPrice: existing.costPrice, salePrice: existing.salePrice, status: existing.status }); setServices(existing.services?.length ? existing.services : [emptyService("visa", exchangeRates.SAR || 73.9)]); } }, [existing, exchangeRates.SAR]);
  const totals = useMemo(() => computeBookingTotals(services), [services]);

  const updateService = (index: number, patch: Partial<BookingServiceItem>) => setServices((prev) => {
    const next = [...prev];
    next[index] = normalizeServiceItem({ ...next[index], ...patch });
    return next;
  });

  const updateTicket = (serviceIndex: number, ticketIndex: number, patch: Partial<BookingTicketLine>) => setServices((prev) => {
    const next = [...prev];
    const service = next[serviceIndex];
    const tickets = [...(service.tickets ?? [])];
    tickets[ticketIndex] = normalizeTicketLine({ ...tickets[ticketIndex], ...patch });
    next[serviceIndex] = normalizeServiceItem({ ...service, tickets });
    return next;
  });

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    if (!user) return;
    setSaving(true);
    try {
      const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
      const costSAR = services.reduce((sum, service) => sum + service.costSAR, 0);
      const payload = {
      ...form,
      includesVisa: services.some((service) => service.kind === "visa"),
      includesTicket: services.some((service) => service.kind === "ticket"),
      includesHotel: services.some((service) => service.kind === "hotel"),
      includesTransport: services.some((service) => service.kind === "transport"),
      costPrice: totals.totalCostPKR || Number(form.costPrice),
      salePrice: totals.totalSale || Number(form.salePrice),
      costSAR,
      exchangeRate: exchangeRates.SAR || 73.9,
      services,
      createdBy: user.id,
      };
      if (existing) await updateUmrah(existing.id, payload);
      else await addUmrah(payload);
      if (submitter?.name === "addAnother") {
        setForm((prev) => ({ ...prev, packageName: "", costPrice: 0, salePrice: 0 }));
        setServices([emptyService("visa", exchangeRates.SAR || 73.9)]);
        setSaving(false);
        return;
      }
      router.push("/umrah");
    } catch {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title={existing ? "Edit Umrah Package" : "New Umrah Package"} breadcrumb="Home / Umrah / New" />
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

          <div className="sm:col-span-2 lg:col-span-3 space-y-3">
            <p className="text-sm font-semibold text-slate-700">Package Services</p>
            {services.map((svc, si) => (
              <div key={svc.id} className="rounded-lg border border-slate-200 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-600">{svc.kind.toUpperCase()} DETAILS</p>
                  {services.length > 1 && <button type="button" onClick={() => setServices((prev) => prev.filter((_, i) => i !== si))} className="text-rose-500"><Trash2 size={15} /></button>}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Input label="Service Title" value={svc.title} onChange={(e) => updateService(si, { title: e.target.value })} />
                  {svc.kind !== "ticket" && <Select label="Vendor / Supplier" value={svc.supplierId} onChange={(e) => updateService(si, { supplierId: e.target.value })}><option value="">Select vendor</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.type})</option>)}</Select>}
                  {svc.kind === "visa" && <><Input label="Visa Type" value={svc.details.visaType || ""} onChange={(e) => updateService(si, { details: { ...svc.details, visaType: e.target.value } })} /><Input label="Passport No" value={svc.details.passportNo || ""} onChange={(e) => updateService(si, { details: { ...svc.details, passportNo: e.target.value } })} /><Input label="Country" value={svc.details.country || ""} onChange={(e) => updateService(si, { details: { ...svc.details, country: e.target.value } })} /></>}
                  {svc.kind === "hotel" && <><Input label="Hotel Name" value={svc.details.hotelName || ""} onChange={(e) => updateService(si, { title: e.target.value || svc.title, details: { ...svc.details, hotelName: e.target.value } })} /><Input label="City" value={svc.details.city || ""} onChange={(e) => updateService(si, { details: { ...svc.details, city: e.target.value } })} /><Input label="Room Type" value={svc.details.roomType || ""} onChange={(e) => updateService(si, { details: { ...svc.details, roomType: e.target.value } })} /><Input label="Check-in" type="date" value={svc.details.checkIn || ""} onChange={(e) => updateService(si, { details: { ...svc.details, checkIn: e.target.value } })} /><Input label="Check-out" type="date" value={svc.details.checkOut || ""} onChange={(e) => updateService(si, { details: { ...svc.details, checkOut: e.target.value } })} /></>}
                  {svc.kind === "transport" && <><Input label="Type" value={svc.details.transportType || ""} onChange={(e) => updateService(si, { title: e.target.value || svc.title, details: { ...svc.details, transportType: e.target.value } })} /><Input label="Pickup" value={svc.details.pickup || ""} onChange={(e) => updateService(si, { details: { ...svc.details, pickup: e.target.value } })} /><Input label="Drop-off" value={svc.details.dropoff || ""} onChange={(e) => updateService(si, { details: { ...svc.details, dropoff: e.target.value } })} /><Input label="Date" type="date" value={svc.details.date || ""} onChange={(e) => updateService(si, { details: { ...svc.details, date: e.target.value } })} /><Input label="Vehicle" value={svc.details.vehicle || ""} onChange={(e) => updateService(si, { details: { ...svc.details, vehicle: e.target.value } })} /></>}
                </div>
                {svc.kind !== "ticket" && showCost && <SarCostFields costSAR={svc.costSAR} exchangeRate={svc.exchangeRate} salePrice={svc.salePrice} showProfit={showProfit} onChange={(patch) => updateService(si, patch)} />}
                {svc.kind === "ticket" && <div className="space-y-3"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-600">Passengers / Tickets</p><Button type="button" variant="secondary" className="!py-1 text-xs" onClick={() => updateService(si, { tickets: [...(svc.tickets ?? []), emptyTicket(exchangeRates.SAR || 73.9)] })}><Plus size={14} /> Add Ticket</Button></div>{(svc.tickets ?? []).map((tk, ti) => <div key={tk.id} className="rounded-lg bg-slate-50 p-3"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Input label="Passenger Name" required value={tk.passengerName} onChange={(e) => updateTicket(si, ti, { passengerName: e.target.value })} /><Select label="Vendor / Supplier" value={tk.supplierId} onChange={(e) => updateTicket(si, ti, { supplierId: e.target.value })}><option value="">Select vendor</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select><Input label="Airline" value={tk.airline} onChange={(e) => updateTicket(si, ti, { airline: e.target.value })} /><Input label="PNR" value={tk.pnr} onChange={(e) => updateTicket(si, ti, { pnr: e.target.value })} /><Input label="Ticket No" value={tk.ticketNumber} onChange={(e) => updateTicket(si, ti, { ticketNumber: e.target.value })} /><Input label="Sector" value={tk.sector} onChange={(e) => updateTicket(si, ti, { sector: e.target.value })} /><Input label="Travel Date" type="date" value={tk.travelDate} onChange={(e) => updateTicket(si, ti, { travelDate: e.target.value })} /></div>{showCost && <SarCostFields costSAR={tk.costSAR} exchangeRate={tk.exchangeRate} salePrice={tk.salePrice} showProfit={showProfit} onChange={(patch) => updateTicket(si, ti, patch)} />}</div>)}</div>}
              </div>
            ))}
            <div className="flex flex-wrap items-end gap-2"><div className="w-44"><Select label="Service Type" value={addKind} onChange={(e) => setAddKind(e.target.value as BookingServiceKind)}><option value="visa">Visa</option><option value="hotel">Hotel</option><option value="transport">Transport</option><option value="ticket">Tickets</option></Select></div><Button type="button" variant="secondary" onClick={() => setServices((prev) => [...prev, { ...emptyService(addKind, exchangeRates.SAR || 73.9), id: nextId("svc") }])}><Plus size={15} /> Add Service</Button></div>
          </div>

          {showCost && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 sm:col-span-2 lg:col-span-3">
              Estimated profit: {formatPKR(totals.totalProfit || calcProfit(Number(form.costPrice), Number(form.salePrice)))}
            </div>
          )}
          <div className="flex justify-end gap-2 sm:col-span-2 lg:col-span-3">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" name="addAnother" variant="secondary" disabled={saving}><Plus size={15} /> {saving ? "Saving..." : "Save & Add Another"}</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : existing ? "Update Package" : "Save Package"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
