import type { NextRequest } from "next/server";
import { getSession, isAdmin } from "@/lib/auth-server";
import { connectDB } from "@/lib/db";
import {
  handleApiError,
  json,
  jsonError,
  logActivity,
  sanitizeAll,
  type DbRecord,
} from "@/lib/api-helpers";
import { buildSnapshot, saveBackup, snapshotCounts } from "@/lib/backup";
import { Backup } from "@/models";

export const dynamic = "force-dynamic";

/**
 * Downloads a full JSON snapshot and stores a copy in the `Backup` collection.
 * Pass `?list=1` to read the backup history instead.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Not authenticated", 401);
    if (!isAdmin(session)) return jsonError("Only a super admin can export backups", 403);

    await connectDB();

    if (request.nextUrl.searchParams.get("list")) {
      const history = await Backup.find({}, { data: 0 })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean<DbRecord[]>();
      return json(sanitizeAll(history));
    }

    const snapshot = await buildSnapshot();
    const saved = await saveBackup(snapshot, "manual", session.userId);
    await logActivity(
      session,
      "BACKUP",
      "Settings",
      `Exported backup ${saved.id} (${Object.values(snapshotCounts(snapshot)).reduce(
        (total, count) => total + count,
        0
      )} records)`
    );

    const filename = `al-noor-backup-${snapshot.createdAt.slice(0, 10)}.json`;
    return new Response(JSON.stringify({ ...snapshot, backupId: saved.id }, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
