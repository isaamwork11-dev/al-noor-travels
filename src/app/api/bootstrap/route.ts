import { can, getSession, toPublicUser } from "@/lib/auth-server";
import { connectDB } from "@/lib/db";
import {
  COLLECTIONS,
  getSettings,
  handleApiError,
  json,
  jsonError,
  sanitizeAll,
  type CollectionKey,
  type DbRecord,
} from "@/lib/api-helpers";
import { User } from "@/models";
import type { AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

const ACTIVITY_LOG_LIMIT = 500;

/** One request that hands the client every collection it needs to boot. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return jsonError("Not authenticated", 401);

    await connectDB();

    const currentUser = await User.findOne({ id: session.userId }).lean<AppUser | null>();
    if (!currentUser || !currentUser.active) return jsonError("Not authenticated", 401);

    const keys = Object.keys(COLLECTIONS) as CollectionKey[];
    const rows = await Promise.all(
      keys.map((key) => {
        const config = COLLECTIONS[key];
        const query = config.model
          .find({})
          .sort({ [config.sortField]: key === "users" ? 1 : -1 });
        if (key === "activityLogs") query.limit(ACTIVITY_LOG_LIMIT);
        return query.lean<DbRecord[]>();
      })
    );

    const data: Record<string, DbRecord[]> = {};
    keys.forEach((key, index) => {
      data[key] = sanitizeAll(rows[index]);
    });

    if (!can(session, "viewActivityLog")) data.activityLogs = [];

    const settings = await getSettings();

    return json({
      ...data,
      exchangeRates: settings.exchangeRates,
      lastBackupAt: settings.lastBackupAt ?? null,
      currentUser: toPublicUser(currentUser),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
