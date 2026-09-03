"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { formatDate, formatPKR } from "@/lib/format";
import { Card, EmptyState, PageHeader } from "@/components/ui";

const tabs = ["Sales", "Profit", "Refunds", "Visas", "Customers", "Suppliers"] as const;

export default function ReportsPage() {
  const user = useAppStore((s) => s.currentUser);
  const customers = useAppStore((s) => s.customers);
  const suppliers = useAppStore((s) => s.suppliers);
  const airTickets = useAppStore((s) => s.airTickets);
  const visas = useAppStore((s) => s.visas);
  const hotels = useAppStore((s) => s.hotels);
  const transports = useAppStore((s) => s.transports);
  const umrahPackages = useAppStore((s) => s.umrahPackages);
  const tourPackages = useAppStore((s) => s.tourPackages);
  const refunds = useAppStore((s) => s.refunds);

  const [tab, setTab] = useState<(typeof tabs)[number]>("Sales");
  const showProfit = user?.role === "super_admin" || !!user?.permissions.viewProfit;
  const showCost = user?.role === "super_admin" || !!user?.permissions.viewCost;
  const canFinancial =
    user?.role === "super_admin" ||
    !!user?.permissions.viewFinancialReports ||
    showProfit ||
    showCost;

  const salesByService = useMemo(() => {
    return [
      { name: "Air Tickets", sales: airTickets.reduce((a, t) => a + t.salePrice, 0), cost: airTickets.reduce((a, t) => a + t.costPrice, 0), count: airTickets.length },
      { name: "Visas", sales: visas.reduce((a, t) => a + t.salePrice, 0), cost: visas.reduce((a, t) => a + t.costPrice, 0), count: visas.length },
      { name: "Hotels", sales: hotels.reduce((a, t) => a + t.salePrice, 0), cost: hotels.reduce((a, t) => a + t.costPrice, 0), count: hotels.length },
      { name: "Transport", sales: transports.reduce((a, t) => a + t.salePrice, 0), cost: transports.reduce((a, t) => a + t.costPrice, 0), count: transports.length },
      { name: "Umrah", sales: umrahPackages.reduce((a, t) => a + t.salePrice, 0), cost: umrahPackages.reduce((a, t) => a + t.costPrice, 0), count: umrahPackages.length },
      { name: "Tours", sales: tourPackages.reduce((a, t) => a + t.salePrice, 0), cost: tourPackages.reduce((a, t) => a + t.costPrice, 0), count: tourPackages.length },
    ];
  }, [airTickets, visas, hotels, transports, umrahPackages, tourPackages]);

  const visibleTabs = tabs.filter((t) => {
    if (t === "Profit" && !showProfit && !canFinancial) return false;
    return true;
  });

  return (
    <div>
      <PageHeader title="Reports" breadcrumb="Home / Reports" />
      <Card title="Business Reports">
        <div className="mb-4 flex flex-wrap gap-1 border-b border-slate-100 pb-2">
          {visibleTabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                tab === t ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Sales" && (
          <ReportTable
            headers={["Service", "Bookings", "Sales"]}
            rows={salesByService.map((s) => [s.name, s.count, formatPKR(s.sales)])}
          />
        )}

        {tab === "Profit" && (
          !showProfit && !canFinancial ? (
            <EmptyState message="Profit report hidden for your role." />
          ) : (
            <ReportTable
              headers={["Service", ...(showCost ? ["Cost"] : []), "Sales", ...(showProfit ? ["Profit"] : [])]}
              rows={salesByService.map((s) => [
                s.name,
                ...(showCost ? [formatPKR(s.cost)] : []),
                formatPKR(s.sales),
                ...(showProfit ? [formatPKR(s.sales - s.cost)] : []),
              ])}
            />
          )
        )}

        {tab === "Refunds" && (
          refunds.length === 0 ? (
            <EmptyState message="No refunds recorded." />
          ) : (
            <ReportTable
              headers={["Booking", "Customer", "Type", "Refund", "Status", "Date"]}
              rows={refunds.map((r) => [
                r.bookingId,
                r.customerName,
                r.refundType,
                formatPKR(r.refundAmount),
                r.status,
                formatDate(r.createdAt),
              ])}
            />
          )
        )}

        {tab === "Visas" && (
          visas.length === 0 ? (
            <EmptyState message="No visa records." />
          ) : (
            <ReportTable
              headers={["Type", "Count", "Sales"]}
              rows={Object.entries(
                visas.reduce<Record<string, { count: number; sales: number }>>((acc, v) => {
                  acc[v.visaType] = acc[v.visaType] || { count: 0, sales: 0 };
                  acc[v.visaType].count += 1;
                  acc[v.visaType].sales += v.salePrice;
                  return acc;
                }, {})
              ).map(([type, d]) => [type, d.count, formatPKR(d.sales)])}
            />
          )
        )}

        {tab === "Customers" && (
          <ReportTable
            headers={["Customer", "Mobile", "Outstanding", "Joined"]}
            rows={customers.map((c) => [c.name, c.mobile, formatPKR(c.outstanding), formatDate(c.createdAt)])}
          />
        )}

        {tab === "Suppliers" && (
          <ReportTable
            headers={["Supplier", "Type", "Outstanding", "Since"]}
            rows={suppliers.map((s) => [s.name, s.type, formatPKR(s.outstanding), formatDate(s.createdAt)])}
          />
        )}
      </Card>
    </div>
  );
}

function ReportTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | number)[][];
}) {
  if (rows.length === 0) return <EmptyState message="No data." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs text-slate-500">
            {headers.map((h) => (
              <th key={h} className="pb-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-50 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="py-2.5 text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
