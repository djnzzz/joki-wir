import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import {
  ok,
  notFound,
  badRequest,
  handleError,
  noContent,
} from "@/lib/api-response";
import { createGameSchema } from "@/lib/validations";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const game = await prisma.game.findUnique({
      where: { id: params.id },
      include: { services: { orderBy: { category: "asc" } } },
    });
    if (!game) return notFound();
    return ok(game);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const body = await req.json();
    const parsed = createGameSchema.partial().safeParse(body);
    if (!parsed.success)
      return badRequest("Validasi gagal", parsed.error.flatten());

    const game = await prisma.game.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return ok(game);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    // Cek apakah game punya order aktif — jangan hapus kalau masih ada
    const activeOrders = await prisma.orderItem.count({
      where: {
        gameId: params.id,
        order: { status: { notIn: ["DONE", "CANCELLED"] } },
      },
    });
    if (activeOrders > 0) {
      return badRequest(
        `Game masih punya ${activeOrders} order aktif. Selesaikan dulu sebelum hapus.`,
      );
    }

    // Soft delete: set isActive = false, bukan hapus dari DB
    await prisma.game.update({
      where: { id: params.id },
      data: { isActive: false },
    });
    return noContent();
  } catch (error) {
    return handleError(error);
  }
}
