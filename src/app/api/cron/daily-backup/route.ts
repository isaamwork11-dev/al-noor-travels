import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { handleApiError, json, jsonError } from "@/lib/api-helpers";
import { buildSnapshot, saveBackup } from "@/lib/backup";
import { Backup } from "@/models";

export const dynamic = "force-dynamic";

/** Keep a rolling window of automatic snapshots. */
const KEEP_BACKUPS = 30;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;

  return request.nextUrl.searchParams.get("secret") === secret;
}

/**
 * Scheduled snapshot endpoint. Call with `Authorization: Bearer <CRON_SECRET>`
 * or `?secret=<CRON_SECRET>`.
 */
export async function GET(request: NextRequest) {
  try {
    if (!process.env.CRON_SECRET) {
      return jsonError("CRON_SECRET is not configured on the server", 503);
    }
    if (!isAuthorized(request)) {
      return jsonError("Invalid cron secret", 401);
    }

    await connectDB();

    const snapshot = await buildSnapshot();
    const saved = await saveBackup(snapshot, "cron", "cron");

    const stale = await Backup.find({ source: "cron" }, { id: 1, _id: 0 })
      .sort({ createdAt: -1 })
      .skip(KEEP_BACKUPS)
      .lean<{ id: string }[]>();
    if (stale.length) {
      await Backup.deleteMany({ id: { $in: stale.map((doc) => doc.id) } });
    }

    return json({ ok: true, backupId: saved.id, createdAt: saved.createdAt, counts: saved.counts });
  } catch (error) {
    return handleApiError(error);
  }
}
