import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import {
  ok,
  created,
  forbidden,
  notFound,
  badRequest,
  handleError,
} from "@/lib/api-response";

const sendMessageSchema = z.object({
  body: z.string().min(1).max(2000),
  imageUrl: z.string().url().optional(),
});

async function getRoomWithAccess(roomId: string, userId: string) {
  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    include: { members: true },
  });

  if (!room) return null;

  const isMember = room.members.some((m) => m.userId === userId);

  return isMember ? room : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } },
) {
  try {
    const session = await requireAuth();

    if (!session.ok) {
      return session.response;
    }

    const room = await getRoomWithAccess(params.roomId, session.userId);

    if (!room) return notFound();

    const cursor = req.nextUrl.searchParams.get("cursor");

    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "30");

    const messages = await prisma.chatMessage.findMany({
      where: {
        roomId: params.roomId,
      },

      orderBy: {
        createdAt: "desc",
      },

      take: limit,

      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
    });

    // update last read
    await prisma.chatRoomMember.update({
      where: {
        roomId_userId: {
          roomId: params.roomId,
          userId: session.userId,
        },
      },

      data: {
        lastReadAt: new Date(),
      },
    });

    return ok({
      messages: messages.reverse(),
      nextCursor: messages.length === limit ? messages[0]?.id : null,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } },
) {
  try {
    const session = await requireAuth();

    if (!session.ok) {
      return session.response;
    }

    const room = await getRoomWithAccess(params.roomId, session.userId);

    if (!room) return notFound();

    if (!room.isOpen) {
      return forbidden();
    }

    const body = await req.json();

    const parsed = sendMessageSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Validasi gagal", parsed.error.flatten());
    }

    const senderTypeMap = {
      USER: "USER",
      ADMIN: "ADMIN",
      JOKI: "JOKI",
    } as const;

    const senderType = senderTypeMap[session.role] ?? "USER";

    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.chatMessage.create({
        data: {
          roomId: params.roomId,
          senderId: session.userId,
          senderType,
          body: parsed.data.body,
          imageUrl: parsed.data.imageUrl ?? null,
        },
      });

      // bump updatedAt room
      await tx.chatRoom.update({
        where: {
          id: params.roomId,
        },

        data: {
          updatedAt: new Date(),
        },
      });

      return msg;
    });

    return created(message);
  } catch (error) {
    return handleError(error);
  }
}
