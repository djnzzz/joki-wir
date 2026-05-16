import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { ok, notFound, badRequest, handleError } from "@/lib/api-response";
import { snap } from "@/lib/midtrans";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session.ok) return session.response;
    const { orderId } = await req.json();
    if (!orderId) return badRequest("orderId wajib diisi");

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, payment: true },
    });
    if (!order) return notFound();
    if (order.userId !== session.userId) return badRequest("Akses ditolak");
    if (order.status !== "PENDING")
      return badRequest("Order sudah tidak bisa dibayar");
    if (order.payment?.snapToken) {
      // Return existing token jika sudah ada (idempotent)
      return ok({ snapToken: order.payment.snapToken });
    }

    const snapResponse = await snap.createTransaction({
      transaction_details: {
        order_id: order.orderNumber,
        gross_amount: order.finalAmount,
      },
      customer_details: {
        first_name: order.user.name ?? "Pembeli",
        email: order.user.email,
        phone: order.user.phone ?? "",
      },
      item_details: [
        {
          id: order.id,
          price: order.finalAmount,
          quantity: 1,
          name: `Order Jokiwir #${order.orderNumber}`,
        },
      ],
    });

    // Simpan snapToken ke payment
    await prisma.payment.update({
      where: { orderId: order.id },
      data: {
        snapToken: snapResponse.token,
        externalId: order.orderNumber,
      },
    });

    return ok({ snapToken: snapResponse.token });
  } catch (error) {
    return handleError(error);
  }
}
