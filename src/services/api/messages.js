import { request } from "./request";

// ─── Normalizer ───────────────────────────────────────────────────────────────
//
// Backend returns: Array<{ event: MessageEvent, data: {...} }>
// event values: "message.created" | "message.edited"
//               "message.deleted_for_me" | "message.deleted_for_everyone"
//
// We strip deleted-for-me events (backend already excludes their content) and
// flatten the rest into a clean message array for the UI.
function normalizeEvents(events) {
  const messages = [];

  for (const evt of events) {
    const { event, data } = evt;

    if (event === "message.deleted_for_me") {
      continue;
    }

    const isDeletedForEveryone =
      event === "message.deleted_for_everyone";

    const isSystem = data.type === "SYSTEM";

    messages.push({
      id: data.message_id,

      senderId:
        data.sender_id === "SYSTEM" || isSystem
          ? null
          : data.sender_id,

      senderName:
        data.display_name === "SYSTEM" || isSystem
          ? null
          : data.display_name || data.username,

      senderAvatar: isSystem ? null : (data.avatar_url || null),

      text: isDeletedForEveryone ? "" : data.message || "",

      createdAt: data.timestamp,
      editedAt: data.edited_at || null,
      edited: !!data.edited_at,

      type: data.type || "CHAT", // "CHAT" | "SYSTEM"

      isMine: data.is_mine ?? false,
      delivered: data.delivered ?? null,
      read: data.read ?? null,

      deletedForEveryone: isDeletedForEveryone,

      mediaUrl: data.media_url || null,
      mediaName: data.media_name || null,

      replyTo: data.reply_to
        ? {
            id: data.reply_to.message_id,

            senderId:
              data.reply_to.sender_id === "SYSTEM"
                ? null
                : data.reply_to.sender_id,

            senderName:
              data.reply_to.display_name === "SYSTEM"
                ? null
                : data.reply_to.display_name ||
                  data.reply_to.username,

            text: data.reply_to.message,

            isDeleted: data.reply_to.is_deleted ?? false,
          }
        : null,

      reactions: (data.reactions || []).map((r) => ({
        emoji: r.reaction,
        count: r.count,
        reactedByMe: r.reacted_by_me,
      })),
    });
  }

  return messages;
}


// ─── Endpoints ────────────────────────────────────────────────────────────────

/** GET /api/messages/get-messages?conversation_id= */
export const getMessages = async ({ conversationId, pageParam = null }) => {
  let url = `/api/messages/get-messages?conversation_id=${conversationId}`;
  if (pageParam) {
    url += `&cursor=${encodeURIComponent(pageParam)}`;
  }
  const events = await request(url);
  const items = normalizeEvents(events);
  
  const hasMore = items.length === 50;
  const nextCursor = items.length > 0 ? items[items.length - 1].createdAt : null;

  return { items, hasMore, nextCursor };
};

/** POST /api/messages/create-message */
export const sendMessage = async ({ conversationId, text, replyToId = null, fileUrl = null, fileName = null }) => {
  const params = new URLSearchParams({
    conversation_id: conversationId,
    content: text || "",
  });
  if (replyToId) params.set("reply_to_message_id", replyToId);
  if (fileUrl) params.set("media_url", fileUrl);
  if (fileName) params.set("media_name", fileName);
  return request(`/api/messages/create-message?${params}`, { method: "POST" });
};

/** PATCH /api/messages/edit-message */
export const editMessage = async ({ conversationId, messageId, text }) => {
  const params = new URLSearchParams({
    conversation_id: conversationId,
    message_id: messageId,
    content: text,
  });
  return request(`/api/messages/edit-message?${params}`, { method: "PATCH" });
};

/** DELETE /api/messages/delete-for-everyone */
export const deleteMessageForEveryone = async ({ conversationId, messageId }) => {
  const params = new URLSearchParams({
    conversation_id: conversationId,
    message_id: messageId,
  });
  return request(`/api/messages/delete-for-everyone?${params}`, {
    method: "DELETE",
  });
};

/** DELETE /api/messages/delete-for-me */
export const deleteMessageForMe = async ({ conversationId, messageId }) => {
  const params = new URLSearchParams({
    conversation_id: conversationId,
    message_id: messageId,
  });
  return request(`/api/messages/delete-for-me?${params}`, { method: "DELETE" });
};

/** POST /api/messages/react-to-message */
export const reactToMessage = async ({ conversationId, messageId, reaction }) => {
  const params = new URLSearchParams({
    conversation_id: conversationId,
    message_id: messageId,
    reaction,
  });
  return request(`/api/messages/react-to-message?${params}`, { method: "POST" });
};

/** DELETE /api/messages/remove-reaction */
export const removeReaction = async ({ conversationId, messageId }) => {
  const params = new URLSearchParams({
    conversation_id: conversationId,
    message_id: messageId,
  });
  return request(`/api/messages/remove-reaction?${params}`, { method: "DELETE" });
};

/** DELETE /api/messages/clear-chat */
export const clearChat = async (conversationId) => {
  return request(`/api/messages/clear-chat?conversation_id=${conversationId}`, {
    method: "DELETE",
  });
};

/** POST /api/messages/conversations/{conversationId}/read-all */
export const markAllAsRead = async (conversationId) => {
  return request(`/api/messages/conversations/${conversationId}/read-all`, {
    method: "POST",
  });
};

/** POST /api/messages/bulk-forward */
export const bulkForwardMessages = async ({ messageIds, targetConversationIds }) => {
  return request("/api/messages/bulk-forward", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message_ids: messageIds,
      target_conversation_ids: targetConversationIds,
    }),
  });
};

/** POST /api/messages/bulk-delete */
export const bulkDeleteMessages = async ({ messageIds, conversationId, deleteType }) => {
  return request("/api/messages/bulk-delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message_ids: messageIds,
      conversation_id: conversationId,
      delete_type: deleteType,
    }),
  });
};

