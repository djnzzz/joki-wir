import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { ok, created, badRequest, handleError } from "@/lib/api-response";
import { createGameSchema } from "@/lib/validations";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const games = await prisma.game.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { services: true, orderItems: true } } },
    });
    return ok(games);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const body = await req.json();
    const parsed = createGameSchema.safeParse(body);
    if (!parsed.success)
      return badRequest("Validasi gagal", parsed.error.flatten());

    const game = await prisma.game.create({ data: parsed.data });
    return created(game);
  } catch (error) {
    return handleError(error); // handleError sudah handle Prisma unique constraint (slug duplikat)
  }
}
