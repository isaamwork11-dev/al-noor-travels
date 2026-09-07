"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { todayISO } from "@/lib/format";
import type { VisaRecord } from "@/lib/types";
import { SarCostFields } from "@/components/SarCostFields";
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
    costSAR: 0,
    exchangeRate: 73.9,
    salePrice: 0,
    status: "In Process" as VisaRecord["status"],
  });

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    await addVisa({
      ...form,
      costSAR: Number(form.costSAR),
      exchangeRate: Number(form.exchangeRate),
      costPrice: 0, // server derives from SAR × rate
      salePrice: Number(form.salePrice),
      approvalDate: form.approvalDate || undefined,
      expiryDate: form.expiryDate || undefined,
      createdBy: user.id,
    });
    if ((e.nativeEvent as SubmitEvent).submitter?.getAttribute("name") === "addAnother") {
      window.location.reload();
      return;
    }
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
          {showCost ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <SarCostFields
                costSAR={form.costSAR}
                exchangeRate={form.exchangeRate}
                salePrice={form.salePrice}
                onChange={(patch) => setForm({ ...form, ...patch })}
              />
            </div>
          ) : (
            <Input
              label="Sale Price (PKR)"
              type="number"
              min={0}
              required
              value={form.salePrice}
              onChange={(e) => setForm({ ...form, salePrice: Number(e.target.value) })}
            />
          )}
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
          <div className="flex justify-end gap-2 sm:col-span-2 lg:col-span-3">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" name="addAnother" variant="secondary"><Plus size={15} /> Save &amp; Add Another</Button>
            <Button type="submit">Save Visa</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
