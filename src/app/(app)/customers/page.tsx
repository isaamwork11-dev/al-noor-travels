"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatDateTime, formatPKR } from "@/lib/format";
import { Button, Card, EmptyState, Input, Modal, PageHeader } from "@/components/ui";

export default function CustomersPage() {
  const user = useAppStore((s) => s.currentUser);
  const customers = useAppStore((s) => s.customers);
  const addCustomer = useAppStore((s) => s.addCustomer);
  const updateCustomer = useAppStore((s) => s.updateCustomer);
  const deleteCustomer = useAppStore((s) => s.deleteCustomer);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    cnic: "",
    passportNumber: "",
    email: "",
    address: "",
  });

  const canCreate =
    user?.role === "super_admin" || !!user?.permissions.createRecords;
  const canEdit = user?.role === "super_admin" || !!user?.permissions.editRecords;
  const canDelete = user?.role === "super_admin" || !!user?.permissions.deleteRecords;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    if (editingId) await updateCustomer(editingId, form);
    else await addCustomer(form);
    setForm({ name: "", mobile: "", cnic: "", passportNumber: "", email: "", address: "" });
    setOpen(false);
    setEditingId(null);
    setSaving(false);
  };

  const edit = (customer: (typeof customers)[number]) => {
    setEditingId(customer.id);
    setForm({ name: customer.name, mobile: customer.mobile, cnic: customer.cnic, passportNumber: customer.passportNumber, email: customer.email, address: customer.address });
    setOpen(true);
  };

  return (
    <div>
      <PageHeader title="Customers (CRM)" breadcrumb="Home / Customers" />
      <Card
        title="All Customers"
        action={
          canCreate ? (
            <Button onClick={() => setOpen(true)}>
              <Plus size={16} /> Add Customer
            </Button>
          ) : undefined
        }
      >
        {customers.length === 0 ? (
          <EmptyState message="No customers yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="pb-2 font-medium">Customer ID</th>
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Mobile</th>
                  <th className="pb-2 font-medium">CNIC</th>
                  <th className="pb-2 font-medium">Passport</th>
                  <th className="pb-2 font-medium">Outstanding</th>
                  <th className="pb-2 font-medium">Created</th>
                  <th className="pb-2 font-medium">Updated</th>
                  <th className="pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 font-medium text-blue-700">{c.customerId}</td>
                    <td className="py-2.5 text-slate-800">{c.name}</td>
                    <td className="py-2.5 text-slate-600">{c.mobile}</td>
                    <td className="py-2.5 text-slate-600">{c.cnic}</td>
                    <td className="py-2.5 text-slate-600">{c.passportNumber}</td>
                    <td className="py-2.5 font-medium text-slate-800">{formatPKR(c.outstanding)}</td>
                    <td className="py-2.5 text-slate-500">{formatDateTime(c.createdAt)}</td>
                    <td className="py-2.5 text-slate-500">{formatDateTime(c.updatedAt || c.createdAt)}</td>
                    <td className="py-2.5">
                      <Link
                        href={`/customers/${c.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                      >
                        <Eye size={14} /> View
                      </Link>
                      {canEdit && <button type="button" className="ml-2 text-xs text-slate-600 hover:underline" onClick={() => edit(c)}><Pencil size={14} className="inline" /> Edit</button>}
                      {canDelete && <button type="button" className="ml-2 text-xs text-rose-600 hover:underline" onClick={() => confirm("Delete this customer permanently?") && deleteCustomer(c.id)}><Trash2 size={14} className="inline" /> Delete</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => { setOpen(false); setEditingId(null); }} title={editingId ? "Edit Customer" : "Add Customer"}>
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Full Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Mobile"
            required
            value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          />
          <Input
            label="CNIC"
            value={form.cnic}
            onChange={(e) => setForm({ ...form, cnic: e.target.value })}
          />
          <Input
            label="Passport Number"
            value={form.passportNumber}
            onChange={(e) => setForm({ ...form, passportNumber: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Customer"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
