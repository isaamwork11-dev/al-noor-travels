"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAppStore((s) => s.currentUser);
  const hydrateFromServer = useAppStore((s) => s.hydrateFromServer);
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await hydrateFromServer();
      if (cancelled) return;
      if (!ok) {
        router.replace("/login");
        return;
      }
      setReady(true);
    })().catch((err) => {
      if (cancelled) return;
      setError(err instanceof Error ? err.message : "Failed to load");
      router.replace("/login");
    });
    return () => {
      cancelled = true;
    };
  }, [hydrateFromServer, router]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-100">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f0f2f5]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenu={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
