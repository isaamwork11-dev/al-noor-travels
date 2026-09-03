import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth-server";
import { connectDB } from "@/lib/db";
import {
  DEFAULT_RATES,
  getSettings,
  handleApiError,
  json,
  jsonError,
} from "@/lib/api-helpers";
import { AppSettings, SETTINGS_ID } from "@/models";
import type { Currency, ExchangeRates } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Free, key-less providers. Both return `rates` as "1 PKR = X currency". */
const PROVIDERS = [
  "https://open.er-api.com/v6/latest/PKR",
  "https://api.exchangerate-api.com/v4/latest/PKR",
];

const TRACKED: Currency[] = ["SAR", "AED", "USD"];

interface ProviderResponse {
  rates?: Record<string, number>;
}

/** Converts "1 PKR = X foreign" into the app's "1 foreign = X PKR" rates. */
function toAppRates(rates: Record<string, number>): ExchangeRates | null {
  const next: ExchangeRates = { ...DEFAULT_RATES, PKR: 1 };

  for (const currency of TRACKED) {
    const perPkr = Number(rates[currency]);
    if (!Number.isFinite(perPkr) || perPkr <= 0) return null;
    next[currency] = Math.round((1 / perPkr) * 100) / 100;
  }

  return next;
}

async function fetchLiveRates(): Promise<ExchangeRates | null> {
  for (const url of PROVIDERS) {
    try {
      const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
      if (!response.ok) continue;
      const payload = (await response.json()) as ProviderResponse;
      if (!payload.rates) continue;
      const rates = toAppRates(payload.rates);
      if (rates) return rates;
    } catch {
      // Try the next provider.
    }
  }
  return null;
}

/**
 * Refreshes the stored exchange rates from a live feed, falling back to the
 * rates already in `AppSettings` when every provider is unreachable.
 */
export async function GET(request: NextRequest) {
  try {
    const secret = request.nextUrl.searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;
    const viaCron = Boolean(cronSecret && secret === cronSecret);

    if (!viaCron && !(await getSession())) {
      return jsonError("Not authenticated", 401);
    }

    await connectDB();
    const settings = await getSettings();
    const stored = { ...DEFAULT_RATES, ...(settings.exchangeRates ?? {}) };

    const live = await fetchLiveRates();
    if (!live) {
      return json({
        rates: stored,
        source: "stored",
        updatedAt: settings.ratesUpdatedAt ?? null,
        message: "Live rate providers were unreachable — returning the saved rates.",
      });
    }

    const updatedAt = new Date().toISOString();
    await AppSettings.updateOne(
      { id: SETTINGS_ID },
      { $set: { exchangeRates: live, ratesUpdatedAt: updatedAt } },
      { upsert: true }
    );

    return json({ rates: live, source: "live", updatedAt });
  } catch (error) {
    return handleApiError(error);
  }
}
