"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const user = useAppStore((s) => s.currentUser);

  useEffect(() => {
    router.replace(user ? "/dashboard" : "/login");
  }, [user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f2f5] text-sm text-slate-500">
      Redirecting…
    </div>
  );
}
