import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { ok, handleError } from "@/lib/api-response";

// GET semua content pages
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const contents = await prisma.content.findMany({ orderBy: { key: "asc" } });
    return ok(contents);
  } catch (error) {
    return handleError(error);
  }
}
