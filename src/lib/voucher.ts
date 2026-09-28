/**
 * Shared voucher payload + open-in-new-tab flow.
 * Vouchers open as an HTML page first; Print / PDF are optional on that page.
 */

export type VoucherKind =
  | "hotel"
  | "transport"
  | "visa"
  | "payment"
  | "air_ticket"
  | "booking";

export interface VoucherPayload {
  kind: VoucherKind;
  bookingId: string;
  customerName: string;
  lines: { label: string; value: string }[];
  amount?: string;
  note?: string;
}

export const VOUCHER_TITLES: Record<VoucherKind, string> = {
  hotel: "Hotel Voucher",
  transport: "Transport Voucher",
  visa: "Visa Receipt",
  payment: "Payment Receipt",
  air_ticket: "Air Ticket Invoice",
  booking: "Travel Booking Invoice",
};

const STORAGE_PREFIX = "ssb-voucher:";

/** Store payload and open the printable voucher page in a new tab. */
export function openVoucher(payload: VoucherPayload) {
  const key = `${STORAGE_PREFIX}${crypto.randomUUID()}`;
  localStorage.setItem(key, JSON.stringify(payload));
  window.open(`/voucher/view?k=${encodeURIComponent(key)}`, "_blank", "noopener,noreferrer");
}

export function readVoucherPayload(storageKey: string): VoucherPayload | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw) as VoucherPayload;
  } catch {
    return null;
  }
}
