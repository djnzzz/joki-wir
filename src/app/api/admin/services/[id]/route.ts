import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { ok, badRequest, handleError, noContent } from "@/lib/api-response";
import { createServiceSchema } from "@/lib/validations";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const body = await req.json();
    const parsed = createServiceSchema.partial().safeParse(body);
    if (!parsed.success)
      return badRequest("Validasi gagal", parsed.error.flatten());

    const service = await prisma.service.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return ok(service);
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
    // Soft delete
    await prisma.service.update({
      where: { id: params.id },
      data: { isActive: false },
    });
    return noContent();
  } catch (error) {
    return handleError(error);
  }
}
