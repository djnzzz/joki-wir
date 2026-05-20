import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { ok, created, badRequest, handleError } from "@/lib/api-response";
import { createServiceSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const gameId = req.nextUrl.searchParams.get("gameId");
    const services = await prisma.service.findMany({
      where: gameId ? { gameId } : {},
      include: { game: { select: { name: true, slug: true } } },
      orderBy: [{ gameId: "asc" }, { category: "asc" }],
    });
    return ok(services);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const body = await req.json();
    const parsed = createServiceSchema.safeParse(body);
    if (!parsed.success)
      return badRequest("Validasi gagal", parsed.error.flatten());

    const service = await prisma.service.create({ data: parsed.data });
    return created(service);
  } catch (error) {
    return handleError(error);
  }
}
