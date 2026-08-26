import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Copy, Info, MessageSquare, Pencil, Reply, Trash2 } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";
import { useAppStore } from "@/store/useAppStore";
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
} from "@/services/api";
import { cn } from "@/lib/utils";

// ─── Quick reactions ──────────────────────────────────────────────────────────
const QUICK_REACTIONS = ["👍", "❤️", "😂", "🔥", "🙏", "😮"];

// ─── Context Menu ─────────────────────────────────────────────────────────────
// Zinc monochrome design. Positions left-of-bubble for incoming, right for mine.
// Flips vertically if too close to the bottom.
function MessageContextMenu({ message, mine, anchor, onAction, onClose }) {
  if (!message || !anchor) return null;

  const MENU_W = 192;
  const MENU_H = 260;

  // Horizontal — stay on the same side as the bubble, clamp to viewport
  let left = mine
    ? Math.min(anchor.x, window.innerWidth - MENU_W - 8)
    : Math.max(8, anchor.x - MENU_W);
  left = Math.max(8, Math.min(left, window.innerWidth - MENU_W - 8));

  // Vertical — prefer below, flip up if needed
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />

      {/* Menu panel */}
      <div
        className="fixed z-[9999] overflow-hidden rounded-xl animate-in fade-in-0 zoom-in-95 duration-100"
        style={{
          top, left, width: MENU_W,
          background: "#1c2633",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
        }}
      >
        {/* Quick reactions strip */}
        <div
          className="flex items-center justify-between px-2.5 py-2"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          {QUICK_REACTIONS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => { onAction("react", message, e); onClose(); }}
              className="grid size-8 place-items-center rounded-lg text-[16px] transition-all hover:bg-white/10 hover:scale-110 active:scale-95"
            >
              {e}
            </button>
          ))}
        </div>

        {/* Action items — Lucide icons, zinc palette */}
        <div className="py-1">
          {items.map(({ id, label, Icon, danger }) => (
            <button
              key={id}
              type="button"
              onClick={() => { onAction(id, message); onClose(); }}
              className={cn(
                "flex w-full items-center gap-2.5 px-3.5 py-[9px] text-left text-[12.5px] transition-colors",
                danger
                  ? "text-red-400/80 hover:bg-red-500/8 hover:text-red-400"
                  : "text-[#b8c9d8] hover:bg-white/6 hover:text-[#e3e3e3]"
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

// ─── Empty State ──────────────────────────────────────────────────────────────
function NothingSelected() {
  return (
    <main className="flex h-full flex-1 flex-col items-center justify-center p-8 text-center select-none" style={{ background: "#0e1621" }}>
      <div className="mx-auto grid size-16 place-items-center rounded-3xl border mb-4" style={{ background: "#182533", borderColor: "rgba(255,255,255,0.07)" }}>
        <MessageSquare className="size-7" style={{ color: "rgba(93,138,168,0.5)" }} />
      </div>
      <h3 className="text-sm font-semibold" style={{ color: "rgba(227,227,227,0.7)" }}>
        Select a conversation
      </h3>
      <p className="mt-1.5 text-[12px] max-w-xs leading-relaxed" style={{ color: "rgba(93,138,168,0.8)" }}>
        Choose a group or direct message from the sidebar, or start a new one.
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
  markDelivered,
  markRead,
} from "@/services/ws";

import { ReactionsDetailModal } from "./ReactionsDetailModal";

// ─── ChatPane ─────────────────────────────────────────────────────────────────
export function ChatPane() {
  const activeId = useAppStore((s) => s.activeId);
  const togglePanel = useAppStore((s) => s.togglePanel);
  const setMobileView = useAppStore((s) => s.setMobileView);
  const setReply = useAppStore((s) => s.setReply);
  const setEditing = useAppStore((s) => s.setEditing);
  const typingUsers = useAppStore((s) => s.typingUsers);

  const qc = useQueryClient();
  const [ctxMenu, setCtxMenu] = useState(null);
  const [reactionsDetailMsg, setReactionsDetailMsg] = useState(null);

  useEffect(() => {
    if (activeId) {
      joinConversation(activeId);
      return () => {
        leaveConversation(activeId);
      };
    }
  }, [activeId]);

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe });
  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
  });

  const activeConv = conversations.find((c) => String(c.id) === String(activeId));

  const { data: msgData, isLoading, error: msgError } = useQuery({
    queryKey: ["messages", activeId],
    queryFn: () => getMessages({ conversationId: activeId }),
    enabled: !!activeId,
    staleTime: 10000,
  });

  // Automatically acknowledge delivery and read status for incoming messages
  useEffect(() => {
    if (activeId && msgData?.items?.length) {
      msgData.items.forEach((msg) => {
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

  // ── Mutations ─────────────────────────────────────────────────────────────
  const sendMut = useMutation({
    mutationFn: async ({ text, replyToId }) => {
      const sent = wsCreateMessage(activeId, text, replyToId);
      if (!sent) {
        return sendMessage({ conversationId: activeId, text, replyToId });
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

  // ── Action handler ────────────────────────────────────────────────────────
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
      const alreadyReacted = msg.reactions?.find((r) => r.emoji === emoji && r.reactedByMe);
      if (alreadyReacted) {
        removeReaction({ conversationId: activeId, messageId: msg.id })
          .catch((e) => toast.error(e.message));
      } else {
        reactM.mutate({ msg, emoji });
      }
    }
  };

  // ── Open context menu, using button position as anchor ───────────────────
  const openContextMenu = (msg, e) => {
    const rect = e?.currentTarget?.getBoundingClientRect?.();
    const isMine = msg.isMine || msg.senderId === me?.id;
    const anchor = rect
      ? {
        // For outgoing messages, anchor right edge; for incoming, left edge
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
  const messages = msgData?.items || [];

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
    <main className="flex h-full flex-1 flex-col" style={{ background: "#0e1621" }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header
        className="flex h-14 items-center justify-between border-b px-4 select-none"
        style={{ background: "#17212b", borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileView("list")}
            className="grid size-8 place-items-center rounded-lg transition-colors md:hidden"
            style={{ color: "#8a9baf" }}
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </button>

          <Avatar src={activeConv.avatar} name={activeConv.title} size="md" />

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[14px] font-semibold" style={{ color: "#e3e3e3" }}>
              {activeConv.title}
            </h1>
            <p className="truncate text-[11px]" style={{ color: "#5d8aa8" }}>
              {typingText ? (
                <span className="text-sky-400 font-medium animate-pulse">{typingText}</span>
              ) : (
                isGroup ? "Group" : "Direct Message"
              )}
              {msgError && (
                <span className="ml-2 text-red-400/70 text-[10px]">
                  · Messages unavailable
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => togglePanel("details")}
          aria-label="Details"
          className="grid size-8 place-items-center rounded-lg transition-colors"
          style={{ color: "#5d8aa8" }}
        >
          <Info className="size-4" />
        </button>
      </header>

      {/* ── Message Stream ───────────────────────────────────────────────── */}
      <MessageList
        messages={messages}
        loading={isLoading}
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
        <div className="flex items-center gap-2 px-4 py-1 text-xs text-sky-400/90 animate-in fade-in duration-200 select-none">
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="size-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="size-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
          <span className="italic font-medium">{typingText}</span>
        </div>
      )}

      {/* ── Composer ─────────────────────────────────────────────────────── */}
      <Composer
        onSend={(text, replyToId) => sendMut.mutate({ text, replyToId })}
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
          onClose={() => setReactionsDetailMsg(null)}
        />
      )}
    </main>
  );
}
