import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { requireAuth } from "@/lib/auth-helpers";
import { ok, created, badRequest, handleError } from "@/lib/api-response";
import { createOrderSchema } from "@/lib/validations";
import {
  calculateOrderTotal,
  applyVoucher,
  generateOrderNumber,
} from "@/lib/order-helpers";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session.ok) return session.response;
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");

    const where = {
      userId: session.userId,
      ...(status ? { status: status as OrderStatus } : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          items: { include: { game: { select: { name: true, slug: true } } } },
          payment: { select: { status: true, snapToken: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return ok({
      orders,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session.ok) return session.response;
    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success)
      return badRequest("Validasi gagal", parsed.error.flatten());

    const { items, voucherCode, gameAccount, notes } = parsed.data;

    // Hitung harga
    const { subtotal, enrichedItems } = await calculateOrderTotal(items);

    // Apply voucher (opsional)
    let discountAmount = 0;
    let voucherId: string | undefined;
    if (voucherCode) {
      const voucherResult = await applyVoucher(
        voucherCode,
        subtotal,
        session.userId,
      );
      discountAmount = voucherResult.discountAmount;
      voucherId = voucherResult.voucher.id;
    }

    const finalAmount = subtotal - discountAmount;

    // Buat order dalam satu transaksi
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: session.userId,
          status: "PENDING",
          subtotal,
          discountAmount,
          finalAmount,
          voucherCode: voucherCode ?? null,
          gameAccount,
          notes: notes ?? null,
          items: {
            create: enrichedItems,
          },
          payment: {
            create: {
              provider: "MIDTRANS",
              status: "PENDING",
              amount: finalAmount,
              idempotencyKey: `${session.userId}-${Date.now()}`,
            },
          },
          chatRoom: {
            create: {
              isOpen: true,
              members: {
                create: { userId: session.userId },
              },
            },
          },
          notifications: {
            create: {
              userId: session.userId,
              type: "ORDER_CREATED",
              title: "Order berhasil dibuat",
              body: `Order kamu sedang menunggu konfirmasi admin.`,
            },
          },
        },
        include: {
          items: true,
          payment: true,
        },
      });

      // Update voucher usage
      if (voucherId) {
        await tx.voucher.update({
          where: { id: voucherId },
          data: { usageCount: { increment: 1 } },
        });
        await tx.voucherUsage.create({
          data: { voucherId, userId: session.userId, orderId: newOrder.id },
        });
      }

      return newOrder;
    });

    return created(order);
  } catch (error) {
    return handleError(error);
  }
}
