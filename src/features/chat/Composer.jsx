import { useEffect, useRef, useState } from "react";
import { Paperclip, SendHorizonal, Smile } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

const EMOJIS = [
  "😀","😂","🙌","🔥","❤️","👍","🎉","😅","🤔","🙏","✅","👀","😎","🤝","💯","😊",
];

import { sendTyping } from "@/services/ws";

export function Composer({ onSend, onEdit, disabled }) {
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

  // Auto-resize textarea
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 152) + "px";
  }, [text]);

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    if (editing) {
      onEdit(editing, value);
    } else {
      onSend(value, reply?.id ?? null);
    }
    setText("");
    setReply(null);
    setEditing(null);
    setEmojiOpen(false);
    lastTypingTimeRef.current = 0;
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
    if (e.key === "Escape") {
      setReply(null);
      setEditing(null);
      setText("");
    }
  };

  const canSend = text.trim().length > 0 && !disabled;

  // Which context is active?
  const context = editing
    ? { label: "Editing", preview: editing.text, clear: () => { setEditing(null); setText(""); } }
    : reply
    ? { label: reply.senderName ? `Reply to ${reply.senderName}` : "Replying", preview: reply.text, clear: () => setReply(null) }
    : null;

  return (
    <div
      className="border-t px-2.5 pb-2 pt-2 md:px-4 shrink-0"
      style={{
        background: "#17212b",
        borderColor: "rgba(255,255,255,0.07)",
        paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {/* Reply / Edit banner — no icons, pure text */}
      {context && (
        <div
          className="mb-1.5 flex items-center gap-2 rounded-lg px-3 py-1.5"
          style={{ borderLeft: "2px solid #5d8aa8", background: "rgba(93,138,168,0.08)" }}
        >
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#5d8aa8" }}>
              {context.label}
            </p>
            <p className="truncate text-[12px]" style={{ color: "rgba(227,227,227,0.5)" }}>
              {context.preview}
            </p>
          </div>
          <button
            type="button"
            onClick={context.clear}
            aria-label="Cancel"
            className="shrink-0 text-[18px] leading-none transition-opacity hover:opacity-100 opacity-40"
            style={{ color: "#e3e3e3" }}
          >
            ×
          </button>
        </div>
      )}

      {/* Emoji Picker */}
      {emojiOpen && (
        <div
          className="mb-2 flex flex-wrap gap-1 rounded-xl p-2"
          style={{
            background: "#1c2633",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          }}
        >
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                setText((t) => t + e);
                ref.current?.focus();
              }}
              className="grid size-8 place-items-center rounded-lg text-base transition-all hover:bg-white/10 hover:scale-110 active:scale-95"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div
        className="flex items-end gap-1 rounded-2xl px-2 py-1 transition-all focus-within:ring-1"
        style={{
          background: "#1c2633",
          border: "1px solid rgba(255,255,255,0.07)",
          "--tw-ring-color": "rgba(93,138,168,0.35)",
        }}
      >
        {/* Emoji */}
        <button
          type="button"
          aria-label="Emoji"
          onClick={() => setEmojiOpen((v) => !v)}
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-lg transition-colors mb-0.5",
            emojiOpen
              ? "text-[#5d8aa8] bg-white/8"
              : "text-[#4a6b82] hover:text-[#7aabcb] hover:bg-white/6"
          )}
        >
          <Smile className="size-[18px]" />
        </button>

        {/* Attach */}
        <button
          type="button"
          aria-label="Attach"
          className="grid size-8 shrink-0 place-items-center rounded-lg transition-colors text-[#4a6b82] hover:text-[#7aabcb] hover:bg-white/6 mb-0.5"
        >
          <Paperclip className="size-[18px]" />
        </button>

        {/* Textarea — text-[16px] on mobile prevents iOS automatic zoom */}
        <textarea
          ref={ref}
          rows={1}
          value={text}
          disabled={disabled}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          placeholder={editing ? "Edit message..." : reply ? `Reply...` : "Message..."}
          className="scroll-slim max-h-28 md:max-h-36 flex-1 resize-none bg-transparent py-1.5 text-[16px] md:text-[13px] leading-relaxed outline-none placeholder:text-[#4a6b82]"
          style={{ color: "#e3e3e3" }}
        />

        {/* Send */}
        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          aria-label="Send"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-white transition-all disabled:opacity-25 active:scale-90 mb-0.5"
          style={{ background: canSend ? "#5d8aa8" : "rgba(93,138,168,0.2)" }}
        >
          <SendHorizonal className="size-[17px]" />
        </button>
      </div>
    </div>
  );
}
