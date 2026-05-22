import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { ok, badRequest, handleError } from "@/lib/api-response";

const moderateReviewSchema = z.object({
  isVisible: z.boolean().optional(),
  reply: z.string().max(1000).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const parsed = moderateReviewSchema.safeParse(body);
    if (!parsed.success)
      return badRequest("Validasi gagal", parsed.error.flatten());

    const review = await prisma.review.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return ok(review);
  } catch (error) {
    return handleError(error);
  }
}
