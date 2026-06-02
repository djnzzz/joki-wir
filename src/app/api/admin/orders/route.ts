import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { OrderStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth-helpers";
import { ok, handleError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session.ok) return session.response;

    const { searchParams } = req.nextUrl;

    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = Math.max(
      1,
      Number.parseInt(searchParams.get("page") ?? "1") || 1,
    );
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(searchParams.get("limit") ?? "15") || 15),
    );

    const validStatus =
      status && Object.values(OrderStatus).includes(status as OrderStatus)
        ? (status as OrderStatus)
        : undefined;

    const where: Prisma.OrderWhereInput = {
      ...(validStatus ? { status: validStatus } : {}),
      ...(search
        ? {
            orderNumber: {
              startsWith: search,
              mode: "insensitive",
            },
          }
        : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          joki: {
            select: {
              id: true,
              name: true,
            },
          },

          items: {
            include: {
              game: {
                select: {
                  name: true,
                  slug: true,
                },
              },
            },
          },

          payment: {
            select: {
              status: true,
              snapToken: true,
            },
          },
        },
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
