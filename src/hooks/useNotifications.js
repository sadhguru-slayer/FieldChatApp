import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/services/api";
import { useAppStore } from "@/store/useAppStore";

export function useNotifications() {
  const queryClient = useQueryClient();
  const setActiveId = useAppStore((s) => s.setActiveId);
  const setActiveScreen = useAppStore((s) => s.setActiveScreen);
  const setMobileView = useAppStore((s) => s.setMobileView);

  // Fetch list of notifications
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications({ limit: 50 }),
    staleTime: 10000,
  });

  // Fetch unread notification count
  const unreadCountQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: getUnreadNotificationCount,
    staleTime: 10000,
    select: (data) => data?.unread_count ?? 0,
  });

  // Mutation to mark a single notification as read
  const markReadMutation = useMutation({
    mutationFn: (id) => markNotificationAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      // Optimistically update notifications list
      queryClient.setQueryData(["notifications"], (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((n) => (n.id === id ? { ...n, is_read: true } : n));
      });

      // Optimistically update unread count
      queryClient.setQueryData(["notifications", "unread-count"], (old) => {
        if (!old) return old;
        const currentCount = old.unread_count ?? 0;
        return { unread_count: Math.max(0, currentCount - 1) };
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  // Mutation to mark all notifications as read
  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      queryClient.setQueryData(["notifications"], (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((n) => ({ ...n, is_read: true }));
      });

      queryClient.setQueryData(["notifications", "unread-count"], () => ({
        unread_count: 0,
      }));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  // Handle clicking a notification (navigation + mark read)
  const handleNotificationClick = (notification) => {
    if (!notification) return;

    // Mark as read if not already read
    if (!notification.is_read) {
      markReadMutation.mutate(notification.id);
    }

    // Check target conversation ID in notification data
    const convId = notification.data?.conversation_id;
    if (convId) {
      setActiveId(convId);
      setActiveScreen("chat");
      setMobileView("chat");
    }
  };

  return {
    notifications: notificationsQuery.data || [],
    isLoading: notificationsQuery.isLoading,
    isError: notificationsQuery.isError,
    unreadCount: unreadCountQuery.data ?? 0,
    markAsRead: (id) => markReadMutation.mutate(id),
    markAllAsRead: () => markAllReadMutation.mutate(),
    handleNotificationClick,
  };
}
