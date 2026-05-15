import { prisma } from "@/lib/prisma";

export type OrderItem = {
  serviceId: string;
  quantity: number;
  useBundle: boolean;
};

export async function calculateOrderTotal(items: OrderItem[]) {
  const serviceIds = items.map((i) => i.serviceId);
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    include: { game: true },
  });

  let subtotal = 0;
  const enrichedItems = items.map((item) => {
    const service = services.find((s) => s.id === item.serviceId);
    if (!service) throw new Error(`Service ${item.serviceId} tidak ditemukan`);

    const unitPrice =
      item.useBundle && service.priceBundle
        ? service.priceBundle
        : service.priceUnit;

    if (!unitPrice)
      throw new Error(`Service ${service.name} tidak memiliki harga`);

    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    return {
      serviceId: service.id,
      gameId: service.gameId,
      serviceName: service.name,
      gameName: service.game.name,
      category: service.category,
      priceSnapshot: unitPrice,
      quantity: item.quantity,
    };
  });

  return { subtotal, enrichedItems };
}

export async function applyVoucher(
  code: string,
  subtotal: number,
  userId: string,
) {
  const voucher = await prisma.voucher.findUnique({ where: { code } });
  if (!voucher) throw new Error("Kode voucher tidak valid");
  if (voucher.expiredAt && voucher.expiredAt < new Date())
    throw new Error("Voucher sudah kadaluarsa");
  if (voucher.minOrder && subtotal < voucher.minOrder) {
    throw new Error(
      `Minimum order Rp ${voucher.minOrder.toLocaleString("id-ID")}`,
    );
  }

  // Cek usage limit global
  if (voucher.usageLimit !== null && voucher.usageCount >= voucher.usageLimit) {
    throw new Error("Kuota voucher sudah habis");
  }

  // Cek per-user limit
  if (voucher.perUserLimit !== null) {
    const userUsage = await prisma.voucherUsage.count({
      where: { voucherId: voucher.id, userId },
    });
    if (userUsage >= voucher.perUserLimit)
      throw new Error("Kamu sudah pernah pakai voucher ini");
  }

  let discountAmount =
    voucher.type === "PERCENTAGE"
      ? Math.floor(subtotal * (voucher.value / 100))
      : voucher.value;

  if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
    discountAmount = voucher.maxDiscount;
  }

  return { voucher, discountAmount };
}

// Generate order number: JKW-YYYYMMDD-XXXX
export function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `JKW-${date}-${rand}`;
}
