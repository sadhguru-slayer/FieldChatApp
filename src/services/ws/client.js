// Fieldchat WebSocket Client Service

const getWsUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.BACKEND_API_URL;
  let baseUrl = "";
  if (envUrl) {
    baseUrl = envUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
    if (!/^https?:\/\//i.test(baseUrl) && !/^wss?:\/\//i.test(baseUrl)) {
      baseUrl = "http://" + baseUrl;
    }
  } else if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "https:" : "http:";
    baseUrl = `${protocol}//${window.location.hostname}:8000`;
  } else {
    baseUrl = "http://localhost:8000";
  }
  if (/^https/i.test(baseUrl)) {
    return baseUrl.replace(/^https/i, "wss");
  }
  return baseUrl.replace(/^http/i, "ws");
};

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.listeners = new Map(); // event -> Set of callbacks
    this.reconnectTimer = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.pendingQueue = [];
  }

  connect() {
    const token = localStorage.getItem("access_token");
    if (!token) {
      console.warn("[WS] Cannot connect: missing access_token in localStorage");
      return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    const wsBaseUrl = getWsUrl();
    const url = `${wsBaseUrl}/ws?token=${encodeURIComponent(token)}`;
    console.log("[WS] Connecting to", url);

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log("[WS] Connection established");
      this.isConnected = true;
      this.isConnecting = false;
      this.emit("open");

      // Flush outgoing message queue automatically on connect
      while (this.pendingQueue.length > 0) {
        const queued = this.pendingQueue.shift();
        try {
          this.ws.send(JSON.stringify(queued));
        } catch (err) {
          console.error("[WS] Error sending queued message:", err);
        }
      }
    };

async function triggerWebPushNotification(notif) {
  if (typeof window === "undefined" || !("Notification" in window) || !notif) return;

  try {
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }

    if (Notification.permission === "granted") {
      const title = notif.title || "Fieldchat Notification";
      const options = {
        body: notif.body || "",
        icon: notif.data?.avatar || "/Logo.png",
        badge: "/Logo.png",
        tag: notif.id || `notif-${Date.now()}`,
        data: {
          conversation_id: notif.data?.conversation_id,
          action: notif.data?.action,
        },
        vibrate: [100, 50, 100],
      };

      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification(title, options);
          return;
        }
      }
      new Notification(title, options);
    }
  } catch (e) {
    console.warn("[WebPush] Failed to trigger notification:", e);
  }
}

    this.ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === "notification") {
          console.log("[WS] Received message:", payload);
          if (payload.notification) {
            triggerWebPushNotification(payload.notification);
          }
        }
        if (payload.event) {
          this.emit(payload.event, payload);
        }
        this.emit("*", payload);
      } catch (err) {
        console.error("[WS] Error parsing message:", err);
      }
    };

    this.ws.onerror = (error) => {
      console.error("[WS] Error:", error);
      this.emit("error", error);
    };

    this.ws.onclose = (e) => {
      console.log("[WS] Connection closed:", e.code, e.reason);
      this.isConnected = false;
      this.isConnecting = false;
      this.emit("close", e);

      // Auto-reconnect after 3 seconds if not closed cleanly
      if (e.code !== 1000 && e.code !== 1008) {
        this.scheduleReconnect();
      }
    };
  }

  scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      console.log("[WS] Attempting to reconnect...");
      this.connect();
    }, 3000);
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close(1000, "User logged out");
      this.ws = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.pendingQueue = [];
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    } else {
      // Queue outgoing message/receipt so it is sent as soon as socket connects
      this.pendingQueue.push(data);
      if (!this.isConnected && !this.isConnecting) {
        this.connect();
      }
      return false;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`[WS] Error in event listener '${event}':`, err);
        }
      });
    }
  }
}

export const wsClient = new WebSocketClient();
