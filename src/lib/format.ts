import type { AppUser, Currency, ExchangeRates } from "./types";

export function formatPKR(amount: number): string {
  return `PKR ${(Number(amount) || 0).toLocaleString("en-PK")}`;
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

/** Short sequential refs: PAY-000124, BK-000150 */
export function nextSequentialId(prefix: string, existing: string[], width = 6): string {
  const nums = existing
    .map((id) => {
      const match = String(id).match(new RegExp(`^${prefix}-(\\d+)$`, "i"));
      return match ? parseInt(match[1], 10) : NaN;
    })
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `${prefix}-${String(max + 1).padStart(width, "0")}`;
}

/** Compact display for payment / ledger refs (hides long random ids). */
export function displayRef(id: string): string {
  if (!id) return "—";
  if (/^(PAY|BK|CUS|OPEN)-\d+$/i.test(id) || id === "OPEN") return id.toUpperCase();
  const tail = id.replace(/^p-/i, "").replace(/-/g, "").slice(-6).toUpperCase();
  return tail ? `PAY-${tail}` : id;
}

export function sortByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base", numeric: true })
  );
}

export function nextBookingId(existing: string[]): string {
  return nextSequentialId("BK", existing, 6);
}

const MONTHS_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Full timestamp for createdAt / updatedAt tracking — LOCAL time with offset
 *  so displayed dates never shift because of UTC conversion. */
export function nowISO(): string {
  const d = new Date();
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const pad = (n: number) => String(Math.abs(n)).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
    `${sign}${pad(Math.floor(offset / 60))}:${pad(offset % 60)}`
  );
}

/** Convert SAR → PKR using the rate the user entered for that transaction. */
export function sarToPkr(costSAR: number, exchangeRate: number): number {
  const sar = Number(costSAR) || 0;
  const rate = Number(exchangeRate) || 0;
  return Math.round(sar * rate);
}

/** Match the calendar date part of a stored value without JS Date timezone
 *  shifting (e.g. store "2026-09-10" → "10/09/2026", never "09/09/2026"). */
function datePartToDMY(date: string): string | null {
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const month = MONTHS_SHORT[Number(match[2]) - 1];
  if (!month) return null;
  return `${match[3]}-${month}-${match[1]}`;
}

export function formatDate(date: string): string {
  if (!date) return "—";
  const labelled = datePartToDMY(date);
  if (labelled) return labelled;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = MONTHS_SHORT[d.getMonth()];
  return `${day}-${month}-${d.getFullYear()}`;
}

/** Night count between two dates (check-out minus check-in). Returns 0 when
 *  either date is missing or check-out is not after check-in. */
export function hotelNights(checkIn: string, checkOut: string): number {
  const from = datePartToDMY(checkIn);
  const to = datePartToDMY(checkOut);
  if (!from || !to) return 0;
  const start = new Date(`${checkIn.slice(0, 10)}T00:00:00`);
  const end = new Date(`${checkOut.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const nights = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return Math.max(0, nights);
}

/** Shows date + time when a full ISO timestamp is available. */
export function formatDateTime(date: string): string {
  if (!date) return "—";
  const dateLabel = formatDate(date);
  const timeMatch = date.match(/T(\d{2}):(\d{2})/);
  if (timeMatch) return `${dateLabel} ${timeMatch[1]}:${timeMatch[2]}`;
  return dateLabel;
}

export function formatDateLong(): string {
  return formatDate(todayISO());
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
