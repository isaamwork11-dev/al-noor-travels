import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession, isAdmin } from "@/lib/auth-server";
import { handleApiError, json, jsonError } from "@/lib/api-helpers";
import { needsSeed, seedDB } from "@/lib/seed";
import { User } from "@/models";

export const dynamic = "force-dynamic";

/**
 * Creates the initial admin on an empty database. Only `?force=1` explicitly
 * wipes and reseeds the demo dataset.
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const force = ["1", "true"].includes(
      (request.nextUrl.searchParams.get("force") ?? "").toLowerCase()
    );
    const empty = (await User.countDocuments()) === 0;

    if (!empty) {
      const session = await getSession();
      if (!isAdmin(session)) {
        return jsonError("Only a super admin can reseed a populated database", 403);
      }
    }

    const result = await seedDB(force);
    return json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

/** Lets the client ask whether seeding is still required. */
export async function GET() {
  try {
    return json({ needsSeed: await needsSeed() });
  } catch (error) {
    return handleApiError(error);
  }
}
