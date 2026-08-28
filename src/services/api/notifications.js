import { request } from "./request";

export async function getNotifications({ unreadOnly = false, limit = 50, skip = 0 } = {}) {
  const params = new URLSearchParams({
    unread_only: String(unreadOnly),
    limit: String(limit),
    skip: String(skip),
  });
  return request(`/api/notifications?${params.toString()}`);
}

export async function getUnreadNotificationCount() {
  return request("/api/notifications/unread-count");
}

export async function markNotificationAsRead(notificationId) {
  return request(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsAsRead() {
  return request("/api/notifications/read-all", {
    method: "POST",
  });
}
