"use client";

import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { formatDate, formatPKR } from "@/lib/format";
import { Button, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";

export default function AccountsPage() {
  const user = useAppStore((s) => s.currentUser);
  const customers = useAppStore((s) => s.customers);
  const suppliers = useAppStore((s) => s.suppliers);
  const payments = useAppStore((s) => s.payments);
  const markPaymentPaid = useAppStore((s) => s.markPaymentPaid);

  const canView =
    user?.role === "super_admin" || !!user?.permissions.viewAccounts;

  if (!canView) {
    return (
      <div>
        <PageHeader title="Accounts & Finance" breadcrumb="Home / Accounts" />
        <Card>
          <EmptyState message="You do not have permission to view accounts." />
        </Card>
      </div>
    );
  }

  const receivables = customers.filter((c) => c.outstanding > 0);
  const payables = suppliers.filter((s) => s.outstanding > 0);
  const pending = payments.filter((p) => p.status !== "Paid");

  return (
    <div>
      <PageHeader title="Accounts Overview" breadcrumb="Home / Accounts" />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/accounts/cashbook">
          <Button variant="secondary">Cash Book</Button>
        </Link>
        <Link href="/accounts/ledger">
          <Button variant="secondary">Ledgers</Button>
        </Link>
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        <Card title="Customer Receivables">
          <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm">
            Total:{" "}
            <span className="font-bold text-rose-700">
              {formatPKR(receivables.reduce((a, c) => a + c.outstanding, 0))}
            </span>
          </div>
          {receivables.length === 0 ? (
            <EmptyState message="No outstanding receivables." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500">
                    <th className="pb-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium">Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {receivables.map((c) => (
                    <tr key={c.id} className="border-b border-slate-50">
                      <td className="py-2 text-slate-800">{c.name}</td>
                      <td className="py-2 font-medium text-rose-700">{formatPKR(c.outstanding)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Supplier Payables">
          <div className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm">
            Total:{" "}
            <span className="font-bold text-amber-800">
              {formatPKR(payables.reduce((a, s) => a + s.outstanding, 0))}
            </span>
          </div>
          {payables.length === 0 ? (
            <EmptyState message="No outstanding payables." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500">
                    <th className="pb-2 font-medium">Supplier</th>
                    <th className="pb-2 font-medium">Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {payables.map((s) => (
                    <tr key={s.id} className="border-b border-slate-50">
                      <td className="py-2 text-slate-800">{s.name}</td>
                      <td className="py-2 font-medium text-amber-800">{formatPKR(s.outstanding)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Card title="Pending Payments">
        {pending.length === 0 ? (
          <EmptyState message="No pending payments." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Party</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Due</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50">
                    <td className="py-2 text-slate-600">{p.type}</td>
                    <td className="py-2 text-slate-800">{p.partyName}</td>
                    <td className="py-2 font-medium">{formatPKR(p.amountPKR)}</td>
                    <td className="py-2 text-slate-600">{formatDate(p.dueDate)}</td>
                    <td className="py-2">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-2">
                      <Button
                        variant="secondary"
                        className="!px-2 !py-1 text-xs"
                        onClick={() => markPaymentPaid(p.id)}
                      >
                        Mark Paid
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
