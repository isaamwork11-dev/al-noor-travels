"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BadgeCheck, Bus, FileText, Hotel, Plane, Plus, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import {
  computeBookingTotals,
  normalizeServiceItem,
  normalizeTicketLine,
} from "@/lib/booking-calc";
import { formatPKR, nextId, todayISO } from "@/lib/format";
import type {
  BookingServiceItem,
  BookingServiceKind,
  BookingStatus,
  BookingTicketLine,
} from "@/lib/types";
import { SarCostFields } from "@/components/SarCostFields";
import { Button, Card, Input, PageHeader, Select } from "@/components/ui";
import { cn } from "@/components/ui";

function emptyTicket(exchangeRate: number): BookingTicketLine {
  return normalizeTicketLine({
    passengerName: "",
    airline: "",
    pnr: "",
    ticketNumber: "",
    sector: "",
    travelDate: todayISO(),
    returnDate: "",
    tripType: "Oneway",
    supplierId: "",
    costSAR: 0,
    exchangeRate,
    salePrice: 0,
  });
}

function emptyService(kind: BookingServiceKind, exchangeRate: number): BookingServiceItem {
  if (kind === "ticket") {
    return normalizeServiceItem({
      kind: "ticket",
      title: "Tickets",
      supplierId: "",
      details: {},
      tickets: [emptyTicket(exchangeRate)],
    });
  }
  return normalizeServiceItem({
    kind,
    title: kind.charAt(0).toUpperCase() + kind.slice(1),
    supplierId: "",
    details: {},
    costSAR: 0,
    exchangeRate,
    salePrice: 0,
  });
}

const KIND_META: { kind: BookingServiceKind; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string }[] = [
  { kind: "ticket", label: "Ticket", icon: Plane, color: "from-blue-500 to-blue-600 shadow-blue-200" },
  { kind: "visa", label: "Visa", icon: FileText, color: "from-emerald-500 to-emerald-600 shadow-emerald-200" },
  { kind: "hotel", label: "Hotel", icon: Hotel, color: "from-violet-500 to-violet-600 shadow-violet-200" },
  { kind: "transport", label: "Transport", icon: Bus, color: "from-orange-500 to-orange-600 shadow-orange-200" },
  { kind: "umrah", label: "Umrah", icon: BadgeCheck, color: "from-cyan-500 to-cyan-600 shadow-cyan-200" },
];

export default function NewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAppStore((s) => s.currentUser);
  const customers = useAppStore((s) => s.customers);
  const suppliers = useAppStore((s) => s.suppliers);
  const exchangeRates = useAppStore((s) => s.exchangeRates);
  const addTravelBooking = useAppStore((s) => s.addTravelBooking);
  const updateTravelBooking = useAppStore((s) => s.updateTravelBooking);
  const existing = useAppStore((s) => s.travelBookings.find((booking) => booking.id === searchParams.get("edit")));
  const showCost = user?.role === "super_admin" || !!user?.permissions.viewCost;
  const showProfit = user?.role === "super_admin" || !!user?.permissions.viewProfit;

  const kindParam = (searchParams.get("kind") || "") as BookingServiceKind;
  const validKind = KIND_META.some((k) => k.kind === kindParam);

  const [header, setHeader] = useState({
    customerId: customers[0]?.id || "",
    title: "",
    travelDate: todayISO(),
    returnDate: todayISO(),
    status: "Confirmed" as BookingStatus,
    notes: "",
  });
  const [services, setServices] = useState<BookingServiceItem[]>(() =>
    validKind ? [emptyService(kindParam, exchangeRates.SAR || 73.9)] : []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Edit mode hydrates the booking after the client store has loaded it.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (existing) { setHeader({ customerId: existing.customerId, title: existing.title, travelDate: existing.travelDate, returnDate: existing.returnDate, status: existing.status, notes: existing.notes }); setServices(existing.services); } }, [existing]);

  const totals = useMemo(() => computeBookingTotals(services), [services]);

  const addService = (kind: BookingServiceKind) => {
    setServices((prev) => [
      ...prev,
      { ...emptyService(kind, exchangeRates.SAR || 73.9), id: nextId("svc") },
    ]);
  };

  const updateService = (index: number, patch: Partial<BookingServiceItem>) => {
    setServices((prev) => {
      const next = [...prev];
      next[index] = normalizeServiceItem({ ...next[index], ...patch });
      return next;
    });
  };

  const updateTicket = (
    serviceIndex: number,
    ticketIndex: number,
    patch: Partial<BookingTicketLine>
  ) => {
    setServices((prev) => {
      const next = [...prev];
      const svc = next[serviceIndex];
      const tickets = [...(svc.tickets ?? [])];
      tickets[ticketIndex] = normalizeTicketLine({ ...tickets[ticketIndex], ...patch });
      next[serviceIndex] = normalizeServiceItem({ ...svc, tickets });
      return next;
    });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!header.customerId) {
      setError("Select a customer.");
      return;
    }
    if (services.length === 0) {
      setError("Pick a category above and add at least one service.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...header,
        services,
        createdBy: user.id,
      };
      if (existing) await updateTravelBooking(existing.id, payload);
      else await addTravelBooking(payload);
      router.push("/bookings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save booking");
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title={existing ? "Edit Travel Booking" : "New Entry"} breadcrumb="Home / Bookings / New Entry" />

      <form onSubmit={onSubmit} className="space-y-4">
        <Card title="1 · What are you entering? (Ticket / Visa / Hotel / Transport / Umrah)">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {KIND_META.map(({ kind, label, icon: Icon, color }) => (
              <button
                key={kind}
                type="button"
                onClick={() => addService(kind)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl bg-gradient-to-br p-3 text-left text-sm font-semibold text-white shadow-md transition hover:scale-[1.02]",
                  color
                )}
              >
                <Icon size={18} />
                {label}
                <Plus size={14} className="ml-auto opacity-70" />
              </button>
            ))}
          </div>
          {services.length > 0 && (
            <p className="mt-2 text-xs text-slate-400">
              Tap a category anytime to add more services to this entry.
            </p>
          )}
        </Card>

        <Card title="2 · Booking Details">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Select
              label="Customer"
              required
              value={header.customerId}
              onChange={(e) => setHeader({ ...header, customerId: e.target.value })}
            >
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Input
              label="Booking Title"
              value={header.title}
              onChange={(e) => setHeader({ ...header, title: e.target.value })}
              placeholder="e.g. Umrah Family Package"
            />
            <Select
              label="Status"
              value={header.status}
              onChange={(e) =>
                setHeader({ ...header, status: e.target.value as BookingStatus })
              }
            >
              {["Confirmed", "Pending", "Cancelled", "Completed"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Input
              label="Travel Date"
              type="date"
              value={header.travelDate}
              onChange={(e) => setHeader({ ...header, travelDate: e.target.value })}
            />
            <Input
              label="Return Date"
              type="date"
              value={header.returnDate}
              onChange={(e) => setHeader({ ...header, returnDate: e.target.value })}
            />
            <Input
              label="Notes"
              value={header.notes}
              onChange={(e) => setHeader({ ...header, notes: e.target.value })}
            />
          </div>
        </Card>

        {services.length === 0 && !existing && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            No service added yet — pick a category above (Ticket, Visa, Hotel, Transport, Umrah) to start the entry.
          </div>
        )}

        {services.map((svc, si) => (
          <Card
            key={svc.id}
            title={`${svc.kind.toUpperCase()} — ${svc.title || "Service"}`}
            action={
              <button
                type="button"
                onClick={() => setServices((prev) => prev.filter((_, i) => i !== si))}
                className="text-rose-500 hover:text-rose-700"
                aria-label="Remove service"
              >
                <Trash2 size={16} />
              </button>
            }
          >
            <div className="mb-3 grid gap-3 sm:grid-cols-2">
              <Input
                label="Service Title"
                value={svc.title}
                onChange={(e) => updateService(si, { title: e.target.value })}
              />
              {svc.kind !== "ticket" && (
                <Select
                  label="Vendor / Supplier"
                  value={svc.supplierId}
                  onChange={(e) => updateService(si, { supplierId: e.target.value })}
                >
                  <option value="">Select vendor</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.type})
                    </option>
                  ))}
                </Select>
              )}
            </div>

            {/* Kind-specific detail fields */}
            {svc.kind === "visa" && (
              <div className="mb-3 grid gap-3 sm:grid-cols-3">
                <Input
                  label="Visa Type"
                  value={svc.details.visaType || ""}
                  onChange={(e) =>
                    updateService(si, {
                      details: { ...svc.details, visaType: e.target.value },
                      title: e.target.value || svc.title,
                    })
                  }
                />
                <Input
                  label="Passport No"
                  value={svc.details.passportNo || ""}
                  onChange={(e) =>
                    updateService(si, {
                      details: { ...svc.details, passportNo: e.target.value },
                    })
                  }
                />
                <Input
                  label="Country"
                  value={svc.details.country || ""}
                  onChange={(e) =>
                    updateService(si, {
                      details: { ...svc.details, country: e.target.value },
                    })
                  }
                />
              </div>
            )}

            {svc.kind === "umrah" && (
              <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Input
                  label="Package Name"
                  value={svc.details.packageName || ""}
                  onChange={(e) =>
                    updateService(si, {
                      details: { ...svc.details, packageName: e.target.value },
                      title: e.target.value || svc.title,
                    })
                  }
                />
                <Input
                  label="Hotel / Makkah-Madinah"
                  value={svc.details.hotelName || ""}
                  onChange={(e) =>
                    updateService(si, {
                      details: { ...svc.details, hotelName: e.target.value },
                    })
                  }
                />
                <Input
                  label="City"
                  value={svc.details.city || ""}
                  onChange={(e) =>
                    updateService(si, {
                      details: { ...svc.details, city: e.target.value },
                    })
                  }
                />
                <Input
                  label="Includes Visa"
                  value={svc.details.includesVisa || ""}
                  onChange={(e) =>
                    updateService(si, {
                      details: { ...svc.details, includesVisa: e.target.value },
                    })
                  }
                />
              </div>
            )}

            {svc.kind === "hotel" && (
              <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Input
                  label="Hotel Name"
                  value={svc.details.hotelName || ""}
                  onChange={(e) =>
                    updateService(si, {
                      details: { ...svc.details, hotelName: e.target.value },
                      title: e.target.value || svc.title,
                    })
                  }
                />
                <Input
                  label="City"
                  value={svc.details.city || ""}
                  onChange={(e) =>
                    updateService(si, {
                      details: { ...svc.details, city: e.target.value },
                    })
                  }
                />
                <Input
                  label="Room Type"
                  value={svc.details.roomType || ""}
                  onChange={(e) =>
                    updateService(si, {
                      details: { ...svc.details, roomType: e.target.value },
                    })
                  }
                />
                <Input
                  label="Check-in"
                  type="date"
                  value={svc.details.checkIn || ""}
                  onChange={(e) =>
                    updateService(si, {
                      details: { ...svc.details, checkIn: e.target.value },
                    })
                  }
                />
                <Input
                  label="Check-out"
                  type="date"
                  value={svc.details.checkOut || ""}
                  onChange={(e) =>
                    updateService(si, {
                      details: { ...svc.details, checkOut: e.target.value },
                    })
                  }
                />
                <Input
                  label="Reference / Confirmation No"
                  value={svc.details.referenceNumber || ""}
                  onChange={(e) =>
                    updateService(si, {
                      details: { ...svc.details, referenceNumber: e.target.value },
                    })
                  }
                />
                <Input
                  label="Hotel Contact Person (Name / No)"
                  value={svc.details.contactPerson || ""}
                  onChange={(e) =>
                    updateService(si, {
                      details: { ...svc.details, contactPerson: e.target.value },
                    })
                  }
                />
              </div>
            )}

            {svc.kind === "transport" && (
              <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Input
                  label="Type"
                  value={svc.details.transportType || ""}
                  onChange={(e) =>
                    updateService(si, {
                      details: { ...svc.details, transportType: e.target.value },
                      title: e.target.value || svc.title,
                    })
                  }
                />
                <Input
                  label="Pickup"
                  value={svc.details.pickup || ""}
                  onChange={(e) =>
                    updateService(si, {
                      details: { ...svc.details, pickup: e.target.value },
                    })
                  }
                />
                <Input
                  label="Drop-off"
                  value={svc.details.dropoff || ""}
                  onChange={(e) =>
                    updateService(si, {
                      details: { ...svc.details, dropoff: e.target.value },
                    })
                  }
                />
                <Input
                  label="Date"
                  type="date"
                  value={svc.details.date || ""}
                  onChange={(e) =>
                    updateService(si, {
                      details: { ...svc.details, date: e.target.value },
                    })
                  }
                />
                <Input
                  label="Vehicle"
                  value={svc.details.vehicle || ""}
                  onChange={(e) =>
                    updateService(si, {
                      details: { ...svc.details, vehicle: e.target.value },
                    })
                  }
                />
                <Input
                  label="Driver / Contact Person (Name / No)"
                  value={svc.details.contactPerson || ""}
                  onChange={(e) =>
                    updateService(si, {
                      details: { ...svc.details, contactPerson: e.target.value },
                    })
                  }
                />
              </div>
            )}

            {svc.kind !== "ticket" && showCost && (
              <SarCostFields
                costSAR={svc.costSAR}
                exchangeRate={svc.exchangeRate}
                salePrice={svc.salePrice}
                showProfit={showProfit}
                onChange={(patch) => updateService(si, patch)}
              />
            )}

            {svc.kind === "ticket" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">
                    Passengers / Tickets
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    className="!py-1 text-xs"
                    onClick={() =>
                      updateService(si, {
                        tickets: [...(svc.tickets ?? []), emptyTicket(exchangeRates.SAR || 73.9)],
                      })
                    }
                  >
                    <Plus size={14} /> Add Ticket
                  </Button>
                </div>

                {(svc.tickets ?? []).map((tk, ti) => (
                  <div
                    key={tk.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-600">
                        Ticket #{ti + 1}
                      </p>
                      {(svc.tickets?.length ?? 0) > 1 && (
                        <button
                          type="button"
                          className="text-rose-500"
                          onClick={() =>
                            updateService(si, {
                              tickets: (svc.tickets ?? []).filter((_, i) => i !== ti),
                            })
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <Input
                        label="Passenger Name"
                        required
                        value={tk.passengerName}
                        onChange={(e) =>
                          updateTicket(si, ti, { passengerName: e.target.value })
                        }
                      />
                      <Select
                        label="Vendor / Supplier"
                        value={tk.supplierId}
                        onChange={(e) =>
                          updateTicket(si, ti, { supplierId: e.target.value })
                        }
                      >
                        <option value="">Select vendor</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </Select>
                      <Input
                        label="Airline"
                        value={tk.airline}
                        onChange={(e) =>
                          updateTicket(si, ti, { airline: e.target.value })
                        }
                      />
                      <Input
                        label="PNR"
                        value={tk.pnr}
                        onChange={(e) => updateTicket(si, ti, { pnr: e.target.value })}
                      />
                      <Input
                        label="Ticket No"
                        value={tk.ticketNumber}
                        onChange={(e) =>
                          updateTicket(si, ti, { ticketNumber: e.target.value })
                        }
                      />
                      <Input
                        label="Sector"
                        value={tk.sector}
                        onChange={(e) =>
                          updateTicket(si, ti, { sector: e.target.value })
                        }
                      />
                      <Input
                        label="Travel Date"
                        type="date"
                        value={tk.travelDate}
                        onChange={(e) =>
                          updateTicket(si, ti, { travelDate: e.target.value })
                        }
                      />
                      <Select
                        label="Trip Type"
                        value={tk.tripType || "Oneway"}
                        onChange={(e) =>
                          updateTicket(si, ti, { tripType: e.target.value as "Oneway" | "Return" })
                        }
                      >
                        <option value="Oneway">One Way</option>
                        <option value="Return">Return</option>
                      </Select>
                      {tk.tripType === "Return" && (
                        <Input
                          label="Return Date"
                          type="date"
                          value={tk.returnDate || ""}
                          onChange={(e) =>
                            updateTicket(si, ti, { returnDate: e.target.value })
                          }
                        />
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {showCost && <Input label="Cost Price (PKR)" type="number" min={0} value={tk.costPKR} onChange={(e) => updateTicket(si, ti, { costPKR: Number(e.target.value), costSAR: 0, exchangeRate: 0 })} />}
                      <Input label="Per Ticket Price (PKR)" type="number" min={0} required value={tk.salePrice} onChange={(e) => updateTicket(si, ti, { salePrice: Number(e.target.value) })} />
                      {showProfit && <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm"><p className="text-xs text-slate-500">Profit</p><p className="mt-1 font-bold text-emerald-700">{formatPKR(tk.profit)}</p></div>}
                    </div>
                  </div>
                ))}

                {(showCost || showProfit) && (
                  <div className="flex flex-wrap gap-4 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm">
                    {showCost && (
                      <span>
                        Tickets cost: <strong>{formatPKR(svc.costPKR)}</strong>
                      </span>
                    )}
                    <span>
                      Tickets sale: <strong>{formatPKR(svc.salePrice)}</strong>
                    </span>
                    {showProfit && (
                      <span className={svc.profit >= 0 ? "text-emerald-700" : "text-rose-600"}>
                        Tickets profit: <strong>{formatPKR(svc.profit)}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}

        <Card title="3 · Booking Totals">
          <div className="grid gap-3 sm:grid-cols-3">
            {showCost && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Total Cost (PKR)</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {formatPKR(totals.totalCostPKR)}
                </p>
              </div>
            )}
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs text-slate-500">Total Sale (PKR)</p>
              <p className="mt-1 text-xl font-bold text-blue-800">
                {formatPKR(totals.totalSale)}
              </p>
            </div>
            {showProfit && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs text-slate-500">Overall Profit</p>
                <p
                  className={`mt-1 text-xl font-bold ${
                    totals.totalProfit >= 0 ? "text-emerald-700" : "text-rose-600"
                  }`}
                >
                  {formatPKR(totals.totalProfit)}
                </p>
              </div>
            )}
          </div>
        </Card>

        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : existing ? "Update Booking" : "Save Entry"}
          </Button>
        </div>
      </form>
    </div>
  );
}