import { getSession, toPublicUser } from "@/lib/auth-server";
import { connectDB } from "@/lib/db";
import { handleApiError, json, jsonError } from "@/lib/api-helpers";
import { User } from "@/models";
import type { AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return jsonError("Not authenticated", 401);

    await connectDB();
    const user = await User.findOne({ id: session.userId }).lean<AppUser | null>();
    if (!user || !user.active) return jsonError("Not authenticated", 401);

    return json({ user: toPublicUser(user) });
  } catch (error) {
    return handleApiError(error);
  }
}
