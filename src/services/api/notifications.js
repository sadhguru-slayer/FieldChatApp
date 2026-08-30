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

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Helper to hash string for key verification
async function hashString(value) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function subscribeToWebPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn("Push messaging is not supported");
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn("Notification permission not granted");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.error("VITE_VAPID_PUBLIC_KEY is not defined in frontend .env");
      return;
    }

    const applicationServerKey = urlB64ToUint8Array(vapidKey);
    const keyHash = await hashString(vapidKey);
    console.log("Frontend VAPID public key hash:", keyHash);

    let subscription = await registration.pushManager.getSubscription();

    if (subscription && subscription.options && subscription.options.applicationServerKey) {
      const existingKeyBytes = new Uint8Array(subscription.options.applicationServerKey);
      let keyMismatch = false;
      if (existingKeyBytes.length !== applicationServerKey.length) {
        keyMismatch = true;
      } else {
        for (let i = 0; i < existingKeyBytes.length; i++) {
          if (existingKeyBytes[i] !== applicationServerKey[i]) {
            keyMismatch = true;
            break;
          }
        }
      }

      if (keyMismatch) {
        console.warn("VAPID public key mismatch detected. Unsubscribing old browser subscription...");
        await subscription.unsubscribe();
        subscription = null;
      }
    }

    if (!subscription) {
      console.log("No existing subscription or key rotated. Subscribing with applicationServerKey...");
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });
    }

    const subJson = subscription.toJSON();
    console.log("Push endpoint:", subJson.endpoint);
    console.log("p256dh length:", subJson.keys?.p256dh?.length);
    console.log("auth length:", subJson.keys?.auth?.length);

    await request("/api/notifications/subscribe", {
      method: "POST",
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth
        }
      })
    });
    console.log("Successfully synced Web Push subscription with backend");
  } catch (err) {
    console.error("Failed to subscribe to Web Push:", err);
  }
}
