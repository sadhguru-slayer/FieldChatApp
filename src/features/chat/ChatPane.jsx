import { useState, useEffect } from "react";
import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  Info,
  MessageSquare,
  Pencil,
  Reply,
  Trash2,
  MoreVertical,
  Users,
  UserPlus,
  LogOut,
  User,
  Menu,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";
import { useAppStore } from "@/store/useAppStore";
import { useAnimatePresence } from "@/hooks/useAnimatePresence";
import { formatLastSeen } from "@/lib/format";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  deleteMessageForEveryone,
  deleteMessageForMe,
  editMessage,
  getConversations,
  getMe,
  getMessages,
  reactToMessage,
  removeReaction,
  sendMessage,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  leaveGroup as leaveGroupApi,
  addMembers as addMembersApi,
  getGroupMembers,
  getUsers,
} from "@/services/api";
import { cn } from "@/lib/utils";

function useVisualViewportHeight() {
  const [height, setHeight] = useState("100%");

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const handler = () => {
      setHeight(`${window.visualViewport.height}px`);
      // Immediately reset any automatic page scroll caused by focusing inputs on iOS/Android
      window.scrollTo(0, 0);
    };

    window.visualViewport.addEventListener("resize", handler);
    window.visualViewport.addEventListener("scroll", handler);
    window.addEventListener("scroll", handler);
    handler();

    return () => {
      window.visualViewport.removeEventListener("resize", handler);
      window.visualViewport.removeEventListener("scroll", handler);
      window.removeEventListener("scroll", handler);
    };
  }, []);

  return height;
}

// ─── Quick reactions ──────────────────────────────────────────────────────────
const QUICK_REACTIONS = ["👍", "❤️", "😂", "🔥", "🙏", "😮"];

// ─── Context Menu ─────────────────────────────────────────────────────────────
// Zinc monochrome design. Positions left-of-bubble for incoming, right for mine.
// Flips vertically if too close to the bottom.
function MessageContextMenu({ message, mine, anchor, onAction, onClose }) {
  const isOpen = Boolean(message && anchor);
  const { shouldRender, isClosing } = useAnimatePresence(isOpen, 150);

  if (!shouldRender || !message || !anchor) return null;

  const MENU_W = 192;
  const MENU_H = 260;

  let left = mine
    ? Math.min(anchor.x, window.innerWidth - MENU_W - 8)
    : Math.max(8, anchor.x - MENU_W);
  left = Math.max(8, Math.min(left, window.innerWidth - MENU_W - 8));

  let top = anchor.y + 6;
  if (top + MENU_H > window.innerHeight - 8) top = anchor.y - MENU_H - 6;
  top = Math.max(8, top);

  const items = [
    { id: "reply", label: "Reply", Icon: Reply },
    { id: "copy", label: "Copy text", Icon: Copy },
    ...(mine ? [{ id: "edit", label: "Edit message", Icon: Pencil }] : []),
    { id: "delete-me", label: "Delete for me", Icon: Trash2, danger: true },
    ...(mine ? [{ id: "delete-all", label: "Unsend for everyone", Icon: Trash2, danger: true }] : []),
  ];

  return (
    <>
      <div
        className={cn("fixed inset-0 z-[9998]", isClosing ? "fc-fade-out" : "fc-fade-in")}
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />

      <div
        className={cn(
          "fixed z-[9999] overflow-hidden rounded-xl bg-surface border border-border text-foreground shadow-2xl",
          isClosing ? "fc-scale-out" : "fc-scale-in"
        )}
        style={{ top, left, width: MENU_W }}
      >
        <div className="flex items-center justify-between px-2.5 py-2 border-b border-border/40">
          {QUICK_REACTIONS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => { onAction("react", message, e); onClose(); }}
              className="grid size-8 place-items-center rounded-lg text-[16px] transition-all hover:bg-elevated hover:scale-110 active:scale-95"
            >
              {e}
            </button>
          ))}
        </div>

        <div className="py-1">
          {items.map(({ id, label, Icon, danger }) => (
            <button
              key={id}
              type="button"
              onClick={() => { onAction(id, message); onClose(); }}
              className={cn(
                "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs transition-colors",
                danger
                  ? "text-destructive/90 hover:bg-destructive/10 hover:text-destructive"
                  : "text-foreground/80 hover:bg-elevated hover:text-foreground"
              )}
            >
              <Icon className="size-3.5 shrink-0 opacity-60" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Header Three-Dot Action Menu ─────────────────────────────────────────────
function ConversationHeaderMenu({ isGroup, onToggleDetails, onAddMember, onLeaveGroup }) {
  const [open, setOpen] = useState(false);
  const { shouldRender, isClosing } = useAnimatePresence(open, 150);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-label="Actions menu"
        className="grid size-9 place-items-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-elevated transition-colors no-tap-highlight"
      >
        <MoreVertical className="size-4.5" />
      </button>

      {shouldRender && (
        <>
          <div
            className={cn("fixed inset-0 z-40", isClosing ? "fc-fade-out" : "fc-fade-in")}
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "absolute right-0 top-11 z-50 w-48 rounded-2xl border border-border/50 bg-sidebar/95 backdrop-blur-xl p-1.5 shadow-2xl ring-1 ring-white/5",
              isClosing ? "fc-scale-out" : "fc-scale-in"
            )}
          >
            {isGroup ? (
              <>
                <button
                  type="button"
                  onClick={() => { onToggleDetails(); setOpen(false); }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-foreground/90 hover:bg-elevated hover:text-foreground transition-colors"
                >
                  <Users className="size-3.5 text-accent shrink-0" />
                  <span>Group Info</span>
                </button>

                <button
                  type="button"
                  onClick={() => { onAddMember(); setOpen(false); }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-foreground/90 hover:bg-elevated hover:text-foreground transition-colors"
                >
                  <UserPlus className="size-3.5 text-emerald-400 shrink-0" />
                  <span>Add Member</span>
                </button>

                <div className="my-1 border-t border-border/30" />

                <button
                  type="button"
                  onClick={() => { onLeaveGroup(); setOpen(false); }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="size-3.5 shrink-0" />
                  <span>Exit Group</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => { onToggleDetails(); setOpen(false); }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-foreground/90 hover:bg-elevated hover:text-foreground transition-colors"
              >
                <User className="size-3.5 text-accent shrink-0" />
                <span>User Info</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Add Member Modal ────────────────────────────────────────────────────────
function AddMemberModal({ activeId, open, onOpenChange }) {
  const qc = useQueryClient();
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe });
  const { data: allUsers = [] } = useQuery({ queryKey: ["users"], queryFn: getUsers });
  const { data: groupMembers = [] } = useQuery({
    queryKey: ["groupMembers", activeId],
    queryFn: () => getGroupMembers(activeId),
    enabled: !!activeId && open,
  });

  const addMut = useMutation({
    mutationFn: (userIds) => addMembersApi({ conversationId: activeId, userIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["groupMembers", activeId] });
      toast.success("Members added");
      onOpenChange(false);
      setSelectedUserIds([]);
    },
    onError: (err) => toast.error(err.message || "Failed to add members"),
  });

  const existingMemberIds = new Set(groupMembers.map((m) => String(m.id)));
  const addableUsers = allUsers.filter(
    (u) => !existingMemberIds.has(String(u.id)) && String(u.id) !== String(me?.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-sidebar border-border/40 text-foreground">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold">Add Members to Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="max-h-60 overflow-y-auto space-y-1.5 scroll-slim">
            {addableUsers.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-4">No users available to add.</p>
            ) : (
              addableUsers.map((u) => {
                const checked = selectedUserIds.includes(u.id);
                const displayName = u.display_name || u.name || "Unknown";

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() =>
                      setSelectedUserIds((prev) =>
                        checked ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                      )
                    }
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl p-2.5 text-left text-xs transition-colors border",
                      checked ? "bg-accent/15 border-accent/30 font-medium" : "border-transparent hover:bg-elevated/50"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar src={u.avatar} name={displayName} size="sm" />
                      <span>{displayName}</span>
                    </div>
                    {checked && <span className="text-accent text-xs font-bold">✓</span>}
                  </button>
                );
              })
            )}
          </div>
          <Button
            onClick={() => addMut.mutate(selectedUserIds)}
            disabled={selectedUserIds.length === 0 || addMut.isPending}
            className="w-full text-xs font-semibold"
          >
            Add Selected ({selectedUserIds.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function NothingSelected() {
  return (
    <main className="flex h-full flex-1 flex-col items-center justify-center p-8 text-center select-none bg-background">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-border/40 bg-surface/50 mb-3.5 text-muted-foreground shadow-2xs">
        <MessageSquare className="size-6 opacity-60" />
      </div>
      <h3 className="text-xs font-semibold text-foreground/80">
        Select a conversation
      </h3>
      <p className="mt-1 text-[11.5px] max-w-xs leading-relaxed text-muted-foreground">
        Choose a group or direct message to begin chatting.
      </p>
    </main>
  );
}

import {
  joinConversation,
  leaveConversation,
  createMessage as wsCreateMessage,
  editMessage as wsEditMessage,
  deleteMessageForEveryone as wsDeleteEveryone,
  deleteMessageForMe as wsDeleteMe,
  addReaction as wsAddReaction,
  removeReaction as wsRemoveReaction,
  markDelivered,
  markRead,
  wsClient,
} from "@/services/ws";

import { ReactionsDetailModal } from "./ReactionsDetailModal";

// ─── ChatPane ─────────────────────────────────────────────────────────────────
export function ChatPane() {
  const viewportHeight = useVisualViewportHeight();
  const activeId = useAppStore((s) => s.activeId);
  const togglePanel = useAppStore((s) => s.togglePanel);
  const setMobileView = useAppStore((s) => s.setMobileView);
  const setReply = useAppStore((s) => s.setReply);
  const setEditing = useAppStore((s) => s.setEditing);
  const typingUsers = useAppStore((s) => s.typingUsers);
  const presence = useAppStore((s) => s.presence);
  const toggleMenu = useAppStore((s) => s.toggleMenu);
  const groupAddMemberOpen = useAppStore((s) => s.groupAddMemberOpen);
  const setGroupAddMemberOpen = useAppStore((s) => s.setGroupAddMemberOpen);
  const setActiveId = useAppStore((s) => s.setActiveId);
  const closePanel = useAppStore((s) => s.closePanel);

  const qc = useQueryClient();
  const [ctxMenu, setCtxMenu] = useState(null);
  const [reactionsDetailMsg, setReactionsDetailMsg] = useState(null);

  const leaveGroupMut = useMutation({
    mutationFn: () => leaveGroupApi({ conversationId: activeId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Left group");
      setActiveId(null);
      closePanel();
    },
    onError: (err) => toast.error(err.message || "Failed to leave group"),
  });

  useEffect(() => {
    if (activeId) {
      joinConversation(activeId);
      // Invalidate the message query for this conversation to pull any messages we missed while it wasn't active
      qc.invalidateQueries({ queryKey: ["messages", activeId] });

      // Register listener to re-join the active conversation on WebSocket reconnect (e.g. after idle/sleep)
      const unsub = wsClient.on("open", () => {
        console.log("[WS] Connection re-established. Re-joining conversation:", activeId);
        joinConversation(activeId);
        // Invalidate message list to sync any missed messages while offline
        qc.invalidateQueries({ queryKey: ["messages", activeId] });
      });

      return () => {
        leaveConversation(activeId);
        unsub();
      };
    }
  }, [activeId, qc]);

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe });
  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
  });

  const activeConv = conversations.find((c) => String(c.id) === String(activeId));

  const {
    data: msgData,
    isLoading,
    error: msgError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["messages", activeId],
    queryFn: ({ pageParam = null }) => getMessages({ conversationId: activeId, pageParam }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    enabled: !!activeId,
    staleTime: 5000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (activeId && msgData?.pages?.length) {
      const allItems = msgData.pages.flatMap(p => p.items);
      allItems.forEach((msg) => {
        if (!msg.isMine && msg.id) {
          if (!msg.delivered) {
            markDelivered(activeId, msg.id);
          }
          if (!msg.read) {
            markRead(activeId, msg.id);
          }
        }
      });
    }
  }, [activeId, msgData]);

  // Resolve/mark associated message notifications as read when viewing this conversation
  useEffect(() => {
    if (activeId) {
      const notifications = qc.getQueryData(["notifications"]);
      if (Array.isArray(notifications)) {
        let clearedAny = false;
        const updatedList = notifications.map((n) => {
          if (!n.is_read && n.type === "MESSAGE" && String(n.data?.conversation_id) === String(activeId)) {
            markNotificationAsRead(n.id).catch(() => {});
            clearedAny = true;
            return { ...n, is_read: true };
          }
          return n;
        });

        if (clearedAny) {
          qc.setQueryData(["notifications"], updatedList);
          qc.setQueryData(["notifications", "unread-count"], (old) => {
            const current = typeof old === "number" ? old : (old?.unread_count ?? 0);
            const countToDecrement = notifications.filter(
              (n) => !n.is_read && n.type === "MESSAGE" && String(n.data?.conversation_id) === String(activeId)
            ).length;
            return { unread_count: Math.max(0, current - countToDecrement) };
          });
        }
      }
    }
  }, [activeId, msgData, qc]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const sendMut = useMutation({
    mutationFn: async ({ text, replyToId, fileUrl, fileName }) => {
      const sent = wsCreateMessage(activeId, text, replyToId, fileUrl, fileName);
      if (!sent) {
        return sendMessage({ conversationId: activeId, text, replyToId, fileUrl, fileName });
      }
    },
    onSuccess: (res) => {
      if (res) {
        qc.invalidateQueries({ queryKey: ["messages", activeId] });
        qc.invalidateQueries({ queryKey: ["conversations"] });
      }
    },
    onError: (err) => toast.error(err.message || "Failed to send"),
  });

  const editMut = useMutation({
    mutationFn: async ({ msg, newText }) => {
      const sent = wsEditMessage(activeId, msg.id, newText);
      if (!sent) {
        return editMessage({ conversationId: activeId, messageId: msg.id, text: newText });
      }
    },
    onSuccess: (res) => {
      if (res) {
        qc.invalidateQueries({ queryKey: ["messages", activeId] });
      }
      toast.success("Message edited");
    },
    onError: (err) => toast.error(err.message || "Failed to edit"),
  });

  const deleteMeM = useMutation({
    mutationFn: async (msg) => {
      const sent = wsDeleteMe(activeId, msg.id);
      if (!sent) {
        return deleteMessageForMe({ conversationId: activeId, messageId: msg.id });
      }
    },
    onSuccess: (res) => {
      if (res) {
        qc.invalidateQueries({ queryKey: ["messages", activeId] });
      }
    },
    onError: (err) => toast.error(err.message || "Failed to delete"),
  });

  const deleteAllM = useMutation({
    mutationFn: async (msg) => {
      const sent = wsDeleteEveryone(activeId, msg.id);
      if (!sent) {
        return deleteMessageForEveryone({ conversationId: activeId, messageId: msg.id });
      }
    },
    onSuccess: (res) => {
      if (res) {
        qc.invalidateQueries({ queryKey: ["messages", activeId] });
      }
      toast.success("Message removed");
    },
    onError: (err) => toast.error(err.message || "Failed to unsend"),
  });

  const reactM = useMutation({
    mutationFn: async ({ msg, emoji }) => {
      const sent = wsAddReaction(activeId, msg.id, emoji);
      if (!sent) {
        return reactToMessage({ conversationId: activeId, messageId: msg.id, reaction: emoji });
      }
    },
    onSuccess: (res) => {
      if (res) {
        qc.invalidateQueries({ queryKey: ["messages", activeId] });
      }
    },
    onError: (err) => toast.error(err.message || "Failed to react"),
  });

  const updateOptimisticReactions = (msgId, emojiToSet) => {
    qc.setQueryData(["messages", activeId], (oldData) => {
      if (!oldData || !oldData.pages) return oldData;
      
      const updatedPages = oldData.pages.map(page => {
        const updatedItems = page.items.map((m) => {
        if (String(m.id) !== String(msgId)) return m;

        let currentReactions = m.reactions ? [...m.reactions] : [];

        // Remove any reaction previously set by me
        currentReactions = currentReactions
          .map((r) => {
            if (r.reactedByMe) {
              const newCount = r.count - 1;
              return newCount > 0 ? { ...r, count: newCount, reactedByMe: false } : null;
            }
            return r;
          })
          .filter(Boolean);

        // If emojiToSet is provided, add or update that emoji for me
        if (emojiToSet) {
          const existingIdx = currentReactions.findIndex((r) => r.emoji === emojiToSet);
          if (existingIdx >= 0) {
            const existing = currentReactions[existingIdx];
            currentReactions[existingIdx] = {
              ...existing,
              count: existing.count + 1,
              reactedByMe: true,
            };
          } else {
            currentReactions.push({
              emoji: emojiToSet,
              count: 1,
              reactedByMe: true,
            });
          }
        }

        return { ...m, reactions: currentReactions };
      });
      return { ...page, items: updatedItems };
    });

    return { ...oldData, pages: updatedPages };
  });
};

  const handleAction = (action, msg, extra) => {
    if (action === "reply") {
      setReply({ ...msg, senderName: msg.senderName || (msg.isMine ? "You" : "Unknown") });
    } else if (action === "edit") {
      setEditing(msg);
    } else if (action === "copy") {
      navigator.clipboard.writeText(msg.text);
      toast.success("Copied");
    } else if (action === "delete-me") {
      deleteMeM.mutate(msg);
    } else if (action === "delete-all") {
      deleteAllM.mutate(msg);
    } else if (action === "react") {
      const emoji = extra;
      const existingByMe = msg.reactions?.find((r) => r.reactedByMe);

      if (existingByMe && existingByMe.emoji === emoji) {
        // Toggling off existing reaction
        updateOptimisticReactions(msg.id, null);
        const sent = wsRemoveReaction(activeId, msg.id);
        if (!sent) {
          removeReaction({ conversationId: activeId, messageId: msg.id })
            .catch(() => qc.invalidateQueries({ queryKey: ["messages", activeId] }));
        }
      } else {
        // Adding or replacing reaction with new emoji
        updateOptimisticReactions(msg.id, emoji);
        reactM.mutate({ msg, emoji });
      }
    } else if (action === "remove-reaction") {
      updateOptimisticReactions(msg.id, null);
      const sent = wsRemoveReaction(activeId, msg.id);
      if (!sent) {
        removeReaction({ conversationId: activeId, messageId: msg.id })
          .catch(() => qc.invalidateQueries({ queryKey: ["messages", activeId] }));
      }
    }
  };

  const openContextMenu = (msg, e) => {
    const rect = e?.currentTarget?.getBoundingClientRect?.();
    const isMine = msg.isMine || msg.senderId === me?.id;
    const anchor = rect
      ? {
        x: isMine ? rect.left : rect.right,
        y: rect.bottom,
      }
      : {
        x: e?.clientX ?? window.innerWidth / 2,
        y: e?.clientY ?? window.innerHeight / 2,
      };
    setCtxMenu({ message: msg, anchor, mine: isMine });
  };

  if (!activeId || !activeConv) return <NothingSelected />;

  const isGroup = activeConv.type === "group";
  const messages = msgData?.pages?.flatMap(p => p.items).reverse() || [];
  const wsPresenceForActive = !isGroup && activeConv.otherUserId
    ? presence[String(activeConv.otherUserId)]
    : undefined;
  const otherUserOnline = !isGroup
    ? (wsPresenceForActive !== undefined ? wsPresenceForActive.online : Boolean(activeConv.isOnline))
    : false;
  const otherUserLastSeen = !isGroup
    ? (wsPresenceForActive !== undefined ? wsPresenceForActive.lastSeen : activeConv.lastSeen)
    : null;

  const rawTypingUsers = typingUsers[activeId] || {};
  const typingNames = Object.values(rawTypingUsers)
    .map((u) => u.username)
    .filter((name) => name && name !== me?.username);

  let typingText = "";
  if (typingNames.length === 1) {
    typingText = `${typingNames[0]} is typing...`;
  } else if (typingNames.length > 1) {
    typingText = `${typingNames.slice(0, 2).join(", ")} are typing...`;
  }

  return (
    <main
      className="flex flex-col bg-background overflow-hidden w-full relative"
      style={{ height: viewportHeight }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="relative z-30 flex h-14 items-center justify-between border-b border-border/30 px-3 select-none bg-sidebar/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-1 min-w-0">

          {/* Mobile Back Button — larger touch target */}
          <button
            type="button"
            onClick={() => setMobileView("list")}
            className="flex items-center gap-0.5 mr-1 rounded-xl text-accent hover:text-foreground transition-colors md:hidden no-tap-highlight -ml-1 px-1 py-2"
            aria-label="Back"
          >
            <ArrowLeft className="size-5" />
          </button>

          {/* Avatar — clickable to open group/dm info */}
          <button
            type="button"
            onClick={() => togglePanel("details")}
            className="flex items-center gap-2.5 min-w-0 hover:opacity-90 transition-opacity no-tap-highlight"
          >
            <Avatar src={activeConv.avatar} name={activeConv.title} size="md" />
            <div className="min-w-0 text-left">
              <h1 className="truncate text-[13.5px] font-semibold text-foreground tracking-tight leading-tight">
                {activeConv.title}
              </h1>
              <p className="truncate text-[11.5px] leading-tight mt-0.5">
                {typingText ? (
                  <span className="text-emerald-400 font-medium">{typingText}</span>
                ) : isGroup ? (
                  <span className="text-muted-foreground">
                    {activeConv.memberCount ? `${activeConv.memberCount} members` : "Group"}
                  </span>
                ) : (
                  <span className={cn(
                    "font-medium transition-colors duration-300",
                    otherUserOnline ? "text-emerald-400" : "text-muted-foreground"
                  )}>
                    {otherUserOnline ? "Online" : formatLastSeen(otherUserLastSeen) || "Offline"}
                  </span>
                )}
                {msgError && (
                  <span className="ml-1 text-destructive/80 text-[10px]">· Unavailable</span>
                )}
              </p>
            </div>
          </button>
        </div>

        {/* Header Action Three-Dot Menu (⋮) */}
        <ConversationHeaderMenu
          isGroup={isGroup}
          onToggleDetails={() => togglePanel("details")}
          onAddMember={() => setGroupAddMemberOpen(true)}
          onLeaveGroup={() => leaveGroupMut.mutate()}
        />
      </header>

      {/* ── Message Stream ───────────────────────────────────────────────── */}
      <MessageList
        key={activeId}
        messages={messages}
        loading={isLoading}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        meId={me?.id}
        isGroup={isGroup}
        onReply={(msg) =>
          setReply({ ...msg, senderName: msg.senderName || (msg.isMine ? "You" : "Unknown") })
        }
        onOpenActions={openContextMenu}
        onReact={(msg, emoji) => handleAction("react", msg, emoji)}
        onOpenReactionsDetail={(msg) => setReactionsDetailMsg(msg)}
      />

      {/* Sleek typing indicator bottom bar */}
      {typingText && (
        <div className="flex items-center gap-2 px-4 py-1 text-xs text-emerald-400/90 fc-fade-in select-none">
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="size-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="size-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
          <span className="italic font-medium text-[11px]">{typingText}</span>
        </div>
      )}

      {/* ── Composer ─────────────────────────────────────────────────────── */}
      <Composer
        onSend={(text, replyToId, fileUrl, fileName) => sendMut.mutate({ text, replyToId, fileUrl, fileName })}
        onEdit={(editing, newText) => editMut.mutate({ msg: editing, newText })}
        disabled={sendMut.isPending}
      />

      {/* ── Context Menu ─────────────────────────────────────────────────── */}
      {ctxMenu && (
        <MessageContextMenu
          message={ctxMenu.message}
          mine={ctxMenu.mine}
          anchor={ctxMenu.anchor}
          onAction={handleAction}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {/* ── Reactions Detail Modal ───────────────────────────────────────── */}
      {reactionsDetailMsg && (
        <ReactionsDetailModal
          message={reactionsDetailMsg}
          meId={me?.id}
          onRemoveReaction={(msg) => handleAction("remove-reaction", msg)}
          onClose={() => setReactionsDetailMsg(null)}
        />
      )}

      {/* ── Add Member Modal ────────────────────────────────────────────── */}
      <AddMemberModal
        activeId={activeId}
        open={groupAddMemberOpen}
        onOpenChange={setGroupAddMemberOpen}
      />
    </main>
  );
}
