"use client";
import { useEffect, useRef } from "react";
import { supabaseClient } from "@/lib/supabase-client";

type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

export function useNotificationsRealtime(
  userId: string | null,
  onNewNotification: (notif: Notification) => void,
) {
  const channelRef = useRef<ReturnType<typeof supabaseClient.channel> | null>(
    null,
  );

  useEffect(() => {
    if (!userId) return;

    channelRef.current?.unsubscribe();

    const channel = supabaseClient
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onNewNotification(payload.new as Notification);
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [userId, onNewNotification]);
}
