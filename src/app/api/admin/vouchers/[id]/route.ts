import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { ok, badRequest, handleError, noContent } from "@/lib/api-response";
import { createVoucherSchema } from "@/lib/validations";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const body = await req.json();
    const parsed = createVoucherSchema.partial().safeParse(body);
    if (!parsed.success)
      return badRequest("Validasi gagal", parsed.error.flatten());

    const voucher = await prisma.voucher.update({
      where: { id: params.id },
      data: {
        ...parsed.data,
        ...(parsed.data.startAt
          ? { startAt: new Date(parsed.data.startAt) }
          : {}),
        ...(parsed.data.expiredAt
          ? { expiredAt: new Date(parsed.data.expiredAt) }
          : {}),
      },
    });
    return ok(voucher);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    // Hard delete voucher — aman karena VoucherUsage menyimpan histori
    await prisma.voucher.delete({ where: { id: params.id } });
    return noContent();
  } catch (error) {
    return handleError(error);
  }
}
