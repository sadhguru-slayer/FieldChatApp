import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserPlus, UserMinus, MessageSquare, Bell, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { wsClient, joinConversation } from "@/services/ws";
import { Avatar } from "@/components/Avatar";
import { markNotificationAsRead, getMyUserId } from "@/services/api";
import { cn } from "@/lib/utils";

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

// Module-level cache for buffering rapid notifications to prevent race conditions & spamming
const notificationBuffers = new Map();
const activeToastIds = new Map();

function fallbackNativeNotification(title, options, conversationId) {
  try {
    const nativeNotif = new Notification(title, options);
    nativeNotif.onclick = () => {
      window.focus();
      if (conversationId) {
        useAppStore.getState().setActiveId(conversationId);
        useAppStore.getState().setActiveScreen("chat");
        useAppStore.getState().setMobileView("chat");
      }
    };
  } catch (err) {
    console.warn("[Notifications] Fallback native notification failed:", err);
  }
}

function dispatchGroupedToast(tag, title, body, avatar, conversationId, unreadCount, action) {
  if (activeToastIds.has(tag)) {
    const prevId = activeToastIds.get(tag);
    toast.dismiss(prevId);
  }

  const isAdded = action === "ADDED_TO_GROUP";
  const isRemoved = action === "REMOVED_FROM_GROUP";

  let baseTitle = title;
  baseTitle = baseTitle.replace(/\s*\(\d+\s*new messages?\)/i, "");
  const displayTitle = unreadCount > 1 
    ? `${baseTitle} (${unreadCount} new messages)` 
    : baseTitle;

  const newToastId = toast.custom((t) => {
    return (
      <div
        onClick={() => {
          toast.dismiss(t);
          if (conversationId) {
            useAppStore.getState().setActiveId(conversationId);
            useAppStore.getState().setActiveScreen("chat");
            useAppStore.getState().setMobileView("chat");
          }
        }}
        className="group relative flex items-center gap-3 w-full max-w-sm p-3.5 rounded-2xl bg-zinc-900/95 border border-zinc-800/90 shadow-2xl backdrop-blur-xl text-foreground cursor-pointer hover:bg-zinc-800/80 transition-all duration-200 select-none ring-1 ring-white/5"
      >
        <div className="relative shrink-0">
          <Avatar
            src={avatar}
            name={title}
            size="md"
          />
          <div
            className={cn(
              "absolute -bottom-1 -right-1 grid size-4.5 place-items-center rounded-full border border-zinc-900 text-[9px] shadow-xs",
              isAdded
                ? "bg-emerald-500 text-zinc-950 font-bold"
                : isRemoved
                ? "bg-rose-500 text-white"
                : "bg-indigo-500 text-white"
            )}
          >
            {isAdded ? (
              <UserPlus className="size-2.5" />
            ) : isRemoved ? (
              <UserMinus className="size-2.5" />
            ) : (
              <MessageSquare className="size-2.5" />
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1 pr-3">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-xs font-semibold text-zinc-100 truncate tracking-tight">
              {displayTitle}
            </span>
            <span className="text-[10px] text-zinc-400 font-medium shrink-0">
              Just now
            </span>
          </div>
          <p className="text-[11.5px] text-zinc-300/90 font-normal truncate leading-snug">
            {body}
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toast.dismiss(t);
          }}
          className="absolute top-2.5 right-2.5 grid size-5 place-items-center rounded-full text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
        >
          <X className="size-3" />
        </button>
      </div>
    );
  }, { unstyled: true });

  activeToastIds.set(tag, newToastId);
}

async function dispatchGroupedNotification(tag, buffer) {
  notificationBuffers.delete(tag);

  let existingCount = 0;
  let existingMessages = [];
  let reg = null;

  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    try {
      reg = await navigator.serviceWorker.ready;
      if (reg && reg.getNotifications) {
        const existing = await reg.getNotifications({ tag });
        if (existing && existing.length > 0) {
          existingCount = existing[0].data?.unreadCount || 1;
          existingMessages = existing[0].data?.messages || [];
        }
      }
    } catch (e) {
      console.warn("[Notifications] Error fetching existing SW notifications:", e);
    }
  }

  const totalUnreadCount = existingCount + buffer.count;

  // Compile the new list of messages
  const newMessages = [...existingMessages];
  const senderName = buffer.username || buffer.title?.replace('New message from ', '') || 'Someone';
  if (buffer.body) {
    newMessages.push(`${senderName}: ${buffer.body}`);
  }
  if (newMessages.length > 5) {
    newMessages.shift();
  }

  const displayBody = newMessages.length > 1
    ? newMessages.join('\n')
    : buffer.body;

  // 1. Dispatch custom in-app toast notification
  dispatchGroupedToast(
    tag,
    buffer.title,
    buffer.body,
    buffer.avatar,
    buffer.conversationId,
    totalUnreadCount,
    buffer.action
  );

  // 2. Dispatch native OS notification if permission is granted
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    let baseTitle = buffer.title;
    baseTitle = baseTitle.replace(/\s*\(\d+\s*new messages?\)/i, "");
    const cleanedTitle = baseTitle.replace('New message from ', '');
    const displayTitle = totalUnreadCount > 1 
      ? `${cleanedTitle} (${totalUnreadCount} messages)` 
      : baseTitle;

    const options = {
      body: displayBody,
      icon: buffer.avatar || "/Logo.png",
      badge: "/Logo.png",
      tag: tag,
      renotify: true,
      data: {
        conversation_id: buffer.conversationId,
        unreadCount: totalUnreadCount,
        messages: newMessages,
      },
      vibrate: [100, 50, 100],
    };

    if (reg && reg.showNotification) {
      try {
        await reg.showNotification(displayTitle, options);
      } catch (err) {
        console.warn("[Notifications] SW showNotification failed, falling back:", err);
        fallbackNativeNotification(displayTitle, options, buffer.conversationId);
      }
    } else {
      fallbackNativeNotification(displayTitle, options, buffer.conversationId);
    }
  }
}

function queueGroupedNotification(notif, targetConvId, notifData) {
  const tag = targetConvId ? `chat-${targetConvId}` : (notif.id ? `notif-${notif.id}` : "general");
  const action = notifData?.action;

  if (notificationBuffers.has(tag)) {
    const buffer = notificationBuffers.get(tag);
    clearTimeout(buffer.timeoutId);

    buffer.count += 1;
    buffer.body = notif.body || buffer.body;
    buffer.avatar = notifData?.avatar || buffer.avatar;
    buffer.action = action || buffer.action;
    buffer.username = notifData?.username || buffer.username;

    buffer.timeoutId = setTimeout(() => {
      dispatchGroupedNotification(tag, buffer);
    }, 800); // 800ms debounce
  } else {
    const buffer = {
      count: 1,
      title: notif.title || "Fieldchat Notification",
      body: notif.body || "",
      avatar: notifData?.avatar || null,
      username: notifData?.username || null,
      conversationId: targetConvId,
      action: action,
      timeoutId: null
    };

    buffer.timeoutId = setTimeout(() => {
      dispatchGroupedNotification(tag, buffer);
    }, 800);

    notificationBuffers.set(tag, buffer);
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

  // Handle App resume / visibility change (e.g. mobile app opened from background/homescreen after idle time)
  useEffect(() => {
    if (!authed) return;

    const handleAppResume = () => {
      if (document.visibilityState === "visible") {
        console.log("[Sync] App resumed from background/idle. Resyncing conversations and active messages...");
        if (!wsClient.isConnected) {
          wsClient.connect();
        }

        queryClient.invalidateQueries({ queryKey: ["conversations"] });

        const activeId = useAppStore.getState().activeId;
        if (activeId) {
          joinConversation(activeId);
          queryClient.invalidateQueries({ queryKey: ["messages", activeId] });
        }
      }
    };

    document.addEventListener("visibilitychange", handleAppResume);
    window.addEventListener("focus", handleAppResume);

    return () => {
      document.removeEventListener("visibilitychange", handleAppResume);
      window.removeEventListener("focus", handleAppResume);
    };
  }, [authed, queryClient]);

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

  // Automatically clear active tray notification when switching to/opening a conversation
  const activeId = useAppStore((s) => s.activeId);
  useEffect(() => {
    if (!activeId) return;
    const tag = `chat-${activeId}`;

    // Clear any pending debounced notification timeouts
    if (notificationBuffers.has(tag)) {
      const buffer = notificationBuffers.get(tag);
      if (buffer.timeoutId) {
        clearTimeout(buffer.timeoutId);
      }
      notificationBuffers.delete(tag);
    }

    // Dismiss any active in-app toast for this conversation
    if (activeToastIds.has(tag)) {
      toast.dismiss(activeToastIds.get(tag));
      activeToastIds.delete(tag);
    }

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        if (reg && reg.getNotifications) {
          reg.getNotifications({ tag }).then((notifications) => {
            notifications.forEach((n) => n.close());
          }).catch(() => {});
        }
      }).catch(() => {});
    }
  }, [activeId]);

  useEffect(() => {
    if (!authed) {
      wsClient.disconnect();
      return;
    }

    wsClient.connect();

    // Invalidate and refetch queries on connection/reconnection to sync missed messages
    const unsubOpen = wsClient.on("open", () => {
      console.log("[WS] Connected/reconnected. Refetching active conversation to sync missed messages...");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      const activeId = useAppStore.getState().activeId;
      if (activeId) {
        queryClient.invalidateQueries({ queryKey: ["messages", activeId] });
      }
    });

    // Handle incoming real-time events from backend
    const unsub = wsClient.on("*", (payload) => {
      if (!payload || !payload.event) return;

      if (payload.event === "notification" && payload.notification) {
        const notif = payload.notification;
        const activeId = useAppStore.getState().activeId;
        const activeScreen = useAppStore.getState().activeScreen;
        const mobileView = useAppStore.getState().mobileView;

        let notifData = notif.data;
        if (typeof notifData === "string") {
          try {
            notifData = JSON.parse(notifData);
          } catch (e) {
            notifData = {};
          }
        }

        const targetConvId = notifData?.conversation_id;
        const subEvent = notifData?.sub_event;

        // Invalidate conversations list to pull fresh data on group membership changes
        if (subEvent === "conversation.added" || subEvent === "conversation.removed") {
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          // If the user is removed from the currently active conversation, deselect it
          if (subEvent === "conversation.removed" && targetConvId && String(activeId) === String(targetConvId)) {
            useAppStore.getState().setActiveId(null);
          }
        }

        const isCurrentlyViewingConv =
          Boolean(targetConvId) &&
          String(activeId) === String(targetConvId) &&
          activeScreen === "chat" &&
          (typeof window === "undefined" || window.innerWidth >= 768 || mobileView === "chat");

        // Do not treat incoming notifications as global alerts/toasts/push if user is actively viewing the conversation.
        // Auto-resolve / mark as read on the backend immediately without triggering UI popups or unread badges.
        if (isCurrentlyViewingConv) {
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

        // Trigger Grouped Notification (handles both native OS & in-app toasts with debounce)
        if (!targetConvId || String(activeId) !== String(targetConvId)) {
          queueGroupedNotification(notif, targetConvId, notifData);
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
        const myUserId = getMyUserId();
        if (myUserId && String(payload.sender_id) === String(myUserId)) return;

        useAppStore.getState().setTypingUser(
          String(payload.conversation_id),
          String(payload.sender_id),
          payload.username || "Someone"
        );
      }

      if (payload.event === "user.updated" && payload.user) {
        const updatedUser = payload.user;
        queryClient.setQueryData(["me"], (old) => {
          if (!old || String(old.id) !== String(updatedUser.id)) return old;
          return { ...old, ...updatedUser };
        });
        queryClient.setQueryData(["users"], (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((u) => (String(u.id) === String(updatedUser.id) ? { ...u, ...updatedUser } : u));
        });
      }

      if (payload.event === "conversation.created" && payload.conversation) {
        const newConv = payload.conversation;
        queryClient.setQueryData(["conversations"], (old) => {
          if (!Array.isArray(old)) return [newConv];
          const exists = old.some((c) => String(c.id) === String(newConv.id));
          if (exists) return old.map((c) => (String(c.id) === String(newConv.id) ? { ...c, ...newConv } : c));
          return [newConv, ...old];
        });
      }

      // Update conversations and messages list in-memory on message events
      if (payload.event.startsWith("message.")) {
        const convId = String(payload.conversation_id);
        const activeId = useAppStore.getState().activeId;
        const meId = getMyUserId();

        // If it's a SYSTEM message (e.g. member added/removed), refetch group list and members
        if (payload.event === "message.created" && payload.type === "SYSTEM") {
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          queryClient.invalidateQueries({ queryKey: ["groupMembers", convId] });
        }

        if (payload.event === "message.created" && payload.sender_id !== meId) {
          // Immediately mark as delivered if we are connected to WS
          wsClient.send({
            event: "message.delivered",
            conversation_id: payload.conversation_id,
            message_id: payload.message_id,
          });

          if (convId === String(activeId)) {
            wsClient.send({
              event: "message.read",
              conversation_id: payload.conversation_id,
              message_id: payload.message_id,
            });
            playPopSound(queryClient);
          }
        }

        // 1. Update conversations list
        queryClient.setQueryData(["conversations"], (old) => {
          if (!Array.isArray(old)) return old;

          const exists = old.some((conv) => String(conv.id) === convId);
          const isMe = payload.sender_id && meId && String(payload.sender_id) === String(meId);
          const senderDisplayName = isMe ? "You" : (payload.display_name || payload.username || payload.sender || "Someone");

          if (!exists) {
            const newConv = {
              id: convId,
              title: payload.group_name || payload.conversation_title || payload.display_name || payload.username || "Chat",
              type: payload.conversation_type || (payload.group_name ? "group" : "dm"),
              otherUserId: isMe ? null : payload.sender_id,
              avatar: payload.avatar || null,
              unread: (!isMe && String(activeId) !== convId) ? 1 : 0,
              updatedAt: payload.timestamp ? (new Date(payload.timestamp).getTime() || Date.now()) : Date.now(),
              lastMessage: payload.event === "message.created" ? {
                id: String(payload.message_id || ""),
                senderId: payload.sender_id,
                senderName: senderDisplayName,
                display_name: payload.display_name,
                username: payload.username,
                text: payload.message || "",
                deletedForEveryone: false,
                createdAt: payload.timestamp,
              } : null,
            };
            return [newConv, ...old];
          }

          const nextList = old.map((conv) => {
            if (String(conv.id) !== convId) return conv;

            let lastMessage = conv.lastMessage;
            let unread = conv.unread || 0;

            if (payload.event === "message.created") {
              lastMessage = {
                id: String(payload.message_id || ""),
                senderId: payload.sender_id,
                senderName: senderDisplayName,
                display_name: payload.display_name,
                username: payload.username,
                text: payload.message || "",
                deletedForEveryone: false,
                createdAt: payload.timestamp,
              };
              if (!isMe && String(activeId) !== convId) {
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
                  senderName: senderDisplayName,
                };
              }
            }

            const ts = payload.timestamp ? (new Date(payload.timestamp).getTime() || Date.now()) : conv.updatedAt;

            return {
              ...conv,
              lastMessage,
              unread,
              updatedAt: ts,
            };
          });

          // Helper to get time ms
          const getTimeMs = (c) => {
            const t = c.lastMessage?.createdAt || c.updatedAt;
            if (!t) return 0;
            return typeof t === "number" ? t : (new Date(t).getTime() || 0);
          };

          // Sort conversations so the one with the newest message immediately rises to top of sidebar
          return [...nextList].sort((a, b) => getTimeMs(b) - getTimeMs(a));
        });

        // 2. Update message history list for active conversation
        queryClient.setQueryData(["messages", convId], (old) => {
          if (!old || !old.pages) return old;

          const msgId = payload.message_id;
          let found = false;

          const pages = old.pages.map((page, pageIndex) => {
            let items = [...page.items];
            const existingIdx = items.findIndex((item) => String(item.id) === String(msgId));
            
            if (existingIdx !== -1) {
              found = true;
              const isMine = payload.sender_id && meId && String(payload.sender_id) === String(meId);
              const msgSenderName = isMine ? "You" : (payload.display_name || payload.username || payload.sender || "Someone");

              if (payload.event === "message.edited") {
                items[existingIdx] = {
                  ...items[existingIdx],
                  text: payload.message || "",
                  edited: true,
                  editedAt: payload.edited_at,
                };
              } else if (payload.event === "message.deleted_for_everyone") {
                items[existingIdx] = {
                  ...items[existingIdx],
                  text: "",
                  deletedForEveryone: true,
                };
              } else if (payload.event === "message.deleted_for_me") {
                items.splice(existingIdx, 1);
              } else if (payload.event === "message.delivered") {
                const conv = queryClient.getQueryData(["conversations"])?.find((c) => String(c.id) === convId);
                if (conv?.type !== "group") {
                  items[existingIdx] = {
                    ...items[existingIdx],
                    delivered: true,
                  };
                }
              } else if (payload.event === "message.read") {
                const conv = queryClient.getQueryData(["conversations"])?.find((c) => String(c.id) === convId);
                if (conv?.type !== "group") {
                  items[existingIdx] = {
                    ...items[existingIdx],
                    delivered: true,
                    read: true,
                  };
                }
              } else if (payload.event === "message.reaction_added") {
                const msg = items[existingIdx];
                const reactions = [...(msg.reactions || [])];
                const emoji = payload.reaction;
                const user_id = payload.user_id;
                const isMe = user_id === meId;

                const reactIdx = reactions.findIndex((r) => r.emoji === emoji);
                if (reactIdx !== -1) {
                  const r = reactions[reactIdx];
                  const alreadyCounted = isMe && r.reactedByMe;
                  reactions[reactIdx] = {
                    ...r,
                    count: alreadyCounted ? r.count : r.count + 1,
                    reactedByMe: r.reactedByMe || isMe,
                  };
                } else {
                  reactions.push({
                    emoji: emoji,
                    count: 1,
                    reactedByMe: isMe,
                  });
                }
                items[existingIdx] = { ...msg, reactions };
              } else if (payload.event === "message.reaction_removed") {
                const msg = items[existingIdx];
                const reactions = [...(msg.reactions || [])];
                const emoji = payload.reaction;
                const user_id = payload.user_id;
                const isMe = user_id === meId;

                const reactIdx = reactions.findIndex((r) => r.emoji === emoji);
                if (reactIdx !== -1) {
                  const r = reactions[reactIdx];
                  const alreadyDiscounted = isMe && !r.reactedByMe;
                  const count = alreadyDiscounted ? r.count : r.count - 1;
                  const reactedByMe = isMe ? false : r.reactedByMe;
                  if (count > 0) {
                    reactions[reactIdx] = {
                      ...r,
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

            // Only add new message if it's the first page
            if (payload.event === "message.created" && pageIndex === 0 && !found) {
              const isMine = payload.sender_id && meId && String(payload.sender_id) === String(meId);
              const msgSenderName = isMine ? "You" : (payload.display_name || payload.username || payload.sender || "Someone");
              
              const newMsg = {
                id: msgId,
                senderId: payload.sender_id,
                senderName: msgSenderName,
                display_name: payload.display_name,
                username: payload.username,
                text: payload.message || "",
                createdAt: payload.timestamp,
                editedAt: null,
                edited: false,
                type: "CHAT",
                isMine,
                delivered: !isMine,
                read: !isMine && convId === String(activeId),
                deletedForEveryone: false,
                replyTo: payload.reply_to ? {
                  id: payload.reply_to.message_id,
                  senderId: payload.reply_to.sender_id,
                  senderName: payload.reply_to.display_name || payload.reply_to.username,
                  text: payload.reply_to.message,
                  isDeleted: payload.reply_to.is_deleted || false,
                } : null,
                reactions: [],
              };
              items.unshift(newMsg);
              found = true;
            }

            return { ...page, items };
          });
          return {
            ...old,
            pages,
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
      unsubOpen();
    };
  }, [authed, queryClient]);

  // Automatically refetch conversations list in background when navigating back to chat list
  const mobileView = useAppStore((s) => s.mobileView);
  const activeScreen = useAppStore((s) => s.activeScreen);

  useEffect(() => {
    if (authed && activeScreen === "chat" && mobileView === "list") {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  }, [authed, activeScreen, mobileView, queryClient]);
}
