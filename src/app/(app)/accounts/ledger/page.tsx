"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { formatDate, formatPKR } from "@/lib/format";
import { Card, EmptyState, PageHeader, Select } from "@/components/ui";

export default function LedgerPage() {
  const user = useAppStore((s) => s.currentUser);
  const customers = useAppStore((s) => s.customers);
  const suppliers = useAppStore((s) => s.suppliers);
  const payments = useAppStore((s) => s.payments);
  const airTickets = useAppStore((s) => s.airTickets);
  const visas = useAppStore((s) => s.visas);
  const hotels = useAppStore((s) => s.hotels);
  const transports = useAppStore((s) => s.transports);
  const umrahPackages = useAppStore((s) => s.umrahPackages);
  const tourPackages = useAppStore((s) => s.tourPackages);

  const canView = user?.role === "super_admin" || !!user?.permissions.viewAccounts;
  const [partyType, setPartyType] = useState<"Customer" | "Supplier">("Customer");
  const [partyId, setPartyId] = useState(customers[0]?.id || "");

  const parties = partyType === "Customer" ? customers : suppliers;

  const entries = useMemo(() => {
    if (!partyId) return [];
    const rows: { date: string; ref: string; description: string; debit: number; credit: number }[] = [];

    if (partyType === "Customer") {
      const sales = [
        ...airTickets.filter((t) => t.customerId === partyId).map((t) => ({
          date: t.createdAt,
          ref: t.bookingId,
          description: `Air ticket ${t.sector}`,
          debit: t.salePrice,
          credit: 0,
        })),
        ...visas.filter((v) => v.customerId === partyId).map((v) => ({
          date: v.createdAt,
          ref: v.bookingId,
          description: v.visaType,
          debit: v.salePrice,
          credit: 0,
        })),
        ...hotels.filter((h) => h.customerId === partyId).map((h) => ({
          date: h.createdAt,
          ref: h.bookingId,
          description: `Hotel ${h.hotelName}`,
          debit: h.salePrice,
          credit: 0,
        })),
        ...transports.filter((t) => t.customerId === partyId).map((t) => ({
          date: t.createdAt,
          ref: t.bookingId,
          description: t.type,
          debit: t.salePrice,
          credit: 0,
        })),
        ...umrahPackages.filter((u) => u.customerId === partyId).map((u) => ({
          date: u.createdAt,
          ref: u.bookingId,
          description: u.packageName,
          debit: u.salePrice,
          credit: 0,
        })),
        ...tourPackages.filter((t) => t.customerId === partyId).map((t) => ({
          date: t.createdAt,
          ref: t.bookingId,
          description: t.packageName,
          debit: t.salePrice,
          credit: 0,
        })),
      ];
      const pays = payments
        .filter((p) => p.type === "Customer" && p.partyId === partyId && p.status === "Paid")
        .map((p) => ({
          date: p.paidDate || p.createdAt,
          ref: p.id,
          description: p.note || "Payment received",
          debit: 0,
          credit: p.amountPKR,
        }));
      rows.push(...sales, ...pays);
    } else {
      const costs = [
        ...airTickets.filter((t) => t.supplierId === partyId).map((t) => ({
          date: t.createdAt,
          ref: t.bookingId,
          description: `Ticket cost ${t.sector}`,
          debit: 0,
          credit: t.costPrice,
        })),
        ...hotels.filter((h) => h.supplierId === partyId).map((h) => ({
          date: h.createdAt,
          ref: h.bookingId,
          description: `Hotel cost ${h.hotelName}`,
          debit: 0,
          credit: h.costPrice,
        })),
      ];
      const pays = payments
        .filter((p) => p.type === "Supplier" && p.partyId === partyId && p.status === "Paid")
        .map((p) => ({
          date: p.paidDate || p.createdAt,
          ref: p.id,
          description: p.note || "Payment made",
          debit: p.amountPKR,
          credit: 0,
        }));
      rows.push(...costs, ...pays);
    }

    return rows.sort((a, b) => a.date.localeCompare(b.date));
  }, [
    partyId,
    partyType,
    airTickets,
    visas,
    hotels,
    transports,
    umrahPackages,
    tourPackages,
    payments,
  ]);

  const withBalance = entries.reduce<{ date: string; ref: string; description: string; debit: number; credit: number; balance: number }[]>(
    (result, entry) => {
      const previous = result[result.length - 1]?.balance || 0;
      result.push({ ...entry, balance: previous + entry.debit - entry.credit });
      return result;
    },
    []
  );

  if (!canView) {
    return (
      <div>
        <PageHeader title="Ledgers" breadcrumb="Home / Accounts / Ledgers" />
        <Card>
          <EmptyState message="You do not have permission to view accounts." />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Party Ledgers" breadcrumb="Home / Accounts / Ledgers" />
      <Card title="Ledger">
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <Select
            label="Party Type"
            value={partyType}
            onChange={(e) => {
              const t = e.target.value as "Customer" | "Supplier";
              setPartyType(t);
              setPartyId(t === "Customer" ? customers[0]?.id || "" : suppliers[0]?.id || "");
            }}
          >
            <option value="Customer">Customer</option>
            <option value="Supplier">Supplier</option>
          </Select>
          <Select
            label="Party"
            value={partyId}
            onChange={(e) => setPartyId(e.target.value)}
          >
            {parties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>

        {withBalance.length === 0 ? (
          <EmptyState message="No ledger entries for this party." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Ref</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium">Debit</th>
                  <th className="pb-2 font-medium">Credit</th>
                  <th className="pb-2 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {withBalance.map((e, i) => (
                  <tr key={`${e.ref}-${i}`} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 text-slate-600">{formatDate(e.date)}</td>
                    <td className="py-2.5 font-medium text-blue-700">{e.ref}</td>
                    <td className="py-2.5 text-slate-700">{e.description}</td>
                    <td className="py-2.5 font-semibold text-rose-700">{e.debit ? formatPKR(e.debit) : "—"}</td>
                    <td className="py-2.5 font-semibold text-emerald-700">{e.credit ? formatPKR(e.credit) : "—"}</td>
                    <td className="py-2.5 font-medium text-slate-800">{formatPKR(e.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
