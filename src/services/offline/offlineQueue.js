// IndexedDB-based Offline Outbox Manager for Fieldchat
// Persists pending messages before attempting delivery and removes them upon server ACK/reconciliation.

const DB_NAME = "fieldchat_db";
const DB_VERSION = 1;
const STORE_OUTBOX = "outbox";

let dbInstance = null;

function getDB() {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.reject(new Error("IndexedDB not supported in this environment"));
  }

  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
        const store = db.createObjectStore(STORE_OUTBOX, { keyPath: "tempId" });
        store.createIndex("conversationId", "conversationId", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      dbInstance.onclose = () => {
        dbInstance = null;
      };
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error("[IndexedDB] Error opening database:", event.target.error);
      reject(event.target.error);
    };
  });
}

const inFlightDeletions = new Set();

/**
 * Persist an optimistic message into IndexedDB before sending.
 */
export async function saveOfflineMessage(msg) {
  const tempId = msg.tempId || msg.id;
  if (!tempId) return null;
  if (inFlightDeletions.has(tempId)) {
    return null;
  }

  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      if (inFlightDeletions.has(tempId)) {
        return resolve(null);
      }

      const tx = db.transaction(STORE_OUTBOX, "readwrite");
      const store = tx.objectStore(STORE_OUTBOX);
      const record = {
        tempId,
        conversationId: String(msg.conversationId),
        text: msg.text || "",
        replyToId: msg.replyToId ? String(msg.replyToId) : null,
        fileUrl: msg.fileUrl || null,
        fileName: msg.fileName || null,
        createdAt: msg.createdAt || new Date().toISOString(),
        status: msg.status || "sending", // 'sending' | 'offline' | 'failed'
        replyToPreview: msg.replyToPreview || null,
        senderInfo: msg.senderInfo || null,
      };

      const req = store.put(record);
      req.onsuccess = () => {
        if (inFlightDeletions.has(tempId)) {
          removeOfflineMessage(tempId);
        }
        resolve(record);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.warn("[IndexedDB] Failed to save offline message:", err);
    return null;
  }
}

/**
 * Remove a message from the offline outbox once confirmed by the server.
 */
export async function removeOfflineMessage(tempId) {
  if (!tempId) return;
  inFlightDeletions.add(tempId);
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_OUTBOX, "readwrite");
      const store = tx.objectStore(STORE_OUTBOX);
      const req = store.delete(tempId);
      req.onsuccess = () => {
        setTimeout(() => inFlightDeletions.delete(tempId), 30000);
        resolve(true);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.warn("[IndexedDB] Failed to remove offline message:", err);
  }
}

/**
 * Update the delivery status of a queued message (e.g. 'offline' or 'sending').
 */
export async function updateOfflineMessageStatus(tempId, status) {
  if (!tempId) return;
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_OUTBOX, "readwrite");
      const store = tx.objectStore(STORE_OUTBOX);
      const getReq = store.get(tempId);

      getReq.onsuccess = () => {
        const item = getReq.result;
        if (!item) return resolve(null);
        item.status = status;
        const putReq = store.put(item);
        putReq.onsuccess = () => resolve(item);
        putReq.onerror = (e) => reject(e.target.error);
      };

      getReq.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.warn("[IndexedDB] Failed to update offline message status:", err);
  }
}

/**
 * Get all pending messages for a specific conversation.
 */
export async function getPendingMessages(conversationId) {
  if (!conversationId) return [];
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_OUTBOX, "readonly");
      const store = tx.objectStore(STORE_OUTBOX);
      const index = store.index("conversationId");
      const req = index.getAll(String(conversationId));

      req.onsuccess = () => {
        const items = req.result || [];
        items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        resolve(items);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.warn("[IndexedDB] Failed to fetch pending messages:", err);
    return [];
  }
}

/**
 * Get all pending messages across all conversations.
 */
export async function getAllPendingMessages() {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_OUTBOX, "readonly");
      const store = tx.objectStore(STORE_OUTBOX);
      const req = store.getAll();

      req.onsuccess = () => {
        const items = req.result || [];
        items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        resolve(items);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.warn("[IndexedDB] Failed to fetch all pending messages:", err);
    return [];
  }
}

/**
 * Clear all outbox messages (e.g. on logout).
 */
export async function clearOutbox() {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_OUTBOX, "readwrite");
      const store = tx.objectStore(STORE_OUTBOX);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.warn("[IndexedDB] Failed to clear outbox:", err);
  }
}

const inFlightSends = new Set();
let isFlushing = false;

/**
 * Flushes the offline message queue by attempting to send all pending messages in FIFO order.
 */
export async function flushOfflineQueue(queryClient) {
  if (isFlushing) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  isFlushing = true;
  try {
    const allPending = await getAllPendingMessages();
    if (!allPending || !allPending.length) return;

    const offlineOnly = allPending.filter((m) => m.status === "offline" && !inFlightSends.has(m.tempId));
    if (!offlineOnly.length) return;

    const { wsClient } = await import("../ws/client");
    const { sendMessage } = await import("../api/messages");

    for (const msg of offlineOnly) {
      if (inFlightSends.has(msg.tempId)) continue;
      inFlightSends.add(msg.tempId);

      try {
        let sent = false;
        if (wsClient.isConnected) {
          sent = wsClient.send({
            event: "message.created",
            conversation_id: String(msg.conversationId),
            content: msg.text || "",
            reply_to_message_id: msg.replyToId ? String(msg.replyToId) : null,
            media_url: msg.fileUrl,
            media_name: msg.fileName,
            client_message_id: msg.tempId,
          });
        }

        if (!sent) {
          // REST API fallback
          const res = await sendMessage({
            conversationId: msg.conversationId,
            text: msg.text,
            replyToId: msg.replyToId,
            fileUrl: msg.fileUrl,
            fileName: msg.fileName,
            clientMessageId: msg.tempId,
          });

          if (res) {
            await removeOfflineMessage(msg.tempId);
            if (queryClient) {
              queryClient.invalidateQueries({ queryKey: ["messages", msg.conversationId] });
              queryClient.invalidateQueries({ queryKey: ["conversations"] });
            }
          }
        } else {
          // Sent via WebSocket, clean up from outbox immediately
          await removeOfflineMessage(msg.tempId);
        }
      } catch (err) {
        console.warn("[OfflineQueue] Error sending queued message:", msg.tempId, err);
        inFlightSends.delete(msg.tempId);
        await updateOfflineMessageStatus(msg.tempId, "offline");
      }
    }
  } catch (e) {
    console.warn("[OfflineQueue] Flush operation error:", e);
  } finally {
    isFlushing = false;
  }
}

