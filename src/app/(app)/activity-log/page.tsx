"use client";

import { useAppStore } from "@/lib/store";
import { formatDate } from "@/lib/format";
import { Card, EmptyState, PageHeader } from "@/components/ui";

export default function ActivityLogPage() {
  const user = useAppStore((s) => s.currentUser);
  const activityLogs = useAppStore((s) => s.activityLogs);

  const canView =
    user?.role === "super_admin" || !!user?.permissions.viewActivityLog;

  if (!canView) {
    return (
      <div>
        <PageHeader title="Activity Log" breadcrumb="Home / Activity Log" />
        <Card>
          <EmptyState message="You do not have permission to view the activity log." />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Activity Log" breadcrumb="Home / Activity Log" />
      <Card title="Recent Activity">
        {activityLogs.length === 0 ? (
          <EmptyState message="No activity recorded yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="pb-2 font-medium">When</th>
                  <th className="pb-2 font-medium">User</th>
                  <th className="pb-2 font-medium">Action</th>
                  <th className="pb-2 font-medium">Module</th>
                  <th className="pb-2 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {activityLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 text-slate-500">
                      {formatDate(log.createdAt.slice(0, 10))}{" "}
                      <span className="text-xs">
                        {new Date(log.createdAt).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="py-2.5 font-medium text-slate-800">{log.userName}</td>
                    <td className="py-2.5">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-600">{log.module}</td>
                    <td className="py-2.5 text-slate-600">{log.details}</td>
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
