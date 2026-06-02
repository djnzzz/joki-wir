import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { ok, notFound, badRequest, handleError } from "@/lib/api-response";
import { assignJokiSchema } from "@/lib/validations";

import { Role, OrderStatus, NotifType } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    // Auth admin
    const session = await requireAdmin();

    if (!session.ok) {
      return session.response;
    }

    // Validasi body
    const body = await req.json();

    const parsed = assignJokiSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Validasi gagal", parsed.error.flatten());
    }

    const { jokiId } = parsed.data;

    // Validasi joki
    const joki = await prisma.user.findUnique({
      where: { id: jokiId },
    });

    if (!joki || joki.role !== Role.JOKI) {
      return badRequest("Joki tidak ditemukan");
    }

    if (!joki.isActive || joki.isBanned) {
      return badRequest("Akun joki tidak aktif");
    }

    // Ambil order
    const order = await prisma.order.findUnique({
      where: { id: id },
      include: {
        chatRoom: true,
      },
    });

    if (!order) {
      return notFound();
    }

    // Hanya order awaiting yang bisa diassign
    if (order.status !== OrderStatus.AWAITING) {
      return badRequest(
        `Order harus berstatus AWAITING, saat ini: ${order.status}`,
      );
    }

    // Hindari assign ulang
    if (order.jokiId) {
      return badRequest("Order sudah memiliki joki");
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update order
      const updatedOrder = await tx.order.update({
        where: { id: id },
        data: {
          jokiId,
          status: OrderStatus.ASSIGNED,
          assignedAt: new Date(),
        },
      });

      // Tambahkan joki ke chat room
      if (order.chatRoom) {
        await tx.chatRoomMember.upsert({
          where: {
            roomId_userId: {
              roomId: order.chatRoom.id,
              userId: jokiId,
            },
          },
          create: {
            roomId: order.chatRoom.id,
            userId: jokiId,
          },
          update: {},
        });
      }

      // Notifikasi user & joki
      await tx.notification.createMany({
        data: [
          {
            userId: order.userId,
            orderId: order.id,
            type: NotifType.ORDER_ASSIGNED,
            title: "Joki sudah ditugaskan!",
            body: `${joki.name} akan mengerjakan ordermu.`,
          },
          {
            userId: jokiId,
            orderId: order.id,
            type: NotifType.ORDER_ASSIGNED,
            title: "Kamu mendapat order baru!",
            body: `Order #${order.orderNumber} telah ditugaskan kepadamu.`,
          },
        ],
      });

      return updatedOrder;
    });

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}
