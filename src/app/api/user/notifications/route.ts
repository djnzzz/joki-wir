import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { ok, handleError, badRequest } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();

    if (!session.ok) {
      return badRequest("Unauthorized");
    }

    const unreadOnly = req.nextUrl.searchParams.get("unread") === "true";

    const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1");

    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "20");

    const where = {
      userId: session.userId,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),

      prisma.notification.count({
        where,
      }),

      prisma.notification.count({
        where: {
          userId: session.userId,
          isRead: false,
        },
      }),
    ]);

    return ok({
      notifications,
      unreadCount,
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

// PATCH: tandai notifikasi dibaca
// Body: { all: true } atau { ids: string[] }

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth();

    if (!session.ok) {
      return badRequest("Unauthorized");
    }

    const body = await req.json();

    // Tandai semua notif dibaca
    if (body.all === true) {
      await prisma.notification.updateMany({
        where: {
          userId: session.userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      return ok({
        message: "Semua notifikasi ditandai dibaca",
      });
    }

    // Tandai notif tertentu
    if (Array.isArray(body.ids) && body.ids.length > 0) {
      await prisma.notification.updateMany({
        where: {
          id: {
            in: body.ids,
          },
          userId: session.userId,
        },
        data: {
          isRead: true,
        },
      });

      return ok({
        message: `${body.ids.length} notifikasi ditandai dibaca`,
      });
    }

    return badRequest("Body harus berisi { all: true } atau { ids: string[] }");
  } catch (error) {
    return handleError(error);
  }
}
