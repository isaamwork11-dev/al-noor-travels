import { cookies } from "next/headers";
import { compare, hash } from "bcryptjs";
import {
  COOKIE_NAME,
  TOKEN_TTL_SECONDS,
  can,
  isAdmin,
  signToken,
  verifyToken,
  type Session,
} from "./jwt";
import type { AppUser, PublicUser } from "./types";

// The token primitives live in `jwt.ts` so `proxy.ts` can verify a cookie
// without pulling in `next/headers` or bcrypt.
export { COOKIE_NAME, TOKEN_TTL_SECONDS, can, isAdmin, signToken, verifyToken };
export type { Session };

/** Reads and verifies the session from the `alnoor_token` cookie. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE_NAME)?.value);
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set({ name: COOKIE_NAME, value: "", httpOnly: true, path: "/", maxAge: 0 });
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

export async function comparePassword(password: string, hashed: string): Promise<boolean> {
  // Seeded or imported records may still hold a plaintext password; accept
  // those so an unhashed import doesn't lock everyone out.
  if (!hashed.startsWith("$2")) return password === hashed;
  return compare(password, hashed);
}

/** Never send password hashes (or Mongo internals) to the browser. */
export function toPublicUser(user: AppUser & { _id?: unknown; __v?: unknown }): PublicUser {
  const { password: _password, _id: _mongoId, __v: _version, ...rest } = user;
  void _password;
  void _mongoId;
  void _version;
  return rest;
}
