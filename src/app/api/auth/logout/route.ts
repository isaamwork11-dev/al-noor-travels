import { clearSessionCookie, getSession } from "@/lib/auth-server";
import { connectDB } from "@/lib/db";
import { json, logActivity } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();

  if (session) {
    try {
      await connectDB();
      await logActivity(session, "LOGOUT", "Auth", "User logged out");
    } catch {
      // Signing out must succeed even when the database is unreachable.
    }
  }

  await clearSessionCookie();
  return json({ ok: true });
}
