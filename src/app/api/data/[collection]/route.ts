import type { NextRequest } from "next/server";
import { can, getSession, hashPassword } from "@/lib/auth-server";
import { connectDB } from "@/lib/db";
import {
  COLLECTIONS,
  applyDerivedFields,
  getSettings,
  handleApiError,
  isCollectionKey,
  json,
  jsonError,
  logActivity,
  nextBookingIdFromDb,
  sanitize,
  sanitizeAll,
  stripProtectedFields,
  type DbRecord,
} from "@/lib/api-helpers";
import { nextId, todayISO } from "@/lib/format";
import { AppSettings, SETTINGS_ID, User } from "@/models";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ collection: string }> };

/** Query params that are filters rather than list options. */
const RESERVED_PARAMS = new Set(["limit", "sort", "q"]);

export async function GET(request: NextRequest, ctx: Context) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Not authenticated", 401);

    const { collection } = await ctx.params;
    await connectDB();

    if (collection === "settings") {
      const settings = await getSettings();
      return json(sanitize(settings as unknown as DbRecord));
    }

    if (!isCollectionKey(collection)) {
      return jsonError(`Unknown collection "${collection}"`, 404);
    }
    if (collection === "activityLogs" && !can(session, "viewActivityLog")) {
      return jsonError("You do not have permission to view the activity log", 403);
    }

    const config = COLLECTIONS[collection];
    const params = request.nextUrl.searchParams;

    const filter: Record<string, unknown> = {};
    for (const [key, value] of params.entries()) {
      if (RESERVED_PARAMS.has(key) || !value) continue;
      filter[key] = value;
    }

    const limit = Number(params.get("limit") ?? 0);
    const query = config.model
      .find(filter)
      .sort({ [config.sortField]: collection === "users" ? 1 : -1 });
    if (Number.isFinite(limit) && limit > 0) query.limit(limit);

    const records = await query.lean<DbRecord[]>();
    return json(sanitizeAll(records));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, ctx: Context) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Not authenticated", 401);

    const { collection } = await ctx.params;
    const body = (await request.json().catch(() => null)) as DbRecord | null;
    if (!body || typeof body !== "object") return jsonError("A JSON body is required", 400);

    await connectDB();

    // `settings` is a singleton, so POST behaves as an update.
    if (collection === "settings") {
      if (!can(session, "manageUsers") && session.role !== "super_admin") {
        return jsonError("You do not have permission to change settings", 403);
      }
      const update: DbRecord = {};
      if (body.exchangeRates) update.exchangeRates = body.exchangeRates;
      if (typeof body.lastBackupAt === "string") update.lastBackupAt = body.lastBackupAt;
      await AppSettings.updateOne({ id: SETTINGS_ID }, { $set: update }, { upsert: true });
      await logActivity(session, "UPDATE", "Settings", "Updated application settings");
      const settings = await getSettings();
      return json(sanitize(settings as unknown as DbRecord));
    }

    if (!isCollectionKey(collection)) {
      return jsonError(`Unknown collection "${collection}"`, 404);
    }

    const config = COLLECTIONS[collection];
    if (!can(session, "createRecords")) {
      return jsonError("You do not have permission to create records", 403);
    }
    if (config.permission && !can(session, config.permission)) {
      return jsonError(`You do not have permission to add ${config.module} records`, 403);
    }

    const payload = stripProtectedFields(body);
    const record = await applyDerivedFields(collection, payload);

    record.id = typeof record.id === "string" && record.id ? record.id : nextId(config.idPrefix);
    record.createdAt =
      typeof record.createdAt === "string" && record.createdAt
        ? record.createdAt
        : collection === "activityLogs"
          ? new Date().toISOString()
          : todayISO();

    if (config.service && !record.bookingId) {
      record.bookingId = await nextBookingIdFromDb();
    }
    if (!record.createdBy) record.createdBy = session.userId;

    if (collection === "customers" && !record.customerId) {
      const count = await config.model.countDocuments();
      record.customerId = `CUS-${String(count + 1).padStart(4, "0")}`;
    }

    if (collection === "users") {
      if (typeof record.username !== "string" || !record.username) {
        return jsonError("A username is required", 400);
      }
      if (await User.exists({ username: record.username })) {
        return jsonError("That username is already taken", 409);
      }
      if (typeof record.password !== "string" || record.password.length < 4) {
        return jsonError("A password of at least 4 characters is required", 400);
      }
      record.password = await hashPassword(record.password);
    }

    const created = await config.model.create(record);
    const label = record.bookingId ?? record.name ?? record.username ?? record.id;
    await logActivity(session, "CREATE", config.module, `Created ${String(label)}`);

    return json(sanitize(created.toObject() as DbRecord), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
