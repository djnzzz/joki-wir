import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { requireAuth } from "@/lib/auth-helpers";
import {
  ok,
  notFound,
  forbidden,
  badRequest,
  handleError,
} from "@/lib/api-response";
import { addProgressSchema } from "@/lib/validations";

export async function GET(
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

    const canAccess =
      session.role === "ADMIN" ||
      order.userId === session.userId ||
      order.jokiId === session.userId;

    if (!canAccess) return forbidden();

    const progress = await prisma.orderProgress.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "asc" },
    });
    return ok(progress);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    if (!session.ok) return session.response;
    if (session.role !== Role.JOKI && session.role !== Role.ADMIN) {
      return forbidden();
    }
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
    });
    if (!order) return notFound();
    if (order.status !== "IN_PROGRESS")
      return badRequest("Order harus berstatus IN_PROGRESS");
    if (session.role === "JOKI" && order.jokiId !== session.userId)
      return forbidden();

    const body = await req.json();
    const parsed = addProgressSchema.safeParse(body);
    if (!parsed.success)
      return badRequest("Validasi gagal", parsed.error.flatten());

    const progress = await prisma.$transaction(async (tx) => {
      const newProgress = await tx.orderProgress.create({
        data: {
          orderId: id,
          jokiId: session.userId,
          ...parsed.data,
        },
      });

      await tx.notification.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          type: "ORDER_PROGRESS",
          title: "Update progress dari joki",
          body: parsed.data.step,
        },
      });

      return newProgress;
    });

    return ok(progress);
  } catch (error) {
    return handleError(error);
  }
}
