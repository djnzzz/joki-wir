import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { ok, notFound, badRequest, handleError } from "@/lib/api-response";
import { updateContentSchema } from "@/lib/validations";

const VALID_KEYS = ["faq", "about", "terms", "privacy", "refund"];

export async function GET(
  req: NextRequest,
  { params }: { params: { key: string } },
) {
  try {
    // Content publik — tidak perlu auth untuk GET
    if (!VALID_KEYS.includes(params.key)) return notFound();
    const content = await prisma.content.findUnique({
      where: { key: params.key },
    });
    if (!content) return notFound();
    return ok(content);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { key: string } },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    if (!VALID_KEYS.includes(params.key)) return badRequest("Key tidak valid");

    const body = await req.json();
    const parsed = updateContentSchema.safeParse(body);
    if (!parsed.success)
      return badRequest("Validasi gagal", parsed.error.flatten());

    const content = await prisma.content.upsert({
      where: { key: params.key },
      create: {
        key: params.key,
        title: parsed.data.title ?? params.key,
        body: parsed.data.body ?? "",
      },
      update: parsed.data,
    });
    return ok(content);
  } catch (error) {
    return handleError(error);
  }
}
