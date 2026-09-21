"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Wallet,
  Truck,
  BarChart3,
  Shield,
  ChevronDown,
  ClipboardPlus,
} from "lucide-react";
import { useState } from "react";
import { cn } from "./ui";
import { useAppStore } from "@/lib/store";
import { COMPANY } from "@/lib/company";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bookings/new", label: "New Entry", icon: ClipboardPlus, highlight: true },
  {
    label: "Bookings",
    icon: BookOpen,
    children: [
      { href: "/bookings", label: "All Bookings" },
      { href: "/refunds", label: "Refunds" },
    ],
  },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/suppliers", label: "Vendors", icon: Truck },
  {
    label: "Accounts & Money",
    icon: Wallet,
    children: [
      { href: "/accounts", label: "Overview" },
      { href: "/payments", label: "Payment Entry" },
      { href: "/accounts/cashbook", label: "Cash Book" },
      { href: "/accounts/ledger", label: "Ledgers" },
    ],
  },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  {
    label: "Admin",
    icon: Shield,
    children: [
      { href: "/users", label: "Users" },
      { href: "/users/permissions", label: "Permissions" },
      { href: "/settings", label: "Settings" },
      { href: "/activity-log", label: "Activity Log" },
    ],
  },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const user = useAppStore((s) => s.currentUser);
  const isSuperAdmin = user?.role === "super_admin";
  const canViewAccounts = isSuperAdmin || !!user?.permissions.viewAccounts;
  const canViewReports = isSuperAdmin || !!user?.permissions.viewReports;
  const canManageUsers = isSuperAdmin || !!user?.permissions.manageUsers;

  const [expanded, setExpanded] = useState<string[]>(["Bookings", "Accounts & Money"]);

  const toggle = (label: string) => {
    setExpanded((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col bg-[#0f1c3f] text-white transition-transform lg:sticky lg:top-0 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-white/20">
              <img src="/ssb-logo.jpeg" alt={COMPANY.name} className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">{COMPANY.name}</p>
              <p className="text-[10px] text-slate-300">Travel Agency Management</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {nav.map((item) => {
            if ("href" in item && item.href) {
              if (item.href === "/reports" && !canViewReports) return null;

              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                    item.highlight
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold text-white shadow-md shadow-blue-900/40"
                      : active
                        ? "bg-blue-600 text-white shadow"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            }

            const Icon = item.icon;
            const openGroup = expanded.includes(item.label);
            const isAdminGroup = item.label === "Admin";

            const filteredChildren = item.children?.filter((c) => {
              if (isAdminGroup) {
                if (c.href.startsWith("/users") && !canManageUsers) return false;
                if ((c.href === "/settings" || c.href === "/activity-log") && !isSuperAdmin) return false;
              }
              if (
                (c.href.startsWith("/accounts") || c.href.startsWith("/payments")) &&
                !canViewAccounts
              )
                return false;
              return true;
            });

            const childActive =
              filteredChildren?.some((c) => isActive(c.href)) ?? false;

            if (!filteredChildren || filteredChildren.length === 0) return null;

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggle(item.label)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                    childActive
                      ? "bg-white/10 text-white"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon size={18} />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    size={14}
                    className={cn("transition", openGroup && "rotate-180")}
                  />
                </button>
                {openGroup && (
                  <div className="ml-4 space-y-0.5 border-l border-white/10 pl-3 py-1">
                    {filteredChildren.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onClose}
                        className={cn(
                          "block rounded-md px-2 py-1.5 text-xs transition",
                          isActive(child.href)
                            ? "bg-blue-600 text-white"
                            : "text-slate-400 hover:text-white"
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}