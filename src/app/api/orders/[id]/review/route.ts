import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import {
  ok,
  created,
  notFound,
  forbidden,
  badRequest,
  handleError,
} from "@/lib/api-response";
import { createReviewSchema } from "@/lib/validations";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    if (!session.ok) return session.response;
    const { id } = await params;
    const review = await prisma.review.findUnique({
      where: { orderId: id },
    });
    return ok(review);
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
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { select: { serviceId: true } } },
    });
    if (!order) return notFound();
    if (order.userId !== session.userId) return forbidden();
    if (order.status !== "DONE")
      return badRequest("Review hanya bisa dibuat setelah order selesai");

    const existing = await prisma.review.findUnique({
      where: { orderId: id },
    });
    if (existing)
      return badRequest("Kamu sudah memberi review untuk order ini");

    const body = await req.json();
    const parsed = createReviewSchema.safeParse(body);
    if (!parsed.success)
      return badRequest("Validasi gagal", parsed.error.flatten());

    const review = await prisma.review.create({
      data: {
        orderId: id,
        userId: session.userId,
        serviceId: order.items[0]!.serviceId,
        ...parsed.data,
      },
    });
    return created(review);
  } catch (error) {
    return handleError(error);
  }
}
