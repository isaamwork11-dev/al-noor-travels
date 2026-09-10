"use client";

import { FormEvent, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatDateTime, formatPKR } from "@/lib/format";
import { Button, Card, EmptyState, Input, Modal, PageHeader, Select } from "@/components/ui";

export default function SuppliersPage() {
  const user = useAppStore((s) => s.currentUser);
  const suppliers = useAppStore((s) => s.suppliers);
  const addSupplier = useAppStore((s) => s.addSupplier);
  const updateSupplier = useAppStore((s) => s.updateSupplier);
  const deleteSupplier = useAppStore((s) => s.deleteSupplier);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "Airline",
    mobile: "",
    email: "",
    outstanding: 0,
  });

  const canCreate =
    user?.role === "super_admin" || !!user?.permissions.createRecords;
  const canEdit = user?.role === "super_admin" || !!user?.permissions.editRecords;
  const canDelete = user?.role === "super_admin" || !!user?.permissions.deleteRecords;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    if (editingId) await updateSupplier(editingId, { ...form, outstanding: Number(form.outstanding) });
    else await addSupplier({ ...form, outstanding: Number(form.outstanding) });
    setForm({ name: "", type: "Airline", mobile: "", email: "", outstanding: 0 });
    setOpen(false);
    setEditingId(null);
    setSaving(false);
  };

  const edit = (supplier: (typeof suppliers)[number]) => {
    setEditingId(supplier.id);
    setForm({
      name: supplier.name,
      type: supplier.type,
      mobile: supplier.mobile,
      email: supplier.email,
      outstanding: supplier.outstanding,
    });
    setOpen(true);
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
                  <th className="pb-2 font-medium">Created</th>
                  <th className="pb-2 font-medium">Updated</th>
                  <th className="pb-2 font-medium">Actions</th>
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
                    <td className="py-2.5 text-slate-500">{formatDateTime(s.createdAt)}</td>
                    <td className="py-2.5 text-slate-500">{formatDateTime(s.updatedAt || s.createdAt)}</td>
                    <td className="py-2.5 whitespace-nowrap">
                      {canEdit && <button type="button" className="mr-2 text-xs text-slate-600 hover:underline" onClick={() => edit(s)}><Pencil size={14} className="inline" /> Edit</button>}
                      {canDelete && <button type="button" className="text-xs text-rose-600 hover:underline" onClick={() => confirm("Delete this supplier permanently?") && deleteSupplier(s.id)}><Trash2 size={14} className="inline" /> Delete</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => { setOpen(false); setEditingId(null); }} title={editingId ? "Edit Supplier" : "Add Supplier"}>
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
          <Input
            label="Opening Outstanding"
            type="number"
            value={form.outstanding}
            onChange={(e) => setForm({ ...form, outstanding: Number(e.target.value || 0) })}
          />
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Supplier"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
