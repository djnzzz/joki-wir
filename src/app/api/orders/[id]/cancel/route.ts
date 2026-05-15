import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { requireAuth } from "@/lib/auth-helpers";
import {
  ok,
  notFound,
  forbidden,
  badRequest,
  handleError,
} from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    if (!session.ok) return session.response;
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
    });
    if (!order) return notFound();

    const isOwner = order.userId === session.userId;
    const isAdmin = session.role === "ADMIN";
    if (!isOwner && !isAdmin) return forbidden();

    const cancellableStatuses: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.AWAITING,
    ];
    if (!cancellableStatuses.includes(order.status)) {
      return badRequest(
        "Order hanya bisa dibatalkan saat status PENDING atau AWAITING",
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED },
      });
      await tx.notification.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          type: "ORDER_CANCELLED",
          title: "Order dibatalkan",
          body: "Order kamu telah dibatalkan.",
        },
      });
      return cancelled;
    });

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}
