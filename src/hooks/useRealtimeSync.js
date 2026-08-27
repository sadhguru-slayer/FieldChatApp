import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { wsClient } from "@/services/ws";

export function useRealtimeSync(authed) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authed) {
      wsClient.disconnect();
      return;
    }

    wsClient.connect();

    // Handle incoming real-time events from backend
    const unsub = wsClient.on("*", (payload) => {
      if (!payload || !payload.event) return;

      if (payload.event === "presence" && payload.user_id !== undefined) {
        useAppStore.getState().setPresence(
          payload.user_id,
          payload.online,
          payload.last_seen ?? null,
        );
      }

      if (payload.event === "typing" && payload.conversation_id && payload.sender_id) {
        useAppStore.getState().setTypingUser(
          String(payload.conversation_id),
          String(payload.sender_id),
          payload.username || "Someone"
        );
      }

      // Update conversations and messages list in-memory on message events
      if (payload.event.startsWith("message.")) {
        const convId = String(payload.conversation_id);
        const activeId = useAppStore.getState().activeId;
        const me = queryClient.getQueryData(["me"]);
        const meId = me?.id;

        // 1. Update conversations list
        queryClient.setQueryData(["conversations"], (old) => {
          if (!Array.isArray(old)) return old;

          const nextList = old.map((conv) => {
            if (String(conv.id) !== convId) return conv;

            let lastMessage = conv.lastMessage;
            let unread = conv.unread || 0;

            if (payload.event === "message.created") {
              lastMessage = {
                text: payload.message || "",
                senderName: payload.username,
                deletedForEveryone: false,
                createdAt: payload.timestamp,
              };
              if (payload.sender_id !== meId && String(activeId) !== convId) {
                unread += 1;
              }
            } else if (payload.event === "message.deleted_for_everyone") {
              if (lastMessage) {
                lastMessage = {
                  ...lastMessage,
                  text: "",
                  deletedForEveryone: true,
                };
              }
            } else if (payload.event === "message.edited") {
              if (lastMessage) {
                lastMessage = {
                  ...lastMessage,
                  text: payload.message || "",
                };
              }
            }

            return {
              ...conv,
              lastMessage,
              unread,
              updatedAt: payload.timestamp || conv.updatedAt,
            };
          });

          // Sort conversations so the one with the newest message rises to the top
          return [...nextList].sort((a, b) => {
            const aTime = a.lastMessage?.createdAt || a.updatedAt || 0;
            const bTime = b.lastMessage?.createdAt || b.updatedAt || 0;
            return new Date(bTime) - new Date(aTime);
          });
        });

        // 2. Update message history list for active conversation
        queryClient.setQueryData(["messages", convId], (old) => {
          if (!old || !Array.isArray(old.items)) return old;

          const items = [...old.items];
          const msgId = payload.message_id;
          const existingIdx = items.findIndex((item) => String(item.id) === String(msgId));

          if (payload.event === "message.created") {
            if (existingIdx === -1) {
              const newMsg = {
                id: msgId,
                senderId: payload.sender_id,
                senderName: payload.username,
                text: payload.message || "",
                createdAt: payload.timestamp,
                editedAt: null,
                edited: false,
                type: "CHAT",
                isMine: payload.sender_id === meId,
                delivered: true,
                read: false,
                deletedForEveryone: false,
                replyTo: payload.reply_to ? {
                  id: payload.reply_to.message_id,
                  senderId: payload.reply_to.sender_id,
                  senderName: payload.reply_to.username,
                  text: payload.reply_to.message,
                  isDeleted: payload.reply_to.is_deleted || false,
                } : null,
                reactions: [],
              };
              items.push(newMsg);
            }
          } else if (payload.event === "message.edited") {
            if (existingIdx !== -1) {
              items[existingIdx] = {
                ...items[existingIdx],
                text: payload.message || "",
                edited: true,
                editedAt: payload.edited_at,
              };
            }
          } else if (payload.event === "message.deleted_for_everyone") {
            if (existingIdx !== -1) {
              items[existingIdx] = {
                ...items[existingIdx],
                text: "",
                deletedForEveryone: true,
              };
            }
          } else if (payload.event === "message.deleted_for_me") {
            if (existingIdx !== -1) {
              items.splice(existingIdx, 1);
            }
          } else if (payload.event === "message.delivered") {
            if (existingIdx !== -1) {
              items[existingIdx] = {
                ...items[existingIdx],
                delivered: true,
              };
            }
          } else if (payload.event === "message.read") {
            if (existingIdx !== -1) {
              items[existingIdx] = {
                ...items[existingIdx],
                delivered: true,
                read: true,
              };
            }
          } else if (payload.event === "message.reaction_added") {
            if (existingIdx !== -1) {
              const msg = items[existingIdx];
              const reactions = [...(msg.reactions || [])];
              const emoji = payload.reaction;
              const user_id = payload.user_id;
              const isMe = user_id === meId;

              const reactIdx = reactions.findIndex((r) => r.emoji === emoji);
              if (reactIdx !== -1) {
                reactions[reactIdx] = {
                  ...reactions[reactIdx],
                  count: reactions[reactIdx].count + 1,
                  reactedByMe: reactions[reactIdx].reactedByMe || isMe,
                };
              } else {
                reactions.push({
                  emoji: emoji,
                  count: 1,
                  reactedByMe: isMe,
                });
              }
              items[existingIdx] = { ...msg, reactions };
            }
          } else if (payload.event === "message.reaction_removed") {
            if (existingIdx !== -1) {
              const msg = items[existingIdx];
              const reactions = [...(msg.reactions || [])];
              const emoji = payload.reaction;
              const user_id = payload.user_id;
              const isMe = user_id === meId;

              const reactIdx = reactions.findIndex((r) => r.emoji === emoji);
              if (reactIdx !== -1) {
                const count = reactions[reactIdx].count - 1;
                const reactedByMe = isMe ? false : reactions[reactIdx].reactedByMe;
                if (count > 0) {
                  reactions[reactIdx] = {
                    ...reactions[reactIdx],
                    count,
                    reactedByMe,
                  };
                } else {
                  reactions.splice(reactIdx, 1);
                }
              }
              items[existingIdx] = { ...msg, reactions };
            }
          }

          return {
            ...old,
            items,
          };
        });
      }
    });

    const timer = setInterval(() => {
      useAppStore.getState().clearExpiredTypingUsers();
    }, 1000);

    return () => {
      clearInterval(timer);
      unsub();
      wsClient.disconnect();
    };
  }, [authed, queryClient]);
}
