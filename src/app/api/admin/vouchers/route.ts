import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { ok, created, badRequest, handleError } from "@/lib/api-response";
import { createVoucherSchema } from "@/lib/validations";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const vouchers = await prisma.voucher.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { usages: true } } },
    });
    return ok(vouchers);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const body = await req.json();
    const parsed = createVoucherSchema.safeParse(body);
    if (!parsed.success)
      return badRequest("Validasi gagal", parsed.error.flatten());

    const voucher = await prisma.voucher.create({
      data: {
        ...parsed.data,
        code: parsed.data.code.toUpperCase(),
        startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : null,
        expiredAt: parsed.data.expiredAt
          ? new Date(parsed.data.expiredAt)
          : null,
      },
    });
    return created(voucher);
  } catch (error) {
    return handleError(error); // handle unique constraint kode duplikat
  }
}
