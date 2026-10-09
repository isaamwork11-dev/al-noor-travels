import { DashboardShell } from "@/components/DashboardShell";

/** Auth shell must never be a cached prerender — stale HTML + new JS chunks crash the tab. */
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
