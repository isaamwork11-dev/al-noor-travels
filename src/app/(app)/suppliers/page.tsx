"use client";

import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatDate, formatPKR } from "@/lib/format";
import { Button, Card, EmptyState, Input, Modal, PageHeader, Select } from "@/components/ui";

export default function SuppliersPage() {
  const user = useAppStore((s) => s.currentUser);
  const suppliers = useAppStore((s) => s.suppliers);
  const addSupplier = useAppStore((s) => s.addSupplier);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "Airline",
    mobile: "",
    email: "",
  });

  const canCreate =
    user?.role === "super_admin" || !!user?.permissions.createRecords;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    addSupplier(form);
    setForm({ name: "", type: "Airline", mobile: "", email: "" });
    setOpen(false);
  };

  return (
    <div>
      <PageHeader title="Suppliers" breadcrumb="Home / Suppliers" />
      <Card
        title="All Suppliers"
        action={
          canCreate ? (
            <Button onClick={() => setOpen(true)}>
              <Plus size={16} /> Add Supplier
            </Button>
          ) : undefined
        }
      >
        {suppliers.length === 0 ? (
          <EmptyState message="No suppliers yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Mobile</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Outstanding</th>
                  <th className="pb-2 font-medium">Since</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 font-medium text-slate-800">{s.name}</td>
                    <td className="py-2.5 text-slate-600">{s.type}</td>
                    <td className="py-2.5 text-slate-600">{s.mobile}</td>
                    <td className="py-2.5 text-slate-600">{s.email}</td>
                    <td className="py-2.5 font-medium text-amber-700">{formatPKR(s.outstanding)}</td>
                    <td className="py-2.5 text-slate-500">{formatDate(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Supplier">
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Select
            label="Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            {["Airline", "Hotel", "Transport", "Visa Agent", "Other"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Input
            label="Mobile"
            value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Supplier</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
