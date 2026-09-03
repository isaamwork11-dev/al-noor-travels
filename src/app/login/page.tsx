"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plane } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Button, Input, PasswordInput } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const user = useAppStore((s) => s.currentUser);
  const hydrateFromServer = useAppStore((s) => s.hydrateFromServer);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await hydrateFromServer();
      if (!cancelled && ok) router.replace("/dashboard");
      if (!cancelled) setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrateFromServer, router]);

  useEffect(() => {
    if (!checking && user) router.replace("/dashboard");
  }, [checking, user, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await login(username.trim(), password);
    setLoading(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    router.replace("/dashboard");
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1c3f]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0f1c3f] p-4">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-blue-500 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-indigo-600 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
            <Plane size={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">SSB Travel & Tours</h1>
          <p className="mt-1 text-sm text-slate-500">Travel Agency Management Portal</p>
          <p className="mt-2 text-[11px] font-medium text-emerald-600">Connected to MongoDB Atlas</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
          <PasswordInput
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
          )}
          <Button type="submit" className="w-full !py-2.5" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

      </div>
    </div>
  );
}
