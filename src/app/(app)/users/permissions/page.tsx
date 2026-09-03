"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import type { UserPermissions } from "@/lib/types";
import { Button, Card, EmptyState, PageHeader, Select } from "@/components/ui";

const labels: { key: keyof UserPermissions; label: string }[] = [
  { key: "viewCost", label: "View Cost" },
  { key: "viewProfit", label: "View Profit" },
  { key: "viewAccounts", label: "View Accounts" },
  { key: "viewFinancialReports", label: "View Financial Reports" },
  { key: "manageUsers", label: "Manage Users" },
  { key: "createRecords", label: "Create Records" },
  { key: "editRecords", label: "Edit Records" },
  { key: "deleteRecords", label: "Delete Records" },
  { key: "viewReports", label: "View Reports" },
  { key: "viewActivityLog", label: "View Activity Log" },
];

export default function PermissionsPage() {
  const currentUser = useAppStore((s) => s.currentUser);
  const users = useAppStore((s) => s.users);
  const updateUserPermissions = useAppStore((s) => s.updateUserPermissions);

  const canManage =
    currentUser?.role === "super_admin" || !!currentUser?.permissions.manageUsers;

  const editableUsers = users.filter((u) => u.role !== "super_admin");
  const [userId, setUserId] = useState(editableUsers[0]?.id || "");
  const selected = users.find((u) => u.id === userId);
  const [perms, setPerms] = useState<UserPermissions | null>(null);

  useEffect(() => {
    if (selected) setPerms({ ...selected.permissions });
  }, [selected]);

  if (!canManage) {
    return (
      <div>
        <PageHeader title="Permissions" breadcrumb="Home / Users / Permissions" />
        <Card>
          <EmptyState message="Admin access required to manage permissions." />
        </Card>
      </div>
    );
  }

  const save = () => {
    if (!userId || !perms) return;
    updateUserPermissions(userId, perms);
  };

  return (
    <div>
      <PageHeader title="User Permissions" breadcrumb="Home / Users / Permissions" />
      <Card title="Toggle Permissions">
        {editableUsers.length === 0 ? (
          <EmptyState message="No staff users to edit." />
        ) : (
          <>
            <div className="mb-4 max-w-sm">
              <Select
                label="User"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              >
                {editableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.username})
                  </option>
                ))}
              </Select>
            </div>

            {perms && (
              <div className="grid gap-2 sm:grid-cols-2">
                {labels.map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm"
                  >
                    <span className="text-slate-700">{label}</span>
                    <input
                      type="checkbox"
                      checked={perms[key]}
                      onChange={(e) => setPerms({ ...perms, [key]: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                  </label>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <Button onClick={save}>Save Permissions</Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
