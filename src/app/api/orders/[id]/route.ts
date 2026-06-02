import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus, Role } from "@prisma/client";
import { requireAuth } from "@/lib/auth-helpers";
import {
  ok,
  notFound,
  forbidden,
  badRequest,
  handleError,
} from "@/lib/api-response";
import { updateOrderStatusSchema } from "@/lib/validations";

// State machine — siapa boleh transisi ke status apa
const ALLOWED_TRANSITIONS: Record<
  OrderStatus,
  {
    roles: Role[];
    from: OrderStatus[];
  }
> = {
  CANCELLED: {
    roles: ["USER", "ADMIN"],
    from: ["PENDING", "AWAITING"],
  },
  AWAITING: {
    roles: ["ADMIN"],
    from: ["PENDING"],
  },
  ASSIGNED: {
    roles: ["ADMIN"],
    from: ["AWAITING"],
  },
  IN_PROGRESS: {
    roles: ["ADMIN", "JOKI"],
    from: ["ASSIGNED"],
  },
  COMPLETED: {
    roles: ["JOKI", "ADMIN"],
    from: ["IN_PROGRESS"],
  },
  DONE: {
    roles: ["USER", "ADMIN"],
    from: ["COMPLETED"],
  },
  PENDING: {
    roles: [],
    from: [],
  },
  REFUNDED: {
    roles: ["ADMIN"],
    from: ["CANCELLED"],
  },
};

async function getOrderWithAuth(id: string, userId: string, role: Role) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      joki: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      items: {
        select: {
          id: true,
          serviceName: true,
          gameName: true,
          category: true,
          priceSnapshot: true,
          quantity: true,
        },
      },

      payment: {
        select: {
          status: true,
          amount: true,
          paidAt: true,
        },
      },

      progress: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          joki: {
            select: {
              name: true,
            },
          },
        },
      },

      review: {
        select: {
          rating: true,
          comment: true,
          isVisible: true,
          createdAt: true,
        },
      },

      chatRoom: {
        select: {
          id: true,
          isOpen: true,
        },
      },
    },
  });
  if (!order) return null;

  // Hak akses: user lihat punyanya sendiri, joki lihat yang assigned, admin lihat semua
  const canAccess =
    role === "ADMIN" ||
    order.userId === userId ||
    (role === "JOKI" && order.jokiId === userId);

  return canAccess ? order : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    if (!session.ok) return session.response;
    const { id } = await params;
    const order = await getOrderWithAuth(id, session.userId, session.role);
    if (!order) return notFound();
    return ok(order);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    if (!session.ok) return session.response;
    const { id } = await params;
    const body = await req.json();
    const parsed = updateOrderStatusSchema.safeParse(body);
    if (!parsed.success)
      return badRequest("Validasi gagal", parsed.error.flatten());

    const { status: newStatus, note } = parsed.data;
    const order = await getOrderWithAuth(id, session.userId, session.role);
    if (!order) return notFound();

    const rule = ALLOWED_TRANSITIONS[newStatus];
    if (!rule) return badRequest("Status tidak valid");
    if (!rule.roles.includes(session.role)) return forbidden();
    if (!rule.from.includes(order.status)) {
      return badRequest(
        `Tidak bisa ubah status dari ${order.status} ke ${newStatus}`,
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const statusData: {
        startedAt?: Date;
        completedAt?: Date;
        doneAt?: Date;
      } = {};

      if (newStatus === "IN_PROGRESS" && !order.startedAt) {
        statusData.startedAt = new Date();
      }

      if (newStatus === "COMPLETED" && !order.completedAt) {
        statusData.completedAt = new Date();
      }

      if (newStatus === "DONE" && !order.doneAt) {
        statusData.doneAt = new Date();
      }

      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: newStatus,
          ...statusData,
        },
      });

      // Notifikasi otomatis per transisi status
      const notifMap: Partial<Record<OrderStatus, string>> = {
        ASSIGNED: "Joki sudah ditugaskan untuk ordermu",
        IN_PROGRESS: "Joki sedang mengerjakan ordermu",
        COMPLETED: "Order selesai! Silakan konfirmasi.",
        DONE: "Order sudah dikonfirmasi. Terima kasih!",
        CANCELLED: "Order kamu telah dibatalkan.",
      };

      if (notifMap[newStatus]) {
        await tx.notification.create({
          data: {
            userId: order.userId,
            orderId: order.id,
            type:
              newStatus === "ASSIGNED"
                ? "ORDER_ASSIGNED"
                : newStatus === "IN_PROGRESS"
                  ? "ORDER_PROGRESS"
                  : newStatus === "COMPLETED"
                    ? "ORDER_COMPLETED"
                    : newStatus === "CANCELLED"
                      ? "ORDER_CANCELLED"
                      : "ORDER_PROGRESS",
            title: notifMap[newStatus],
            body: note ?? notifMap[newStatus],
          },
        });
      }

      return updatedOrder;
    });

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}
