import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, handleError } from "@/lib/api-response";
import { ServiceCategory } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const category = req.nextUrl.searchParams.get("category");

    const validCategory =
      category &&
      Object.values(ServiceCategory).includes(category as ServiceCategory)
        ? (category as ServiceCategory)
        : undefined;

    const game = await prisma.game.findFirst({
      where: {
        slug,
        isActive: true,
      },
    });

    if (!game) return notFound();

    const services = await prisma.service.findMany({
      where: {
        gameId: game.id,
        ...(validCategory ? { category: validCategory } : {}),
      },
      orderBy: {
        category: "asc",
      },
    });

    return ok(services);
  } catch (error) {
    return handleError(error);
  }
}
