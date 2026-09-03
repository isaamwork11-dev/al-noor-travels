"use client";

import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatDate, formatPKR, todayISO } from "@/lib/format";
import type { Currency } from "@/lib/types";
import { Button, Card, EmptyState, Input, Modal, PageHeader, Select } from "@/components/ui";

export default function CashBookPage() {
  const user = useAppStore((s) => s.currentUser);
  const cashBook = useAppStore((s) => s.cashBook);
  const exchangeRates = useAppStore((s) => s.exchangeRates);
  const addCashEntry = useAppStore((s) => s.addCashEntry);

  const canView = user?.role === "super_admin" || !!user?.permissions.viewAccounts;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: "Income" as "Income" | "Expense",
    category: "Sales",
    amount: 0,
    currency: "PKR" as Currency,
    description: "",
    date: todayISO(),
  });

  if (!canView) {
    return (
      <div>
        <PageHeader title="Cash Book" breadcrumb="Home / Accounts / Cash Book" />
        <Card>
          <EmptyState message="You do not have permission to view accounts." />
        </Card>
      </div>
    );
  }

  const income = cashBook.filter((e) => e.type === "Income").reduce((a, e) => a + e.amountPKR, 0);
  const expense = cashBook.filter((e) => e.type === "Expense").reduce((a, e) => a + e.amountPKR, 0);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const amount = Number(form.amount);
    const amountPKR = Math.round(amount * exchangeRates[form.currency]);
    addCashEntry({
      type: form.type,
      category: form.category,
      amount,
      currency: form.currency,
      amountPKR,
      description: form.description,
      date: form.date,
      createdBy: user.id,
    });
    setOpen(false);
    setForm({
      type: "Income",
      category: "Sales",
      amount: 0,
      currency: "PKR",
      description: "",
      date: todayISO(),
    });
  };

  return (
    <div>
      <PageHeader title="Cash Book" breadcrumb="Home / Accounts / Cash Book" />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Income</p>
          <p className="mt-1 text-lg font-bold text-emerald-700">{formatPKR(income)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Expense</p>
          <p className="mt-1 text-lg font-bold text-rose-700">{formatPKR(expense)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Net</p>
          <p className="mt-1 text-lg font-bold text-slate-800">{formatPKR(income - expense)}</p>
        </div>
      </div>

      <Card
        title="Entries"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Add Entry
          </Button>
        }
      >
        {cashBook.length === 0 ? (
          <EmptyState message="No cash book entries." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">PKR</th>
                </tr>
              </thead>
              <tbody>
                {cashBook.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 text-slate-600">{formatDate(e.date)}</td>
                    <td className="py-2.5">
                      <span
                        className={
                          e.type === "Income"
                            ? "text-xs font-semibold text-emerald-700"
                            : "text-xs font-semibold text-rose-700"
                        }
                      >
                        {e.type}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-600">{e.category}</td>
                    <td className="py-2.5 text-slate-700">{e.description}</td>
                    <td className="py-2.5 text-slate-600">
                      {e.currency} {e.amount.toLocaleString("en-PK")}
                    </td>
                    <td className="py-2.5 font-medium">{formatPKR(e.amountPKR)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Cash Entry">
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as "Income" | "Expense" })}
          >
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </Select>
          <Input
            label="Category"
            required
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <Input
            label="Amount"
            type="number"
            min={0}
            required
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
          />
          <Select
            label="Currency"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value as Currency })}
          >
            {(["PKR", "SAR", "AED", "USD"] as Currency[]).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <Input
            label="Description"
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Entry</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
