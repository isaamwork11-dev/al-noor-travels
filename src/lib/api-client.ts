import type {
  ActivityLog,
  AppUser,
  BootstrapData,
  ExchangeRates,
  PublicUser,
} from "./types";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export interface ApiOptions extends Omit<RequestInit, "body"> {
  /** Plain object — serialised as JSON. Use `RequestInit.body` for anything else. */
  json?: unknown;
  body?: BodyInit | null;
}

/**
 * Thin `fetch` wrapper for the app's own API: sends/receives JSON, keeps the
 * session cookie, and turns non-2xx responses into `ApiError`.
 */
export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { json, headers, ...rest } = options;

  const response = await fetch(path.startsWith("/") ? path : `/${path}`, {
    ...rest,
    method: rest.method ?? (json !== undefined ? "POST" : "GET"),
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : await response.text();

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : typeof payload === "string" && payload
          ? payload
          : null) ?? `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

/** Collections exposed by `/api/data/[collection]`. */
export type CollectionName =
  | "customers"
  | "suppliers"
  | "airTickets"
  | "visas"
  | "hotels"
  | "transports"
  | "umrahPackages"
  | "tourPackages"
  | "insurance"
  | "travelBookings"
  | "payments"
  | "cashBook"
  | "refunds"
  | "users"
  | "activityLogs"
  | "settings";

function withQuery(path: string, query?: Record<string, string | number | undefined>): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

export const auth = {
  login: (username: string, password: string) =>
    api<{ user: PublicUser }>("/api/auth/login", { json: { username, password } }),
  logout: () => api<{ ok: true }>("/api/auth/logout", { method: "POST" }),
  me: () => api<{ user: PublicUser }>("/api/auth/me"),
};

export const bootstrap = () => api<BootstrapData>("/api/bootstrap");

export const data = {
  list: <T>(collection: CollectionName, query?: Record<string, string | number | undefined>) =>
    api<T[]>(withQuery(`/api/data/${collection}`, query)),
  get: <T>(collection: CollectionName, id: string) =>
    api<T>(`/api/data/${collection}/${id}`),
  create: <T>(collection: CollectionName, record: unknown) =>
    api<T>(`/api/data/${collection}`, { json: record }),
  update: <T>(collection: CollectionName, id: string, patch: unknown) =>
    api<T>(`/api/data/${collection}/${id}`, { method: "PATCH", json: patch }),
  remove: (collection: CollectionName, id: string) =>
    api<{ ok: true; id: string }>(`/api/data/${collection}/${id}`, { method: "DELETE" }),
};

export const settings = {
  get: () => api<{ exchangeRates: ExchangeRates; lastBackupAt?: string }>("/api/data/settings"),
  update: (patch: { exchangeRates?: ExchangeRates; lastBackupAt?: string }) =>
    api<{ exchangeRates: ExchangeRates; lastBackupAt?: string }>("/api/data/settings", {
      json: patch,
    }),
};

export const logActivity = (action: string, module: string, details = "") =>
  api<ActivityLog>("/api/activity", { json: { action, module, details } });

export const refreshExchangeRates = () =>
  api<{ rates: ExchangeRates; source: "live" | "stored"; updatedAt: string | null }>(
    "/api/exchange-rates"
  );

export const seed = {
  status: () => api<{ needsSeed: boolean }>("/api/seed"),
  run: (force = false) =>
    api<{ seeded: boolean; reason: string }>(withQuery("/api/seed", { force: force ? 1 : undefined }), {
      method: "POST",
    }),
};

/** Triggers a browser download of the full JSON backup (super admin only). */
export async function downloadBackup(): Promise<void> {
  const response = await fetch("/api/backup", { credentials: "same-origin", cache: "no-store" });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `Backup failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `al-noor-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const restoreBackup = (snapshot: unknown) =>
  api<{ ok: true; restored: Record<string, number>; skipped: string[] }>("/api/backup/restore", {
    json: { snapshot },
  });

/** `AppUser` without the password — what every user-facing endpoint returns. */
export type { PublicUser, AppUser };
