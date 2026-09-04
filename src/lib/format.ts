import type { AppUser, Currency, ExchangeRates } from "./types";

export function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

export function formatMoney(amount: number, currency: Currency = "PKR"): string {
  return `${currency} ${amount.toLocaleString("en-PK")}`;
}

export function toPKR(amount: number, currency: Currency, rates: ExchangeRates): number {
  return Math.round(amount * rates[currency]);
}

export function fromPKR(amountPKR: number, currency: Currency, rates: ExchangeRates): number {
  return Math.round((amountPKR / rates[currency]) * 100) / 100;
}

export function calcProfit(cost: number, sale: number): number {
  return sale - cost;
}

export function nextId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function nextBookingId(existing: string[]): string {
  const nums = existing
    .map((id) => parseInt(id.replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 100;
  return `BK-${String(max + 1).padStart(6, "0")}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Full ISO timestamp for createdAt / updatedAt tracking. */
export function nowISO(): string {
  return new Date().toISOString();
}

/** Convert SAR → PKR using the rate the user entered for that transaction. */
export function sarToPkr(costSAR: number, exchangeRate: number): number {
  const sar = Number(costSAR) || 0;
  const rate = Number(exchangeRate) || 0;
  return Math.round(sar * rate);
}

export function formatDate(date: string): string {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** Shows date + time when a full ISO timestamp is available. */
export function formatDateTime(date: string): string {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  const hasTime = date.includes("T") || date.includes(":");
  if (!hasTime) return formatDate(date);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateLong(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function canViewFinancials(user: AppUser | null): boolean {
  if (!user) return false;
  return user.role === "super_admin" || user.permissions.viewProfit || user.permissions.viewCost;
}

export function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("confirm") || s.includes("approved") || s.includes("completed") || s.includes("paid") || s.includes("process")) {
    if (s === "in process" || s === "processed") return "bg-blue-100 text-blue-700";
    return "bg-emerald-100 text-emerald-700";
  }
  if (s.includes("pending") || s.includes("process")) return "bg-amber-100 text-amber-700";
  if (s.includes("cancel") || s.includes("reject")) return "bg-red-100 text-red-700";
  if (s.includes("refund")) return "bg-purple-100 text-purple-700";
  return "bg-slate-100 text-slate-700";
}
