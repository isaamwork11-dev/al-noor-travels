import { SignJWT, jwtVerify } from "jose";
import type { AppUser, UserPermissions, UserRole } from "./types";

export const COOKIE_NAME = "alnoor_token";
export const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

const JWT_SECRET = process.env.JWT_SECRET || "al-noor-dev-secret-change-me";
const secretKey = new TextEncoder().encode(JWT_SECRET);
const ALG = "HS256";

export interface Session {
  userId: string;
  username: string;
  name: string;
  role: UserRole;
  permissions: UserPermissions;
}

type TokenSubject = Pick<AppUser, "id" | "username" | "name" | "role" | "permissions">;

export async function signToken(user: TokenSubject): Promise<string> {
  return new SignJWT({
    username: user.username,
    name: user.name,
    role: user.role,
    permissions: user.permissions,
  })
    .setProtectedHeader({ alg: ALG })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(secretKey);
}

export async function verifyToken(token: string | undefined | null): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey, { algorithms: [ALG] });
    if (!payload.sub) return null;
    return {
      userId: payload.sub,
      username: String(payload.username ?? ""),
      name: String(payload.name ?? ""),
      role: (payload.role as UserRole) ?? "staff",
      permissions: (payload.permissions as UserPermissions) ?? ({} as UserPermissions),
    };
  } catch {
    return null;
  }
}

export function isAdmin(session: Session | null): boolean {
  return session?.role === "super_admin";
}

export function can(session: Session | null, permission: keyof UserPermissions): boolean {
  if (!session) return false;
  if (session.role === "super_admin") return true;
  return Boolean(session.permissions?.[permission]);
}
