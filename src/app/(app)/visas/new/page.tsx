"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { calcProfit, todayISO } from "@/lib/format";
import type { VisaRecord } from "@/lib/types";
import { Button, Card, Input, PageHeader, Select } from "@/components/ui";

const visaTypes: VisaRecord["visaType"][] = [
  "Umrah Visa",
  "Dubai Visa",
  "Malaysia Visa",
  "Visit Visa",
  "Other",
];

export default function NewVisaPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.currentUser);
  const customers = useAppStore((s) => s.customers);
  const addVisa = useAppStore((s) => s.addVisa);
  const showCost = user?.role === "super_admin" || !!user?.permissions.viewCost;

  const [form, setForm] = useState({
    customerId: customers[0]?.id || "",
    passportNo: "",
    visaType: "Umrah Visa" as VisaRecord["visaType"],
    country: "",
    submissionDate: todayISO(),
    approvalDate: "",
    expiryDate: "",
    costPrice: 0,
    salePrice: 0,
    status: "In Process" as VisaRecord["status"],
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    addVisa({
      ...form,
      costPrice: Number(form.costPrice),
      salePrice: Number(form.salePrice),
      approvalDate: form.approvalDate || undefined,
      expiryDate: form.expiryDate || undefined,
      createdBy: user.id,
    });
    router.push("/visas");
  };

  return (
    <div>
      <PageHeader title="Add Visa" breadcrumb="Home / Visas / New" />
      <Card title="Visa Application">
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            label="Customer"
            required
            value={form.customerId}
            onChange={(e) => setForm({ ...form, customerId: e.target.value })}
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input
            label="Passport Number"
            required
            value={form.passportNo}
            onChange={(e) => setForm({ ...form, passportNo: e.target.value })}
          />
          <Select
            label="Visa Type"
            value={form.visaType}
            onChange={(e) => setForm({ ...form, visaType: e.target.value as VisaRecord["visaType"] })}
          >
            {visaTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Input
            label="Country (optional)"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
          <Input
            label="Submission Date"
            type="date"
            required
            value={form.submissionDate}
            onChange={(e) => setForm({ ...form, submissionDate: e.target.value })}
          />
          <Input
            label="Approval Date"
            type="date"
            value={form.approvalDate}
            onChange={(e) => setForm({ ...form, approvalDate: e.target.value })}
          />
          <Input
            label="Expiry Date"
            type="date"
            value={form.expiryDate}
            onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
          />
          {showCost && (
            <Input
              label="Cost Price (PKR)"
              type="number"
              min={0}
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })}
            />
          )}
          <Input
            label="Sale Price (PKR)"
            type="number"
            min={0}
            required
            value={form.salePrice}
            onChange={(e) => setForm({ ...form, salePrice: Number(e.target.value) })}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as VisaRecord["status"] })}
          >
            {["In Process", "Pending", "Approved", "Rejected", "Confirmed", "Cancelled"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          {showCost && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 sm:col-span-2 lg:col-span-3">
              Estimated profit: PKR {calcProfit(Number(form.costPrice), Number(form.salePrice)).toLocaleString("en-PK")}
            </div>
          )}
          <div className="flex justify-end gap-2 sm:col-span-2 lg:col-span-3">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit">Save Visa</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
