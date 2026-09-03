"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";

export function cn(...inputs: (string | false | undefined | null)[]) {
  return clsx(inputs);
}

export function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  let color = "bg-slate-100 text-slate-700";
  if (["confirmed", "approved", "completed", "paid", "processed"].includes(s))
    color = "bg-emerald-100 text-emerald-700";
  else if (["pending", "in process", "partial"].includes(s)) color = "bg-amber-100 text-amber-700";
  else if (["cancelled", "canceled", "rejected"].includes(s)) color = "bg-red-100 text-red-700";
  else if (s.includes("refund")) color = "bg-purple-100 text-purple-700";

  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", color)}>
      {status}
    </span>
  );
}

export function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: "blue" | "green" | "purple" | "orange" | "teal" | "red";
}) {
  const colors = {
    blue: "from-blue-500 to-blue-600 shadow-blue-200",
    green: "from-emerald-500 to-emerald-600 shadow-emerald-200",
    purple: "from-violet-500 to-violet-600 shadow-violet-200",
    orange: "from-orange-500 to-orange-600 shadow-orange-200",
    teal: "from-cyan-500 to-cyan-600 shadow-cyan-200",
    red: "from-rose-500 to-rose-600 shadow-rose-200",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-gradient-to-br p-4 text-white shadow-lg",
        colors[color]
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-white/85">{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <div className="rounded-lg bg-white/20 p-2">{icon}</div>
      </div>
    </div>
  );
}

export function Card({
  title,
  children,
  action,
  className,
}: {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          {title ? <h3 className="text-sm font-semibold text-slate-800">{title}</h3> : <div />}
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function PageHeader({
  title,
  breadcrumb,
}: {
  title: string;
  breadcrumb?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        <p className="mt-0.5 text-xs text-slate-500">{breadcrumb || `Home / ${title}`}</p>
      </div>
      <p className="text-sm font-medium text-slate-600">
        {new Date().toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block space-y-1">
      {label && <span className="text-xs font-medium text-slate-600">{label}</span>}
      <input
        className={cn(
          "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100",
          className
        )}
        {...props}
      />
    </label>
  );
}

export function Select({
  label,
  children,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block space-y-1">
      {label && <span className="text-xs font-medium text-slate-600">{label}</span>}
      <select
        className={cn(
          "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div
        className={cn(
          "relative max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl",
          wide ? "max-w-3xl" : "max-w-lg"
        )}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="py-8 text-center text-sm text-slate-400">{message}</p>;
}
