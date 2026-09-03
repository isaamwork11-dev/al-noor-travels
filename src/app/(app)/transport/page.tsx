"use client";

import Link from "next/link";
import { FileDown, Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatDate, formatPKR } from "@/lib/format";
import { generateVoucherPDF } from "@/lib/pdf";
import { Button, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";

export default function TransportPage() {
  const user = useAppStore((s) => s.currentUser);
  const transports = useAppStore((s) => s.transports);
  const customers = useAppStore((s) => s.customers);
  const showCost = user?.role === "super_admin" || !!user?.permissions.viewCost;
  const showProfit = user?.role === "super_admin" || !!user?.permissions.viewProfit;
  const canCreate = user?.role === "super_admin" || !!user?.permissions.createRecords;
  const customerName = (id: string) => customers.find((c) => c.id === id)?.name || "—";

  const download = (t: (typeof transports)[0]) => {
    generateVoucherPDF({
      kind: "transport",
      bookingId: t.bookingId,
      customerName: customerName(t.customerId),
      lines: [
        { label: "Type", value: t.type },
        { label: "Pickup", value: t.pickup },
        { label: "Drop-off", value: t.dropoff },
        { label: "Date", value: formatDate(t.date) },
        { label: "Time", value: t.time },
        { label: "Vehicle", value: t.vehicle },
        { label: "Driver", value: t.driver },
      ],
      amount: formatPKR(t.salePrice),
    });
  };

  return (
    <div>
      <PageHeader title="Transport Management" breadcrumb="Home / Transport" />
      <Card
        title="All Transfers"
        action={
          canCreate ? (
            <Link href="/transport/new">
              <Button>
                <Plus size={16} /> Add Transfer
              </Button>
            </Link>
          ) : undefined
        }
      >
        {transports.length === 0 ? (
          <EmptyState message="No transport bookings yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="pb-2 font-medium">Booking</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Route</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Vehicle</th>
                  {showCost && <th className="pb-2 font-medium">Cost</th>}
                  <th className="pb-2 font-medium">Sale</th>
                  {showProfit && <th className="pb-2 font-medium">Profit</th>}
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Voucher</th>
                </tr>
              </thead>
              <tbody>
                {transports.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 font-medium text-blue-700">{t.bookingId}</td>
                    <td className="py-2.5 text-slate-800">{customerName(t.customerId)}</td>
                    <td className="py-2.5 text-slate-600">{t.type}</td>
                    <td className="py-2.5 text-slate-600">
                      {t.pickup} → {t.dropoff}
                    </td>
                    <td className="py-2.5 text-slate-600">
                      {formatDate(t.date)} {t.time}
                    </td>
                    <td className="py-2.5 text-slate-600">{t.vehicle}</td>
                    {showCost && <td className="py-2.5">{formatPKR(t.costPrice)}</td>}
                    <td className="py-2.5 font-medium">{formatPKR(t.salePrice)}</td>
                    {showProfit && (
                      <td className="py-2.5 font-medium text-emerald-700">{formatPKR(t.profit)}</td>
                    )}
                    <td className="py-2.5">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-2.5">
                      <Button variant="ghost" className="!px-2 !py-1" onClick={() => download(t)}>
                        <FileDown size={14} /> PDF
                      </Button>
                    </td>
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
