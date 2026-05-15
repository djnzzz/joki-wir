import { prisma } from "@/lib/prisma";
import { ok, notFound, handleError } from "@/lib/api-response";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const game = await prisma.game.findFirst({
      where: {
        slug,
        isActive: true,
      },
      include: {
        services: {
          where: {
            isActive: true,
          },
          orderBy: {
            category: "asc",
          },
        },
      },
    });

    if (!game) return notFound();

    return ok(game);
  } catch (error) {
    return handleError(error);
  }
}
