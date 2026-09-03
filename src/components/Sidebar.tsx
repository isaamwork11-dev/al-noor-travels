"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Plane,
  FileText,
  Landmark,
  Hotel,
  Bus,
  Package,
  Wallet,
  Truck,
  Receipt,
  BarChart3,
  RotateCcw,
  UserCog,
  Settings,
  ScrollText,
  ChevronDown,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { cn } from "./ui";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers (CRM)", icon: Users },
  {
    label: "Air Tickets",
    icon: Plane,
    children: [
      { href: "/air-tickets", label: "All Tickets" },
      { href: "/air-tickets/new", label: "Add Ticket" },
      { href: "/refunds", label: "Refunds" },
    ],
  },
  {
    label: "Visa Management",
    icon: FileText,
    children: [
      { href: "/visas", label: "All Visas" },
      { href: "/visas/new", label: "Add Visa" },
    ],
  },
  {
    label: "Umrah Management",
    icon: Landmark,
    children: [
      { href: "/umrah", label: "Packages" },
      { href: "/umrah/new", label: "New Package" },
    ],
  },
  {
    label: "Hotel Management",
    icon: Hotel,
    children: [
      { href: "/hotels", label: "All Hotels" },
      { href: "/hotels/new", label: "Add Booking" },
    ],
  },
  {
    label: "Transport Management",
    icon: Bus,
    children: [
      { href: "/transport", label: "All Transfers" },
      { href: "/transport/new", label: "Add Transfer" },
    ],
  },
  {
    label: "Tour Packages",
    icon: Package,
    children: [{ href: "/tours", label: "All Tours" }],
  },
  {
    label: "Accounts & Finance",
    icon: Wallet,
    children: [
      { href: "/accounts", label: "Overview" },
      { href: "/accounts/cashbook", label: "Cash Book" },
      { href: "/accounts/ledger", label: "Ledgers" },
    ],
  },
  { href: "/suppliers", label: "Suppliers", icon: Truck },
  { href: "/vouchers", label: "Vouchers", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  {
    label: "Refunds & Cancellations",
    icon: RotateCcw,
    children: [{ href: "/refunds", label: "All Refunds" }],
  },
  {
    label: "User Management",
    icon: UserCog,
    children: [
      { href: "/users", label: "Users" },
      { href: "/users/permissions", label: "Permissions" },
    ],
  },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/activity-log", label: "Activity Log", icon: ScrollText },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string[]>([
    "Air Tickets",
    "Visa Management",
    "Umrah Management",
    "Hotel Management",
    "Transport Management",
  ]);

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
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#0f1c3f] text-white transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="border-b border-white/10 px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 font-bold">
              AN
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">SSB Travel & Tours</p>
              <p className="text-[10px] text-slate-300">Travel Agency Management</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {nav.map((item) => {
            if ("href" in item && item.href) {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                    active
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
            const childActive = item.children?.some((c) => isActive(c.href));
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
                    {item.children?.map((child) => (
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

        <div className="m-3 rounded-xl bg-white/10 p-3">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-blue-300" />
            <div>
              <p className="text-xs font-semibold">Your Plan: Premium</p>
              <p className="text-[10px] text-slate-300">Valid till: 30 Dec 2026</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
