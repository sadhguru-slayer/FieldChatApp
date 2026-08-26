import { wsClient } from "./client";

export const MessageEvent = {
  MESSAGE_CREATED: "message.created",
  MESSAGE_EDITED: "message.edited",
  MESSAGE_DELETED_FOR_EVERYONE: "message.deleted_for_everyone",
  MESSAGE_DELETED_FOR_ME: "message.deleted_for_me",
  MESSAGE_DELIVERED: "message.delivered",
  MESSAGE_READ: "message.read",
  MESSAGE_REACTION_ADDED: "message.reaction_added",
  MESSAGE_REACTION_REMOVED: "message.reaction_removed",
  TYPING: "typing",
  CONVERSATION_JOINED: "conversation.joined",
  CONVERSATION_LEFT: "conversation.left",
};

/**
 * Join a conversation channel to receive real-time updates and presence
 */
export function joinConversation(conversationId) {
  if (!conversationId) return false;
  return wsClient.send({
    event: MessageEvent.CONVERSATION_JOINED,
    conversation_id: String(conversationId),
  });
}

/**
 * Leave a conversation channel
 */
export function leaveConversation(conversationId) {
  if (!conversationId) return false;
  return wsClient.send({
    event: MessageEvent.CONVERSATION_LEFT,
    conversation_id: String(conversationId),
  });
}

/**
 * Broadcast typing indicator for a conversation
 */
export function sendTyping(conversationId) {
  if (!conversationId) return false;
  return wsClient.send({
    event: MessageEvent.TYPING,
    conversation_id: String(conversationId),
  });
}

/**
 * Create a new message via WebSocket
 */
export function createMessage(conversationId, content, replyToMessageId = null) {
  if (!conversationId || !content) return false;
  return wsClient.send({
    event: MessageEvent.MESSAGE_CREATED,
    conversation_id: String(conversationId),
    content: content,
    reply_to_message_id: replyToMessageId ? String(replyToMessageId) : null,
  });
}

/**
 * Edit an existing message
 */
export function editMessage(conversationId, messageId, content) {
  if (!conversationId || !messageId || !content) return false;
  return wsClient.send({
    event: MessageEvent.MESSAGE_EDITED,
    conversation_id: String(conversationId),
    message_id: String(messageId),
    content: content,
  });
}

/**
 * Delete a message for everyone
 */
export function deleteMessageForEveryone(conversationId, messageId) {
  if (!conversationId || !messageId) return false;
  return wsClient.send({
    event: MessageEvent.MESSAGE_DELETED_FOR_EVERYONE,
    conversation_id: String(conversationId),
    message_id: String(messageId),
  });
}

/**
 * Delete a message for me
 */
export function deleteMessageForMe(conversationId, messageId) {
  if (!conversationId || !messageId) return false;
  return wsClient.send({
    event: MessageEvent.MESSAGE_DELETED_FOR_ME,
    conversation_id: String(conversationId),
    message_id: String(messageId),
  });
}

/**
 * Add a reaction emoji to a message
 */
export function addReaction(conversationId, messageId, reaction) {
  if (!conversationId || !messageId || !reaction) return false;
  return wsClient.send({
    event: MessageEvent.MESSAGE_REACTION_ADDED,
    conversation_id: String(conversationId),
    message_id: String(messageId),
    content: reaction,
  });
}

/**
 * Remove a reaction from a message
 */
export function removeReaction(conversationId, messageId) {
  if (!conversationId || !messageId) return false;
  return wsClient.send({
    event: MessageEvent.MESSAGE_REACTION_REMOVED,
    conversation_id: String(conversationId),
    message_id: String(messageId),
  });
}

/**
 * Mark a message as delivered
 */
export function markDelivered(conversationId, messageId) {
  if (!conversationId || !messageId) return false;
  return wsClient.send({
    event: MessageEvent.MESSAGE_DELIVERED,
    conversation_id: String(conversationId),
    message_id: String(messageId),
  });
}

/**
 * Mark a message as read
 */
export function markRead(conversationId, messageId) {
  if (!conversationId || !messageId) return false;
  return wsClient.send({
    event: MessageEvent.MESSAGE_READ,
    conversation_id: String(conversationId),
    message_id: String(messageId),
  });
}
