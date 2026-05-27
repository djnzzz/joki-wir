import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { ok, handleError } from "@/lib/api-response";
import { rateLimiters, checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(30, "Username maksimal 30 karakter")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username hanya boleh huruf, angka, dan underscore",
    ),
});

// GET /api/auth/check-username?username=xxx
export async function GET(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    const rl = await checkRateLimit(rateLimiters.checkUsername, `check:${ip}`);
    if (!rl.success) {
      return ok({ available: true, reason: null }); // silent — jangan block UX
    }

    const username = req.nextUrl.searchParams.get("username");

    const parsed = schema.safeParse({ username });
    if (!parsed.success) {
      return ok({
        available: false,
        reason: parsed.error.issues[0].message,
      });
    }

    const existing = await prisma.user.findFirst({
      where: {
        name: {
          equals: parsed.data.username,
          mode: "insensitive", // agar tidak case-sensitive
        },
      },
      select: { id: true },
    });

    return ok({
      available: !existing,
      reason: existing ? "Username sudah digunakan" : null,
    });
  } catch (error) {
    return handleError(error);
  }
}
