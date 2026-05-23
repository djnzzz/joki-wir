import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireJoki } from "@/lib/auth-helpers";
import { ok, handleError } from "@/lib/api-response";
import { OrderStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireJoki();

    if (!auth.ok) {
      return auth.response;
    }

    const statusParam = req.nextUrl.searchParams.get("status");
    const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "10");

    const status = statusParam as OrderStatus | null;

    const where = {
      jokiId: auth.userId,
      ...(status ? { status } : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              game: {
                select: { name: true },
              },
            },
          },
          user: {
            select: {
              name: true,
              phone: true,
            },
          },
          payment: {
            select: {
              status: true,
            },
          },
          progress: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),

      prisma.order.count({ where }),
    ]);

    return ok({
      orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
