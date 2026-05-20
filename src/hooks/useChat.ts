"use client";
import { useEffect, useRef } from "react";
import { supabaseClient } from "@/lib/supabase-client";

type ChatMessage = {
  id: string;
  roomId: string;
  senderId: string;
  senderType: string;
  body: string;
  imageUrl: string | null;
  createdAt: string;
};

export function useChatRealtime(
  roomId: string | null,
  onNewMessage: (msg: ChatMessage) => void,
) {
  const channelRef = useRef<ReturnType<typeof supabaseClient.channel> | null>(
    null,
  );

  useEffect(() => {
    if (!roomId) return;

    // Unsubscribe channel lama sebelum buat baru
    channelRef.current?.unsubscribe();

    const channel = supabaseClient
      .channel(`chat-room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          onNewMessage(payload.new as ChatMessage);
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, onNewMessage]);
}
