import { useEffect, useRef, useState } from "react";
import { Paperclip, SendHorizonal, Smile } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

const EMOJIS = [
  "😀","😂","🙌","🔥","❤️","👍","🎉","😅","🤔","🙏","✅","👀","😎","🤝","💯","😊",
];

import { sendTyping } from "@/services/ws";

const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
};

export function Composer({ onSend, onEdit }) {
  const queryClient = useQueryClient();
  const activeId = useAppStore((s) => s.activeId);
  const reply = useAppStore((s) => s.reply);
  const setReply = useAppStore((s) => s.setReply);
  const editing = useAppStore((s) => s.editing);
  const setEditing = useAppStore((s) => s.setEditing);

  const [text, setText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const ref = useRef(null);
  const lastTypingTimeRef = useRef(0);

  const handleChange = (e) => {
    setText(e.target.value);
    if (activeId) {
      const now = Date.now();
      if (now - lastTypingTimeRef.current > 1500) {
        lastTypingTimeRef.current = now;
        sendTyping(activeId);
      }
    }
  };

  // Pre-fill text when entering edit mode
  useEffect(() => {
    if (editing) {
      setText(editing.text || "");
      ref.current?.focus();
    }
  }, [editing]);

  // Focus when reply is set
  useEffect(() => {
    if (reply) ref.current?.focus();
  }, [reply]);

  // Auto-resize textarea smoothly without collapsing layout
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const newHeight = Math.min(el.scrollHeight, 140);
    el.style.height = `${newHeight}px`;
  }, [text]);

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    if (editing) {
      onEdit(editing, value);
    } else {
      // Optimistic instant sound cues on enter/send click
      const settings = queryClient.getQueryData(["settings"]);
      const soundEnabled = settings?.sound_enabled ?? true;
      if (soundEnabled) {
        try {
          const audio = new Audio("/pop.mp3");
          audio.volume = 0.4;
          audio.play().catch((err) => console.debug("[Audio] Play prevented:", err));
        } catch (err) {
          console.warn("[Audio] Error playing pop sound:", err);
        }
      }
      onSend(value, reply?.id ?? null);
    }
    setText("");
    setReply(null);
    setEditing(null);
    setEmojiOpen(false);
    lastTypingTimeRef.current = 0;

    // Immediately keep focus on input so keyboard stays open on both mobile & PC
    requestAnimationFrame(() => {
      ref.current?.focus();
    });
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      const isMobile = isMobileDevice();
      if (isMobile) {
        // Mobile: Enter key creates a new line (default behavior). Sending is via Send button.
        return;
      }
      // PC: Enter = send, Shift + Enter = new line
      if (!e.shiftKey) {
        e.preventDefault();
        submit();
      }
    }
    if (e.key === "Escape") {
      setReply(null);
      setEditing(null);
      setText("");
    }
  };

  const canSend = text.trim().length > 0;

  // Which context is active?
  const context = editing
    ? { label: "Editing", preview: editing.text, clear: () => { setEditing(null); setText(""); } }
    : reply
    ? { label: reply.senderName ? `Reply to ${reply.senderName}` : "Replying", preview: reply.text, clear: () => setReply(null) }
    : null;

  const preventFocusLoss = (e) => {
    e.preventDefault();
  };

  return (
    <div
      className="border-t border-border/40 bg-surface px-2.5 py-2 md:px-4 shrink-0 select-none"
      style={{
        paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {/* Reply / Edit banner */}
      {context && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border-l-2 border-accent bg-elevated/70 px-3 py-1.5 shadow-2xs">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">
              {context.label}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {context.preview}
            </p>
          </div>
          <button
            type="button"
            onMouseDown={preventFocusLoss}
            onTouchStart={preventFocusLoss}
            onClick={context.clear}
            aria-label="Cancel"
            className="shrink-0 text-base leading-none text-muted-foreground transition-colors hover:text-foreground opacity-60 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}

      {/* Emoji Picker */}
      {emojiOpen && (
        <div className="mb-2 flex flex-wrap gap-1 rounded-xl border border-border/60 bg-surface p-2 shadow-xl fc-scale-in">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onMouseDown={preventFocusLoss}
              onTouchStart={preventFocusLoss}
              onClick={() => {
                setText((t) => t + e);
                ref.current?.focus();
              }}
              className="grid size-8 place-items-center rounded-lg text-base transition-all hover:bg-elevated hover:scale-110 active:scale-95"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-1.5 rounded-2xl border border-border/50 bg-elevated/60 px-2 py-1 transition-all focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/30">
        {/* Emoji */}
        <button
          type="button"
          aria-label="Emoji"
          onMouseDown={preventFocusLoss}
          onTouchStart={preventFocusLoss}
          onClick={() => setEmojiOpen((v) => !v)}
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl transition-colors mb-0.5 no-tap-highlight",
            emojiOpen
              ? "text-accent bg-accent/15"
              : "text-muted-foreground hover:text-foreground hover:bg-surface/60"
          )}
        >
          <Smile className="size-5" />
        </button>

        {/* Attach */}
        <button
          type="button"
          aria-label="Attach"
          onMouseDown={preventFocusLoss}
          onTouchStart={preventFocusLoss}
          className="grid size-9 shrink-0 place-items-center rounded-xl transition-colors text-muted-foreground hover:text-foreground hover:bg-surface/60 mb-0.5 no-tap-highlight"
        >
          <Paperclip className="size-5" />
        </button>

        {/* Textarea — NEVER disabled so keyboard never collapses */}
        <textarea
          ref={ref}
          rows={1}
          value={text}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          onFocus={() => {
            if (activeId) {
              const el = document.getElementById("message-list-bottom");
              el?.scrollIntoView({ behavior: "smooth" });
            }
          }}
          placeholder={editing ? "Edit message..." : reply ? `Reply...` : "Message..."}
          className="scroll-slim max-h-28 md:max-h-36 flex-1 resize-none bg-transparent py-2 text-[15px] md:text-[13px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60"
        />

        {/* Send */}
        <button
          type="button"
          onMouseDown={preventFocusLoss}
          onTouchStart={preventFocusLoss}
          onClick={submit}
          disabled={!canSend}
          aria-label="Send"
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl text-accent-foreground transition-all disabled:opacity-30 active:scale-95 mb-0.5 shadow-xs no-tap-highlight",
            canSend
              ? "bg-accent hover:opacity-90 shadow-accent/25"
              : "bg-muted/50 text-muted-foreground"
          )}
        >
          <SendHorizonal className="size-5" />
        </button>
      </div>
    </div>
  );
}
