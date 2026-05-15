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
  status: z.enum(["CANCELLED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "DONE"]),
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
  payment_type: z.string().optional(),
});

// Admin
export const assignJokiSchema = z.object({
  jokiId: z.string().cuid(),
});

// Voucher
export const validateVoucherSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().positive(),
});
