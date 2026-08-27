// Fieldchat WebSocket Client Service

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000";

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.listeners = new Map(); // event -> Set of callbacks
    this.reconnectTimer = null;
    this.isConnected = false;
    this.isConnecting = false;
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
    const url = `${WS_URL}/ws?token=${encodeURIComponent(token)}`;
    console.log("[WS] Connecting to", WS_URL);

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log("[WS] Connection established");
      this.isConnected = true;
      this.isConnecting = false;
      this.emit("open");
    };

    this.ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if(payload.event === "presence"){
          console.log("[WS] Received message:", payload);
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
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    } else {
      console.warn("[WS] Cannot send message: WebSocket is not open", data);
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
