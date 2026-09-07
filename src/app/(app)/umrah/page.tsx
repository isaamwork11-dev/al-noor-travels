"use client";

import Link from "next/link";
import { FileDown, Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatDate, formatDateTime, formatPKR } from "@/lib/format";
import { generateVoucherPDF } from "@/lib/pdf";
import { Button, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";

export default function UmrahPage() {
  const user = useAppStore((s) => s.currentUser);
  const umrahPackages = useAppStore((s) => s.umrahPackages);
  const customers = useAppStore((s) => s.customers);
  const showCost = user?.role === "super_admin" || !!user?.permissions.viewCost;
  const showProfit = user?.role === "super_admin" || !!user?.permissions.viewProfit;
  const canCreate =
    user?.role === "super_admin" || !!user?.permissions.createRecords;
  const customerName = (id: string) => customers.find((c) => c.id === id)?.name || "—";

  const includes = (u: (typeof umrahPackages)[0]) =>
    [
      u.includesVisa && "Visa",
      u.includesTicket && "Ticket",
      u.includesHotel && "Hotel",
      u.includesTransport && "Transport",
    ]
      .filter(Boolean)
      .join(", ") || "—";

  const download = (u: (typeof umrahPackages)[0]) => {
    generateVoucherPDF({
      kind: "umrah",
      bookingId: u.bookingId,
      customerName: customerName(u.customerId),
      lines: [
        { label: "Package", value: u.packageName },
        { label: "Includes", value: includes(u) },
        { label: "Travel", value: formatDate(u.travelDate) },
        { label: "Return", value: formatDate(u.returnDate) },
        { label: "Status", value: u.status },
      ],
      amount: formatPKR(u.salePrice),
    });
  };

  return (
    <div>
      <PageHeader title="Umrah Packages" breadcrumb="Home / Umrah" />
      <Card
        title="All Packages"
        action={
          canCreate ? (
            <Link href="/umrah/new">
              <Button>
                <Plus size={16} /> New Package
              </Button>
            </Link>
          ) : undefined
        }
      >
        {umrahPackages.length === 0 ? (
          <EmptyState message="No Umrah packages yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="pb-2 font-medium">Booking</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Package</th>
                  <th className="pb-2 font-medium">Includes</th>
                  <th className="pb-2 font-medium">Travel</th>
                  {showCost && <th className="pb-2 font-medium">Cost</th>}
                  <th className="pb-2 font-medium">Sale</th>
                  {showProfit && <th className="pb-2 font-medium">Profit</th>}
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Created</th>
                  <th className="pb-2 font-medium">Updated</th>
                  <th className="pb-2 font-medium">Voucher</th>
                </tr>
              </thead>
              <tbody>
                {umrahPackages.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 font-medium text-blue-700">{u.bookingId}</td>
                    <td className="py-2.5 text-slate-800">{customerName(u.customerId)}</td>
                    <td className="py-2.5 text-slate-600">{u.packageName}</td>
                    <td className="py-2.5 text-xs text-slate-500">{includes(u)}</td>
                    <td className="py-2.5 text-slate-600">{formatDate(u.travelDate)}</td>
                    {showCost && <td className="py-2.5">{formatPKR(u.costPrice)}</td>}
                    <td className="py-2.5 font-medium">{formatPKR(u.salePrice)}</td>
                    {showProfit && (
                      <td className="py-2.5 font-medium text-emerald-700">{formatPKR(u.profit)}</td>
                    )}
                    <td className="py-2.5">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="py-2.5 text-xs text-slate-500">{formatDateTime(u.createdAt)}</td>
                    <td className="py-2.5 text-xs text-slate-500">{formatDateTime(u.updatedAt || u.createdAt)}</td>
                    <td className="py-2.5">
                      <Button variant="ghost" className="!px-2 !py-1" onClick={() => download(u)}>
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
