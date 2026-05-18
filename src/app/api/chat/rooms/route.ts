import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { ok, handleError } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await requireAuth();
    if (!session.ok) {
      return session.response;
    }

    // User hanya lihat room yang jadi member-nya
    const rooms = await prisma.chatRoom.findMany({
      where: {
        members: { some: { userId: session.userId } },
        isOpen: true,
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            status: true,
            items: {
              take: 1,
              select: { gameName: true, serviceName: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // preview pesan terakhir
        },
        members: {
          include: {
            user: { select: { id: true, name: true, role: true } },
          },
        },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return ok(rooms);
  } catch (error) {
    return handleError(error);
  }
}
