import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { ok, badRequest, handleError } from "@/lib/api-response";
import { updateProfileSchema } from "@/lib/validations";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { orders: true, reviews: true },
        },
      },
    });
    return ok(user);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success)
      return badRequest("Validasi gagal", parsed.error.flatten());

    const user = await prisma.user.update({
      where: { id: auth.userId },
      data: parsed.data,
      select: { id: true, name: true, email: true, phone: true, role: true },
    });
    return ok(user);
  } catch (error) {
    return handleError(error);
  }
}
