import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { ok, badRequest, handleError } from "@/lib/api-response";

import { validateVoucherSchema } from "@/lib/validations";
import { applyVoucher } from "@/lib/order-helpers";

export async function POST(req: NextRequest) {
  try {
    // Auth
    const session = await requireAuth();

    if (!session.ok) {
      return session.response;
    }

    // Body
    const body = await req.json();

    const parsed = validateVoucherSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Validasi gagal", parsed.error.flatten());
    }

    const { code, subtotal } = parsed.data;

    // Guard subtotal
    if (subtotal <= 0) {
      return badRequest("Subtotal harus lebih besar dari 0");
    }

    try {
      const { voucher, discountAmount } = await applyVoucher(
        code,
        subtotal,
        session.userId,
      );

      return ok({
        valid: true,
        code: voucher.code,
        type: voucher.type,
        discountAmount,
        finalAmount: subtotal - discountAmount,
      });
    } catch (error) {
      return badRequest(
        error instanceof Error ? error.message : "Voucher tidak valid",
      );
    }
  } catch (error) {
    return handleError(error);
  }
}
