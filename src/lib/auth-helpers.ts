import { auth } from "@/auth";
import { forbidden, unauthorized } from "@/lib/api-response";
import type { Role } from "@prisma/client";

type AuthResult =
  | { ok: true; userId: string; role: Role }
  | { ok: false; response: Response };

// Cek: user harus login
export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, response: unauthorized() };
  }
  return { ok: true, userId: session.user.id, role: session.user.role };
}

// Cek: user harus punya salah satu role
export async function requireRole(...roles: Role[]): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, response: unauthorized() };
  }
  if (!roles.includes(session.user.role)) {
    return { ok: false, response: forbidden() };
  }
  return { ok: true, userId: session.user.id, role: session.user.role };
}

// Cek: harus ADMIN
export async function requireAdmin(): Promise<AuthResult> {
  return requireRole("ADMIN");
}

// Cek: harus JOKI
export async function requireJoki(): Promise<AuthResult> {
  return requireRole("JOKI");
}

// Cek: harus ADMIN atau JOKI
export async function requireStaff(): Promise<AuthResult> {
  return requireRole("ADMIN", "JOKI");
}
