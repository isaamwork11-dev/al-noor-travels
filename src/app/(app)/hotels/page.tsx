"use client";

import Link from "next/link";
import { FileDown, Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatDate, formatPKR } from "@/lib/format";
import { generateVoucherPDF } from "@/lib/pdf";
import { Button, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";

export default function HotelsPage() {
  const user = useAppStore((s) => s.currentUser);
  const hotels = useAppStore((s) => s.hotels);
  const customers = useAppStore((s) => s.customers);
  const showCost = user?.role === "super_admin" || !!user?.permissions.viewCost;
  const showProfit = user?.role === "super_admin" || !!user?.permissions.viewProfit;
  const canCreate = user?.role === "super_admin" || !!user?.permissions.createRecords;
  const customerName = (id: string) => customers.find((c) => c.id === id)?.name || "—";

  const download = (h: (typeof hotels)[0]) => {
    generateVoucherPDF({
      kind: "hotel",
      bookingId: h.bookingId,
      customerName: customerName(h.customerId),
      lines: [
        { label: "Hotel", value: h.hotelName },
        { label: "City", value: h.city },
        { label: "Room", value: h.roomType },
        { label: "Check-in", value: formatDate(h.checkIn) },
        { label: "Check-out", value: formatDate(h.checkOut) },
        { label: "Status", value: h.status },
      ],
      amount: formatPKR(h.salePrice),
    });
  };

  return (
    <div>
      <PageHeader title="Hotel Management" breadcrumb="Home / Hotels" />
      <Card
        title="All Hotel Bookings"
        action={
          canCreate ? (
            <Link href="/hotels/new">
              <Button>
                <Plus size={16} /> Add Booking
              </Button>
            </Link>
          ) : undefined
        }
      >
        {hotels.length === 0 ? (
          <EmptyState message="No hotel bookings yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="pb-2 font-medium">Booking</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Hotel</th>
                  <th className="pb-2 font-medium">City</th>
                  <th className="pb-2 font-medium">Check-in</th>
                  <th className="pb-2 font-medium">Check-out</th>
                  {showCost && <th className="pb-2 font-medium">Cost</th>}
                  <th className="pb-2 font-medium">Sale</th>
                  {showProfit && <th className="pb-2 font-medium">Profit</th>}
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Voucher</th>
                </tr>
              </thead>
              <tbody>
                {hotels.map((h) => (
                  <tr key={h.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 font-medium text-blue-700">{h.bookingId}</td>
                    <td className="py-2.5 text-slate-800">{customerName(h.customerId)}</td>
                    <td className="py-2.5 text-slate-600">{h.hotelName}</td>
                    <td className="py-2.5 text-slate-600">{h.city}</td>
                    <td className="py-2.5 text-slate-600">{formatDate(h.checkIn)}</td>
                    <td className="py-2.5 text-slate-600">{formatDate(h.checkOut)}</td>
                    {showCost && <td className="py-2.5">{formatPKR(h.costPrice)}</td>}
                    <td className="py-2.5 font-medium">{formatPKR(h.salePrice)}</td>
                    {showProfit && (
                      <td className="py-2.5 font-medium text-emerald-700">{formatPKR(h.profit)}</td>
                    )}
                    <td className="py-2.5">
                      <StatusBadge status={h.status} />
                    </td>
                    <td className="py-2.5">
                      <Button variant="ghost" className="!px-2 !py-1" onClick={() => download(h)}>
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
