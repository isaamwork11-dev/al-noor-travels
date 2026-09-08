"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, Settings2, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatDate } from "@/lib/format";
import type { UserPermissions, UserRole } from "@/lib/types";
import {
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  PasswordInput,
  Select,
  StatusBadge,
} from "@/components/ui";

// ─── All permissions with friendly labels & grouping ────────────────────────
const PERMISSION_GROUPS: { group: string; items: { key: keyof UserPermissions; label: string; desc: string }[] }[] = [
  {
    group: "Records",
    items: [
      { key: "createRecords",  label: "Create Records",  desc: "Add new bookings, customers, suppliers, etc." },
      { key: "editRecords",    label: "Edit Records",    desc: "Modify existing records" },
      { key: "deleteRecords",  label: "Delete Records",  desc: "Permanently remove records" },
    ],
  },
  {
    group: "Financial",
    items: [
      { key: "viewCost",             label: "View Cost Price",       desc: "See cost/purchase price on all bookings" },
      { key: "viewProfit",           label: "View Profit",           desc: "See profit margin on all bookings" },
      { key: "viewAccounts",         label: "View Accounts",         desc: "Access receivables, payables & cash book" },
      { key: "viewFinancialReports", label: "View Financial Reports",desc: "Access profit/loss and financial reports" },
    ],
  },
  {
    group: "Reports & Logs",
    items: [
      { key: "viewReports",     label: "View Reports",     desc: "Access sales, refund and customer reports" },
      { key: "viewActivityLog", label: "View Activity Log",desc: "See system-wide activity log" },
    ],
  },
  {
    group: "Administration",
    items: [
      { key: "manageUsers", label: "Manage Users", desc: "Add/edit users and change permissions" },
    ],
  },
];

const ALL_PERMISSIONS: (keyof UserPermissions)[] = PERMISSION_GROUPS.flatMap((g) =>
  g.items.map((i) => i.key)
);

const EMPTY_PERMS: UserPermissions = {
  viewCost: false,
  viewProfit: false,
  viewAccounts: false,
  viewFinancialReports: false,
  manageUsers: false,
  createRecords: false,
  editRecords: false,
  deleteRecords: false,
  viewReports: false,
  viewActivityLog: false,
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function UsersPage() {
  const currentUser = useAppStore((s) => s.currentUser);
  const users = useAppStore((s) => s.users);
  const addUser = useAppStore((s) => s.addUser);
  const updateUser = useAppStore((s) => s.updateUser);
  const updateUserPermissions = useAppStore((s) => s.updateUserPermissions);
  const deleteUser = useAppStore((s) => s.deleteUser);

  const isSuperAdmin = currentUser?.role === "super_admin";
  const canManage = isSuperAdmin || !!currentUser?.permissions.manageUsers;
  const canCreate = isSuperAdmin || !!currentUser?.permissions.createRecords;

  // ── Add User modal ──
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "staff" as UserRole,
  });
  const [addPerms, setAddPerms] = useState<UserPermissions>({ ...EMPTY_PERMS });

  const toggleAddPerm = (key: keyof UserPermissions) =>
    setAddPerms((p) => ({ ...p, [key]: !p[key] }));
  const selectAll = () =>
    setAddPerms(ALL_PERMISSIONS.reduce((acc, k) => ({ ...acc, [k]: true }), {} as UserPermissions));
  const clearAll = () => setAddPerms({ ...EMPTY_PERMS });

  const onAddSubmit = (e: FormEvent) => {
    e.preventDefault();
    addUser({ ...form, permissions: addPerms, active: true });
    setForm({ username: "", password: "", name: "", email: "", role: "staff" });
    setAddPerms({ ...EMPTY_PERMS });
    setAddOpen(false);
  };

  // ── Edit Permissions modal ──
  const [permUserId, setPermUserId] = useState<string | null>(null);
  const permUser = users.find((u) => u.id === permUserId);
  const [editPerms, setEditPerms] = useState<UserPermissions>({ ...EMPTY_PERMS });

  useEffect(() => {
    // Hydrate the permissions dialog when a user is selected.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (permUser) setEditPerms({ ...permUser.permissions });
  }, [permUser]);

  const toggleEditPerm = (key: keyof UserPermissions) =>
    setEditPerms((p) => ({ ...p, [key]: !p[key] }));
  const selectAllEdit = () =>
    setEditPerms(ALL_PERMISSIONS.reduce((acc, k) => ({ ...acc, [k]: true }), {} as UserPermissions));
  const clearAllEdit = () => setEditPerms({ ...EMPTY_PERMS });

  const savePerms = () => {
    if (!permUserId) return;
    updateUserPermissions(permUserId, editPerms);
    setPermUserId(null);
  };

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

  return (
    <div>
      <PageHeader title="User Management" breadcrumb="Home / Users" />

      <Card
        title="All Users"
        action={
          canCreate ? (
            <Button onClick={() => setAddOpen(true)}>
              <Plus size={16} /> Add User
            </Button>
          ) : undefined
        }
      >
        {users.length === 0 ? (
          <EmptyState message="No users." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Username</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Created</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 font-medium text-slate-800">{u.name}</td>
                    <td className="py-2.5 text-slate-600">{u.username}</td>
                    <td className="py-2.5 text-slate-600">{u.email || "—"}</td>
                    <td className="py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.role === "super_admin" ? "bg-purple-100 text-purple-700" : "bg-blue-50 text-blue-700"}`}>
                        {u.role === "super_admin" ? "Super Admin" : "Staff"}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <StatusBadge status={u.active ? "Confirmed" : "Cancelled"} />
                    </td>
                    <td className="py-2.5 text-slate-500">{formatDate(u.createdAt)}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        {u.role !== "super_admin" && (
                          <>
                            <Button
                              variant="secondary"
                              className="!px-2 !py-1 text-xs"
                              onClick={() => setPermUserId(u.id)}
                            >
                              <Settings2 size={13} /> Permissions
                            </Button>
                            <Button
                              variant="secondary"
                              className="!px-2 !py-1 text-xs"
                              onClick={() => updateUser(u.id, { active: !u.active })}
                            >
                              {u.active ? "Deactivate" : "Activate"}
                            </Button>
                            <Button variant="danger" className="!px-2 !py-1 text-xs" onClick={() => confirm("Delete this user permanently?") && deleteUser(u.id)}>
                              <Trash2 size={13} /> Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Add User Modal ── */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New User">
        <form onSubmit={onAddSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Full Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Username" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <PasswordInput label="Password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
              <option value="staff">Staff</option>
              <option value="super_admin">Super Admin</option>
            </Select>
          </div>

          {/* Permissions (only for staff) */}
          {form.role === "staff" && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Permissions</p>
                <div className="flex gap-2">
                  <button type="button" onClick={selectAll} className="text-xs text-blue-600 hover:underline">Select All</button>
                  <span className="text-slate-300">|</span>
                  <button type="button" onClick={clearAll} className="text-xs text-slate-500 hover:underline">Clear All</button>
                </div>
              </div>
              <div className="space-y-3">
                {PERMISSION_GROUPS.map((group) => (
                  <div key={group.group}>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{group.group}</p>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {group.items.map(({ key, label, desc }) => (
                        <label key={key} className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 transition-colors ${addPerms[key] ? "border-blue-200 bg-blue-50" : "border-slate-100 bg-slate-50 hover:bg-slate-100"}`}>
                          <input
                            type="checkbox"
                            checked={addPerms[key]}
                            onChange={() => toggleAddPerm(key)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-blue-600"
                          />
                          <div>
                            <p className="text-xs font-medium text-slate-700">{label}</p>
                            <p className="text-[11px] text-slate-400">{desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit">Create User</Button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Permissions Modal ── */}
      <Modal
        open={!!permUserId}
        onClose={() => setPermUserId(null)}
        title={`Permissions — ${permUser?.name ?? ""}`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">Toggle access for <span className="font-semibold text-slate-700">{permUser?.username}</span></p>
            <div className="flex gap-2">
              <button type="button" onClick={selectAllEdit} className="text-xs text-blue-600 hover:underline">Select All</button>
              <span className="text-slate-300">|</span>
              <button type="button" onClick={clearAllEdit} className="text-xs text-slate-500 hover:underline">Clear All</button>
            </div>
          </div>

          <div className="space-y-3">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.group}>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{group.group}</p>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {group.items.map(({ key, label, desc }) => (
                    <label key={key} className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 transition-colors ${editPerms[key] ? "border-blue-200 bg-blue-50" : "border-slate-100 bg-slate-50 hover:bg-slate-100"}`}>
                      <input
                        type="checkbox"
                        checked={editPerms[key]}
                        onChange={() => toggleEditPerm(key)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-blue-600"
                      />
                      <div>
                        <p className="text-xs font-medium text-slate-700">{label}</p>
                        <p className="text-[11px] text-slate-400">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPermUserId(null)}>Cancel</Button>
            <Button onClick={savePerms}>Save Permissions</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
