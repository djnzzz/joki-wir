import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api-response";

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { services: true } },
      },
    });
    return ok(games);
  } catch (error) {
    return handleError(error);
  }
}
