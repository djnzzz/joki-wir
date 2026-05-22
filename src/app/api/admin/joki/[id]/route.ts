import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { ok, notFound, badRequest, handleError } from "@/lib/api-response";

const updateJokiSchema = z.object({
  isActive: z.boolean().optional(),
  isBanned: z.boolean().optional(),
  name: z.string().min(2).max(100).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const joki = await prisma.user.findUnique({
      where: { id: params.id, role: "JOKI" },
      include: {
        assignedOrders: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            finalAmount: true,
            createdAt: true,
          },
        },
      },
    });
    if (!joki) return notFound();
    return ok(joki);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const parsed = updateJokiSchema.safeParse(body);
    if (!parsed.success)
      return badRequest("Validasi gagal", parsed.error.flatten());

    const joki = await prisma.user.update({
      where: { id: params.id, role: "JOKI" },
      data: parsed.data,
    });
    return ok(joki);
  } catch (error) {
    return handleError(error);
  }
}
