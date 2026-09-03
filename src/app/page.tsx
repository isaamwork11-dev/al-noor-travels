"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const hydrateFromServer = useAppStore((s) => s.hydrateFromServer);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await hydrateFromServer();
      if (cancelled) return;
      router.replace(ok ? "/dashboard" : "/login");
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrateFromServer, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f2f5] text-sm text-slate-500">
      Redirecting…
    </div>
  );
}
