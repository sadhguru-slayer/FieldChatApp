import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import { wsClient } from "@/services/ws";
import { Avatar } from "@/components/Avatar";
import { markNotificationAsRead } from "@/services/api";

let lastPopPlayedAt = 0;

function playPopSound(queryClient) {
  const settings = queryClient.getQueryData(["settings"]);
  const soundEnabled = settings?.sound_enabled ?? true;
  if (!soundEnabled) return;

  const now = Date.now();
  if (now - lastPopPlayedAt < 500) return;
  lastPopPlayedAt = now;

  try {
    const audio = new Audio("/pop.mp3");
    audio.volume = 0.4;
    audio.play().catch((err) => {
      console.debug("[Audio] Play prevented:", err);
    });
  } catch (err) {
    console.warn("[Audio] Error playing pop sound:", err);
  }
}

export function useRealtimeSync(authed) {
  const queryClient = useQueryClient();

  // Request native Web Notification permission on mount / authentication
  useEffect(() => {
    if (authed && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch((err) => {
          console.warn("[Notifications] Permission request error:", err);
        });
      }
    }
  }, [authed]);

  // Handle notification click messages from service worker (especially on mobile)
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const handleSWMessage = (event) => {
      if (event.data && event.data.type === 'NAVIGATE_TO_CONVERSATION') {
        const targetConvId = event.data.conversationId;
        if (targetConvId) {
          useAppStore.getState().setActiveId(targetConvId);
          useAppStore.getState().setActiveScreen("chat");
          useAppStore.getState().setMobileView("chat");
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleSWMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleSWMessage);
    };
  }, []);

  useEffect(() => {
    if (!authed) {
      wsClient.disconnect();
      return;
    }

    wsClient.connect();

    // Handle incoming real-time events from backend
    const unsub = wsClient.on("*", (payload) => {
      if (!payload || !payload.event) return;

      if (payload.event === "notification" && payload.notification) {
        const notif = payload.notification;
        const activeId = useAppStore.getState().activeId;
        const targetConvId = notif.data?.conversation_id;

        // Do not treat every incoming message as a global notification if user is already viewing the conversation.
        // Auto-resolve / mark as read on the backend immediately without adding to local cache.
        if (notif.type === "MESSAGE" && targetConvId && String(activeId) === String(targetConvId)) {
          markNotificationAsRead(notif.id).catch(() => {});
          return;
        }

        // 1. Update notifications list query cache safely with duplicate prevention
        queryClient.setQueryData(["notifications"], (old) => {
          if (!Array.isArray(old)) return [notif];
          const exists = old.some((n) => String(n.id) === String(notif.id));
          if (exists) return old;
          return [notif, ...old];
        });

        // 2. Increment unread count query cache
        if (!notif.is_read) {
          queryClient.setQueryData(["notifications", "unread-count"], (old) => {
            const current = typeof old === "number" ? old : (old?.unread_count ?? 0);
            return { unread_count: current + 1 };
          });
        }

        // Trigger native HTML5 Desktop/Mobile Notification
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          if (document.hidden || !targetConvId || String(activeId) !== String(targetConvId)) {
            if ("serviceWorker" in navigator) {
              navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(notif.title, {
                  body: notif.body,
                  icon: notif.data?.avatar || undefined,
                  tag: notif.id,
                  data: {
                    conversation_id: targetConvId,
                  },
                });
              }).catch(() => {
                const nativeNotif = new Notification(notif.title, {
                  body: notif.body,
                  icon: notif.data?.avatar || undefined,
                  tag: notif.id,
                });
                nativeNotif.onclick = () => {
                  window.focus();
                  if (targetConvId) {
                    useAppStore.getState().setActiveId(targetConvId);
                    useAppStore.getState().setActiveScreen("chat");
                    useAppStore.getState().setMobileView("chat");
                  }
                };
              });
            } else {
              const nativeNotif = new Notification(notif.title, {
                body: notif.body,
                icon: notif.data?.avatar || undefined,
                tag: notif.id,
              });
              nativeNotif.onclick = () => {
                window.focus();
                if (targetConvId) {
                  useAppStore.getState().setActiveId(targetConvId);
                  useAppStore.getState().setActiveScreen("chat");
                  useAppStore.getState().setMobileView("chat");
                }
              };
            }
          }
        }

        // 3. Toast pop-up if user is not currently viewing the active conversation
        if (!targetConvId || String(activeId) !== String(targetConvId)) {
          toast.custom((t) => (
            <div
              onClick={() => {
                toast.dismiss(t);
                if (targetConvId) {
                  useAppStore.getState().setActiveId(targetConvId);
                  useAppStore.getState().setActiveScreen("chat");
                  useAppStore.getState().setMobileView("chat");
                }
              }}
              className="flex items-center gap-3 w-full max-w-sm p-3 rounded-xl bg-surface border border-border/60 text-foreground shadow-xl cursor-pointer hover:bg-elevated transition-all"
            >
              <Avatar
                src={notif.data?.avatar}
                name={notif.data?.username || notif.title}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {notif.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    Just now
                  </span>
                </div>
                <p className="text-[11.5px] text-muted-foreground/90 truncate">
                  {notif.body}
                </p>
              </div>
            </div>
          ));
        }
      }

      if (payload.event === "presence" && payload.user_id !== undefined) {
        useAppStore.getState().setPresence(
          payload.user_id,
          payload.online,
          payload.last_seen ?? null,
        );
      }

      if (payload.event === "typing" && payload.conversation_id && payload.sender_id) {
        const me = queryClient.getQueryData(["me"]);
        if (me && String(payload.sender_id) === String(me.id)) return;

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

        if (payload.event === "message.created" && convId === String(activeId)) {
          if (payload.sender_id !== meId) {
            playPopSound(queryClient);
          }
        }

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
    };
  }, [authed, queryClient]);
}
