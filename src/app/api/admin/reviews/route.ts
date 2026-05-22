import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { ok, handleError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "20");
    const visible = req.nextUrl.searchParams.get("visible");

    const where = visible !== null ? { isVisible: visible === "true" } : {};

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true } },
          service: { select: { name: true } },
          order: { select: { orderNumber: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return ok({
      reviews,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleError(error);
  }
}
