import type { NextRequest } from "next/server";
import { can, getSession } from "@/lib/auth-server";
import { connectDB } from "@/lib/db";
import {
  handleApiError,
  json,
  jsonError,
  sanitizeAll,
  type DbRecord,
} from "@/lib/api-helpers";
import { nextId } from "@/lib/format";
import { ActivityLog } from "@/models";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 200;

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Not authenticated", 401);
    if (!can(session, "viewActivityLog")) {
      return jsonError("You do not have permission to view the activity log", 403);
    }

    await connectDB();
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? DEFAULT_LIMIT);
    const logs = await ActivityLog.find({})
      .sort({ createdAt: -1 })
      .limit(Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_LIMIT)
      .lean<DbRecord[]>();

    return json(sanitizeAll(logs));
  } catch (error) {
    return handleApiError(error);
  }
}

/** Records a client-side action in the audit trail. */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Not authenticated", 401);

    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
      module?: string;
      details?: string;
    };
    if (!body.action || !body.module) {
      return jsonError("`action` and `module` are required", 400);
    }

    await connectDB();
    const log = {
      id: nextId("log"),
      userId: session.userId,
      userName: session.name,
      action: body.action,
      module: body.module,
      details: body.details ?? "",
      createdAt: new Date().toISOString(),
    };
    await ActivityLog.create(log);

    return json(log, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
