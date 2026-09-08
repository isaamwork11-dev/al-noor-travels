import type { NextRequest } from "next/server";
import { can, getSession, hashPassword } from "@/lib/auth-server";
import { connectDB } from "@/lib/db";
import {
  COLLECTIONS,
  applyDerivedFields,
  handleApiError,
  isCollectionKey,
  json,
  jsonError,
  logActivity,
  sanitize,
  stripProtectedFields,
  type DbRecord,
} from "@/lib/api-helpers";
import { User } from "@/models";
import { nowISO } from "@/lib/format";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ collection: string; id: string }> };

export async function GET(_request: NextRequest, ctx: Context) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Not authenticated", 401);

    const { collection, id } = await ctx.params;
    if (!isCollectionKey(collection)) {
      return jsonError(`Unknown collection "${collection}"`, 404);
    }

    await connectDB();
    const record = await COLLECTIONS[collection].model.findOne({ id }).lean<DbRecord | null>();
    if (!record) return jsonError("Record not found", 404);

    return json(sanitize(record));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, ctx: Context) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Not authenticated", 401);

    const { collection, id } = await ctx.params;
    if (!isCollectionKey(collection)) {
      return jsonError(`Unknown collection "${collection}"`, 404);
    }

    const config = COLLECTIONS[collection];
    if (!can(session, "editRecords")) {
      return jsonError("You do not have permission to edit records", 403);
    }
    if (config.permission && !can(session, config.permission)) {
      return jsonError(`You do not have permission to edit ${config.module} records`, 403);
    }

    const body = (await request.json().catch(() => null)) as DbRecord | null;
    if (!body || typeof body !== "object") return jsonError("A JSON body is required", 400);

    await connectDB();
    const previous = await config.model.findOne({ id }).lean<DbRecord | null>();
    if (!previous) return jsonError("Record not found", 404);

    const payload = stripProtectedFields(body);
    delete payload.id;
    delete payload.createdAt;

    if (collection === "payments") {
      const bookingId = payload.bookingId ?? previous.bookingId;
      const partyId = payload.partyId ?? previous.partyId;
      if (typeof bookingId !== "string" || !bookingId) {
        return jsonError("A booking is required for every payment", 400);
      }
      if (typeof partyId !== "string" || !partyId) {
        return jsonError("A client or vendor account is required for every payment", 400);
      }
    }

    const update = await applyDerivedFields(collection, payload, previous);
    update.updatedAt = nowISO();

    if (collection === "users") {
      if (typeof update.username === "string" && update.username !== previous.username) {
        if (await User.exists({ username: update.username, id: { $ne: id } })) {
          return jsonError("That username is already taken", 409);
        }
      }
      if (typeof update.password === "string" && update.password) {
        update.password = await hashPassword(update.password);
      } else {
        delete update.password;
      }
    }

    await config.model.updateOne({ id }, { $set: update });
    const record = await config.model.findOne({ id }).lean<DbRecord | null>();

    const label = record?.bookingId ?? record?.name ?? record?.username ?? id;
    await logActivity(session, "UPDATE", config.module, `Updated ${String(label)}`);

    return json(sanitize(record));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: Context) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Not authenticated", 401);

    const { collection, id } = await ctx.params;
    if (!isCollectionKey(collection)) {
      return jsonError(`Unknown collection "${collection}"`, 404);
    }

    const config = COLLECTIONS[collection];
    if (!can(session, "deleteRecords")) {
      return jsonError("You do not have permission to delete records", 403);
    }
    if (config.permission && !can(session, config.permission)) {
      return jsonError(`You do not have permission to delete ${config.module} records`, 403);
    }
    if (collection === "users" && id === session.userId) {
      return jsonError("You cannot delete your own account", 400);
    }

    await connectDB();
    const previous = await config.model.findOne({ id }).lean<DbRecord | null>();
    if (!previous) return jsonError("Record not found", 404);

    await config.model.deleteOne({ id });

    const label = previous.bookingId ?? previous.name ?? previous.username ?? id;
    await logActivity(session, "DELETE", config.module, `Deleted ${String(label)}`);

    return json({ ok: true, id });
  } catch (error) {
    return handleApiError(error);
  }
}
