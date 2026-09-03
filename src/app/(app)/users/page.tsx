"use client";

import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatDate } from "@/lib/format";
import { STAFF_DEFAULT_PERMISSIONS } from "@/lib/demo-data";
import type { UserRole } from "@/lib/types";
import { Button, Card, EmptyState, Input, Modal, PageHeader, PasswordInput, Select, StatusBadge } from "@/components/ui";

export default function UsersPage() {
  const user = useAppStore((s) => s.currentUser);
  const users = useAppStore((s) => s.users);
  const addUser = useAppStore((s) => s.addUser);
  const updateUser = useAppStore((s) => s.updateUser);

  const canManage =
    user?.role === "super_admin" || !!user?.permissions.manageUsers;
  const canCreate = user?.role === "super_admin" || !!user?.permissions.createRecords;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "staff" as UserRole,
  });

  if (!canManage) {
    return (
      <div>
        <PageHeader title="Users" breadcrumb="Home / Users" />
        <Card>
          <EmptyState message="Admin access required to manage users." />
        </Card>
      </div>
    );
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    addUser({
      ...form,
      permissions: { ...STAFF_DEFAULT_PERMISSIONS },
      active: true,
    });
    setForm({ username: "", password: "", name: "", email: "", role: "staff" });
    setOpen(false);
  };

  return (
    <div>
      <PageHeader title="User Management" breadcrumb="Home / Users" />
      <Card
        title="All Users"
        action={
          canCreate ? (
            <Button onClick={() => setOpen(true)}>
              <Plus size={16} /> Add User
            </Button>
          ) : undefined
        }
      >
        {users.length === 0 ? (
          <EmptyState message="No users." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Username</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Created</th>
                  <th className="pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 font-medium text-slate-800">{u.name}</td>
                    <td className="py-2.5 text-slate-600">{u.username}</td>
                    <td className="py-2.5 text-slate-600">{u.email}</td>
                    <td className="py-2.5 text-slate-600">{u.role}</td>
                    <td className="py-2.5">
                      <StatusBadge status={u.active ? "Confirmed" : "Cancelled"} />
                      <span className="ml-1 text-xs text-slate-500">{u.active ? "Active" : "Inactive"}</span>
                    </td>
                    <td className="py-2.5 text-slate-500">{formatDate(u.createdAt)}</td>
                    <td className="py-2.5">
                      {u.role !== "super_admin" && (
                        <Button
                          variant="secondary"
                          className="!px-2 !py-1 text-xs"
                          onClick={() => updateUser(u.id, { active: !u.active })}
                        >
                          {u.active ? "Deactivate" : "Activate"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add User">
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Full Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Username"
            required
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <PasswordInput
            label="Password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Select
            label="Role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
          >
            <option value="staff">Staff</option>
            <option value="super_admin">Super Admin</option>
          </Select>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create User</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
