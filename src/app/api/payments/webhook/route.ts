import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentStatus, NotifType } from "@prisma/client";
import { midtransWebhookSchema } from "@/lib/validations";
import { verifyMidtransSignature } from "@/lib/midtrans";

// Webhook TIDAK pakai requireAuth
// karena request berasal dari server Midtrans
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = midtransWebhookSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Bad payload" }, { status: 400 });
    }

    const {
      order_id,
      transaction_status,
      fraud_status,
      signature_key,
      gross_amount,
      status_code,
    } = parsed.data;

    // Cari order berdasarkan orderNumber
    const order = await prisma.order.findUnique({
      where: { orderNumber: order_id },
      include: { payment: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verifikasi signature Midtrans
    const isValid = verifyMidtransSignature(
      order_id,
      status_code,
      gross_amount,
      signature_key,
    );

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // Mapping status payment
    let paymentStatus: PaymentStatus = PaymentStatus.PENDING;

    if (transaction_status === "capture" && fraud_status === "accept") {
      paymentStatus = PaymentStatus.PAID;
    } else if (transaction_status === "settlement") {
      paymentStatus = PaymentStatus.PAID;
    } else if (["cancel", "deny", "failure"].includes(transaction_status)) {
      paymentStatus = PaymentStatus.FAILED;
    } else if (transaction_status === "expire") {
      paymentStatus = PaymentStatus.EXPIRED;
    } else if (transaction_status === "pending") {
      paymentStatus = PaymentStatus.PENDING;
    }

    // Hindari duplicate processing
    const alreadyProcessed = order.payment?.status === paymentStatus;

    if (alreadyProcessed) {
      return NextResponse.json({
        received: true,
        duplicate: true,
      });
    }

    await prisma.$transaction(async (tx) => {
      // Update payment
      await tx.payment.update({
        where: { orderId: order.id },
        data: {
          status: paymentStatus,
          externalId: order_id,
          rawResponse: body,
          paidAt: paymentStatus === PaymentStatus.PAID ? new Date() : null,
        },
      });

      // Jika pembayaran sukses
      if (
        paymentStatus === PaymentStatus.PAID &&
        order.status === OrderStatus.PENDING
      ) {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.AWAITING,
            paidAt: new Date(),
          },
        });

        await tx.notification.create({
          data: {
            userId: order.userId,
            orderId: order.id,
            type: NotifType.PAYMENT_SUCCESS,
            title: "Pembayaran berhasil!",
            body: "Order kamu sedang menunggu admin menugaskan joki.",
          },
        });
      }

      // Jika gagal / expire
      const failedStatuses: PaymentStatus[] = [
        PaymentStatus.FAILED,
        PaymentStatus.EXPIRED,
      ];
      if (failedStatuses.includes(paymentStatus)) {
        await tx.notification.create({
          data: {
            userId: order.userId,
            orderId: order.id,
            type: NotifType.PAYMENT_FAILED,
            title: "Pembayaran gagal",
            body:
              paymentStatus === PaymentStatus.EXPIRED
                ? "Waktu pembayaran habis."
                : "Pembayaran gagal atau ditolak.",
          },
        });
      }
    });

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error("[MIDTRANS_WEBHOOK_ERROR]", error);

    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
