import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { ok, badRequest, handleError } from "@/lib/api-response";
import { broadcastNotifSchema } from "@/lib/validations";
import { NotifType, Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    if (!admin.ok) {
      return badRequest("Unauthorized");
    }

    const body = await req.json();

    const parsed = broadcastNotifSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Validasi gagal", parsed.error.flatten());
    }

    const { type, title, body: notifBody, actionUrl, targetRole } = parsed.data;

    // Tentukan target role
    const userWhere =
      targetRole === "ALL"
        ? {
            isActive: true,
          }
        : {
            isActive: true,
            role: targetRole as Role,
          };

    // Ambil user target
    const users = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
      },
    });

    if (users.length === 0) {
      return ok({
        sent: 0,
        message: "Tidak ada user target",
      });
    }

    // Insert notifikasi massal
    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type: type as NotifType,
        title,
        body: notifBody,
        actionUrl: actionUrl ?? null,
      })),
    });

    return ok({
      sent: users.length,
      message: `Notifikasi dikirim ke ${users.length} user`,
    });
  } catch (error) {
    return handleError(error);
  }
}
