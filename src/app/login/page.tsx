"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Plane } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Button, Input } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const user = useAppStore((s) => s.currentUser);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    router.replace("/dashboard");
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = login(username.trim(), password);
    setLoading(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    router.replace("/dashboard");
  };

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
          <h1 className="text-2xl font-bold text-slate-900">Al-Noor Travels</h1>
          <p className="mt-1 text-sm text-slate-500">Travel Agency Management Portal</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
          <Input
            label="Password"
            type="password"
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

        <div className="mt-6 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-700">Demo accounts</p>
          <p className="mt-1">Super Admin: <code>admin</code> / <code>admin123</code></p>
          <p>Staff (no profit/cost): <code>staff</code> / <code>staff123</code></p>
        </div>
      </div>
    </div>
  );
}
