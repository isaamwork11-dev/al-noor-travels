import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import {
  comparePassword,
  setSessionCookie,
  signToken,
  toPublicUser,
} from "@/lib/auth-server";
import { handleApiError, json, jsonError, logActivity } from "@/lib/api-helpers";
import { seedDB } from "@/lib/seed";
import { User } from "@/models";
import type { AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = (await request.json().catch(() => ({}))) as {
      username?: string;
      password?: string;
    };
    const username = body.username?.trim();
    const password = body.password ?? "";

    if (!username || !password) {
      return jsonError("Username and password are required", 400);
    }

    // First run against a fresh database: load the demo accounts so the
    // operator can actually sign in.
    if ((await User.countDocuments()) === 0) {
      await seedDB();
    }

    const user = await User.findOne({ username }).lean<AppUser | null>();
    if (!user || !(await comparePassword(password, user.password))) {
      return jsonError("Invalid username or password", 401);
    }
    if (!user.active) {
      return jsonError("This account has been deactivated", 403);
    }

    const token = await signToken(user);
    await setSessionCookie(token);

    const session = {
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
    };
    await logActivity(session, "LOGIN", "Auth", "User logged in");

    return json({ user: toPublicUser(user) });
  } catch (error) {
    return handleApiError(error);
  }
}
