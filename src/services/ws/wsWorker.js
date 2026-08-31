// Fieldchat SharedWorker WebSocket Multiplexer
// This worker keeps a single WebSocket connection open and shares it across all active tabs.

const ports = new Set();
let ws = null;
let reconnectTimer = null;
let currentToken = null;
let currentWsUrl = null;
let isConnecting = false;
let isConnected = false;

// Heartbeat tracking to clean up closed tabs
const portLastHeartbeat = new Map();

// Check for dead ports every 10 seconds
setInterval(() => {
  const now = Date.now();
  for (const port of ports) {
    const last = portLastHeartbeat.get(port) || 0;
    if (now - last > 15000) {
      console.log("[Worker] Port timed out (heartbeat lost), removing port.");
      ports.delete(port);
      portLastHeartbeat.delete(port);
      
      if (ports.size === 0) {
        console.log("[Worker] No active ports remaining, closing connection.");
        disconnectWS();
      }
    }
  }
}, 10000);

self.onconnect = function(e) {
  const port = e.ports[0];
  ports.add(port);
  portLastHeartbeat.set(port, Date.now());

  console.log(`[Worker] Tab connected. Active tabs count: ${ports.size}`);

  port.onmessage = function(event) {
    const data = event.data;
    if (!data) return;

    // Refresh heartbeat on any message
    portLastHeartbeat.set(port, Date.now());
    if (!ports.has(port)) {
      console.log("[Worker] Port was previously removed (timed out), re-adding port to active set.");
      ports.add(port);
    }

    switch (data.type) {
      case "CONNECT":
        currentToken = data.token;
        currentWsUrl = data.wsUrl;
        connectWS();
        break;

      case "SEND":
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(data.payload));
        } else {
          console.warn("[Worker] WebSocket not open. Cannot send payload.");
        }
        break;

      case "DISCONNECT":
        console.log("[Worker] Explicit disconnect requested.");
        disconnectWS();
        break;

      case "PORT_CLOSE":
        console.log("[Worker] Tab explicit close received.");
        ports.delete(port);
        portLastHeartbeat.delete(port);
        if (ports.size === 0) {
          console.log("[Worker] No active ports remaining, closing connection.");
          disconnectWS();
        }
        break;

      case "HEARTBEAT":
        port.postMessage({ type: "HEARTBEAT_ACK" });
        break;
    }
  };
};

function connectWS() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    // If connection is already open, notify this newly connected tab immediately
    if (ws.readyState === WebSocket.OPEN) {
      broadcast({ type: "OPEN" });
    }
    return;
  }

  if (reconnectTimer) clearTimeout(reconnectTimer);
  isConnecting = true;

  const url = `${currentWsUrl}/ws?token=${encodeURIComponent(currentToken)}`;
  console.log("[Worker] Connecting to WebSocket url:", currentWsUrl);

  try {
    ws = new WebSocket(url);
  } catch (error) {
    console.error("[Worker] WebSocket creation error:", error);
    broadcast({ type: "ERROR", error: error.message });
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    console.log("[Worker] WebSocket connection established.");
    isConnected = true;
    isConnecting = false;
    broadcast({ type: "OPEN" });
  };

  ws.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      broadcast({ type: "MESSAGE", payload });
    } catch (err) {
      console.error("[Worker] Error parsing websocket message:", err);
    }
  };

  ws.onerror = (error) => {
    console.error("[Worker] WebSocket error:", error);
    broadcast({ type: "ERROR", error: "WebSocket error" });
  };

  ws.onclose = (event) => {
    console.log("[Worker] WebSocket connection closed:", event.code, event.reason);
    isConnected = false;
    isConnecting = false;
    broadcast({ type: "CLOSE", code: event.code, reason: event.reason });

    // Auto-reconnect on non-clean closes if there are active tabs
    if (event.code !== 1000 && ports.size > 0) {
      scheduleReconnect();
    }
  };
}

function disconnectWS() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (ws) {
    ws.close(1000, "Worker requested disconnect");
    ws = null;
  }
  isConnected = false;
  isConnecting = false;
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (ports.size === 0) return;

  reconnectTimer = setTimeout(() => {
    console.log("[Worker] Attempting to reconnect...");
    connectWS();
  }, 3000);
}

function broadcast(msg) {
  for (const port of ports) {
    try {
      port.postMessage(msg);
    } catch (e) {
      console.error("[Worker] Broadcast failed, removing port:", e);
      ports.delete(port);
      portLastHeartbeat.delete(port);
    }
  }
}
