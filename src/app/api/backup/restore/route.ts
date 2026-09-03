import type { NextRequest } from "next/server";
import { getSession, isAdmin } from "@/lib/auth-server";
import { connectDB } from "@/lib/db";
import { handleApiError, json, jsonError, logActivity } from "@/lib/api-helpers";
import {
  buildSnapshot,
  isSnapshot,
  restoreSnapshot,
  saveBackup,
  type Snapshot,
} from "@/lib/backup";
import { Backup } from "@/models";
import type { BackupDoc } from "@/models";

export const dynamic = "force-dynamic";

/**
 * Restores a snapshot, either uploaded in the body or referenced by
 * `{ backupId }` from the stored history. The current data is snapshotted
 * first so a mistaken restore can itself be undone.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Not authenticated", 401);
    if (!isAdmin(session)) return jsonError("Only a super admin can restore backups", 403);

    const body = (await request.json().catch(() => null)) as
      | (Partial<Snapshot> & { backupId?: string; snapshot?: unknown })
      | null;
    if (!body) return jsonError("A JSON body is required", 400);

    await connectDB();

    let snapshot: unknown = body.snapshot ?? body;

    if (body.backupId) {
      const stored = await Backup.findOne({ id: body.backupId }).lean<BackupDoc | null>();
      if (!stored) return jsonError(`No backup found with id "${body.backupId}"`, 404);
      snapshot = stored.data;
    }

    if (!isSnapshot(snapshot)) {
      return jsonError("The payload is not a valid backup snapshot", 400);
    }

    const rollback = await buildSnapshot();
    await saveBackup(rollback, "restore", session.userId);

    const result = await restoreSnapshot(snapshot);
    await logActivity(
      session,
      "RESTORE",
      "Settings",
      `Restored backup from ${snapshot.createdAt ?? "uploaded file"}`
    );

    return json({ ok: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
