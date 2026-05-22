import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { ok, handleError } from "@/lib/api-response";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const jokiList = await prisma.user.findMany({
      where: { role: "JOKI" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        isBanned: true,
        createdAt: true,
        _count: {
          select: {
            // order yang sedang dikerjakan joki ini
            assignedOrders: {
              where: { status: { notIn: ["DONE", "CANCELLED"] } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(jokiList);
  } catch (error) {
    return handleError(error);
  }
}
