import { z } from "zod";

// Orders
export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        serviceId: z.string().cuid(),
        quantity: z.number().int().min(1).max(10),
        useBundle: z.boolean().default(false),
      }),
    )
    .min(1),
  voucherCode: z.string().optional(),
  gameAccount: z.string().min(3, "Game account wajib diisi").max(100),
  notes: z.string().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "CANCELLED",
    "AWAITING",
    "ASSIGNED",
    "IN_PROGRESS",
    "COMPLETED",
    "DONE",
  ]),
  note: z.string().max(300).optional(),
});

export const addProgressSchema = z.object({
  step: z.string().min(1).max(100),
  note: z.string().max(500).optional(),
  proofUrl: z.string().url().optional(),
});

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5).max(1000).optional(),
});

// Payments
export const midtransWebhookSchema = z.object({
  order_id: z.string(),
  transaction_status: z.string(),
  fraud_status: z.string().optional(),
  signature_key: z.string(),
  gross_amount: z.string(),
  status_code: z.string(),
  payment_type: z.string().optional(),
});

// Admin
export const assignJokiSchema = z.object({
  jokiId: z.string().cuid(),
});

export const updateContentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).optional(),
});

// Voucher
export const validateVoucherSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().positive(),
});

export const createVoucherSchema = z
  .object({
    code: z
      .string()
      .min(3)
      .max(30)
      .regex(/^[A-Z0-9_-]+$/, "Kode hanya huruf kapital, angka, - dan _"),
    type: z.enum(["PERCENTAGE", "FIXED"]),
    value: z.number().positive(),
    minOrder: z.number().positive().optional(),
    maxDiscount: z.number().positive().optional(),
    usageLimit: z.number().int().positive().optional(),
    perUserLimit: z.number().int().positive().optional(),
    startAt: z.string().datetime().optional(),
    expiredAt: z.string().datetime().optional(),
  })
  .refine(
    (d) => {
      if (d.type === "PERCENTAGE" && d.value > 100) return false;
      return true;
    },
    { message: "Persentase diskon tidak boleh lebih dari 100%" },
  );

// Notif
export const broadcastNotifSchema = z.object({
  type: z.enum([
    "ORDER_CREATED",
    "ORDER_ASSIGNED",
    "ORDER_PROGRESS",
    "ORDER_COMPLETED",
    "ORDER_CANCELLED",
    "PAYMENT_SUCCESS",
    "PAYMENT_FAILED",
    "BROADCAST",
    "PROMO",
  ]),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  actionUrl: z.string().url().optional(),
  targetRole: z.enum(["USER", "JOKI", "ALL"]).default("ALL"),
});

// Profil
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z
    .string()
    .regex(/^08\d{8,11}$/, "Format nomor HP tidak valid")
    .optional(),
});

// Game
export const createGameSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan tanda -"),
  description: z.string().max(1000).optional(),
  note: z.string().max(500).optional(),
  pillBg: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  pillColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const createServiceSchema = z
  .object({
    gameId: z.string().cuid(),
    category: z.enum(["BOSS_FIGHT", "ITEM_HUNTING", "GRINDING", "NPC_QUEST"]),
    name: z.string().min(2).max(200),
    detail: z.string().max(500).optional(),
    priceUnit: z.number().positive().optional(),
    priceBundle: z.number().positive().optional(),
    estimateMin: z.number().int().positive().optional(),
    estimateMax: z.number().int().positive().optional(),
    badge: z.enum(["SAVE", "POPULAR", "RARE", "SECRET"]).optional(),
  })
  .refine((d) => d.priceUnit || d.priceBundle, {
    message: "Minimal salah satu harga (satuan atau bundle) harus diisi",
  });
