"use client";

import { Menu, Search, LogOut } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Button, Modal } from "./ui";

export function Header({ onMenu }: { onMenu: () => void }) {
  const router = useRouter();
  const user = useAppStore((s) => s.currentUser);
  const logout = useAppStore((s) => s.logout);
  const customers = useAppStore((s) => s.customers);
  const airTickets = useAppStore((s) => s.airTickets);
  const visas = useAppStore((s) => s.visas);
  const [q, setQ] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const term = q.toLowerCase();
    const items: { type: string; label: string; href: string }[] = [];
    customers.forEach((c) => {
      if (
        c.name.toLowerCase().includes(term) ||
        c.mobile.includes(term) ||
        c.passportNumber.toLowerCase().includes(term) ||
        c.customerId.toLowerCase().includes(term)
      ) {
        items.push({ type: "Customer", label: `${c.name} (${c.customerId})`, href: `/customers/${c.id}` });
      }
    });
    airTickets.forEach((t) => {
      if (
        t.bookingId.toLowerCase().includes(term) ||
        t.pnr.toLowerCase().includes(term) ||
        t.passengerName.toLowerCase().includes(term)
      ) {
        items.push({
          type: "Ticket",
          label: `${t.bookingId} — ${t.passengerName} (${t.pnr})`,
          href: "/air-tickets",
        });
      }
    });
    visas.forEach((v) => {
      if (v.bookingId.toLowerCase().includes(term) || v.passportNo.toLowerCase().includes(term)) {
        items.push({ type: "Visa", label: `${v.bookingId} — ${v.visaType}`, href: "/visas" });
      }
    });
    return items.slice(0, 8);
  }, [q, customers, airTickets, visas]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={onMenu}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={20} />
        </button>

        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
            placeholder="Search by Booking ID, PNR, Customer, Passport, etc..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
          {showResults && results.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              {results.map((r, i) => (
                <button
                  key={i}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                  onMouseDown={() => {
                    router.push(r.href);
                    setQ("");
                  }}
                >
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                    {r.type}
                  </span>
                  <span className="text-slate-700">{r.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="ml-1 flex items-center gap-2 border-l border-slate-200 pl-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
              {user?.name?.charAt(0) || "A"}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-800">{user?.name || "Admin"}</p>
              <p className="text-[10px] text-slate-500">
                {user?.role === "super_admin" ? "Super Admin" : "Staff"}
              </p>
            </div>
            <Button
              variant="ghost"
              className="!p-2"
              title="Logout"
              onClick={() => setLogoutOpen(true)}
            >
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </div>
      </header>

      <Modal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Logout Confirmation"
      >
        <p className="mb-4 text-sm text-slate-600">
          Are you sure you want to logout?
        </p>
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => setLogoutOpen(false)}
            type="button"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            type="button"
            onClick={async () => {
              await logout();
              setLogoutOpen(false);
              router.replace("/login");
            }}
          >
            Logout
          </Button>
        </div>
      </Modal>
    </>
  );
}
