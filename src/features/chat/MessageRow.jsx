import { memo, useState, useRef } from "react";
import {
  Check,
  CheckCheck,
  Copy,
  Pencil,
  Reply,
  Trash2,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

// ─── Delivery Ticks ──────────────────────────────────────────────────────────
function Ticks({ delivered, read }) {
  if (read) return <CheckCheck className="size-3 text-sky-400/80" />;
  if (delivered) return <CheckCheck className="size-3 opacity-40" />;
  return <Check className="size-3 opacity-40" />;
}

// ─── Reply Preview Bar ───────────────────────────────────────────────────────
function ReplyPreview({ replyTo, mine, onClick }) {
  if (!replyTo) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "mb-1.5 block w-full rounded-md border-l-[3px] px-2.5 py-1.5 text-left text-[11px] transition-opacity hover:opacity-80",
        mine
          ? "border-white/50 bg-black/15 text-white/75"
          : "border-[#5d8aa8] bg-white/5 text-white/70"
      )}
    >
      <span className={cn("block font-semibold text-[11px]", mine ? "text-white/90" : "text-[#5d8aa8]")}>
        {replyTo.senderName || "Unknown"}
      </span>
      <span className="line-clamp-1 opacity-80">
        {replyTo.isDeleted ? "Message unavailable" : replyTo.text}
      </span>
    </button>
  );
}

// ─── Reaction Pill ───────────────────────────────────────────────────────────
function ReactionPill({ emoji, count, reactedByMe, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] transition-all active:scale-95",
        reactedByMe
          ? "border-[#5d8aa8]/50 bg-[#5d8aa8]/15 text-[#8ab4d0]"
          : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
      )}
    >
      <span>{emoji}</span>
      {count > 1 && <span className="tabular-nums">{count}</span>}
    </button>
  );
}

// ─── System Message ───────────────────────────────────────────────────────────
function SystemMessage({ text }) {
  return (
    <div className="my-2 flex justify-center px-4">
      <span
        className="rounded-full px-3 py-1 text-[11px] text-white/40 select-none"
        style={{ background: "rgba(255,255,255,0.05)" }}
      >
        {text}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function MessageRowBase({
  message: m,
  mine,
  isGroup,
  showAvatar,
  showName,
  onReply,
  onOpenActions,
  onReact,
  onOpenReactionsDetail,
  onJumpTo,
}) {
  const pressTimer = useRef(null);
  const isLongPressRef = useRef(false);
  const [showMobileActions, setShowMobileActions] = useState(false);

  // ── SYSTEM type — render as chip, no context menu ────────────────────────
  if (m.type === "SYSTEM") {
    return <SystemMessage id={`msg-${m.id}`} text={m.text} />;
  }

  // ── Deleted-for-everyone stub ─────────────────────────────────────────────
  if (m.deletedForEveryone) {
    return (
      <div
        id={`msg-${m.id}`}
        className={cn("flex px-4 py-0.5", mine ? "justify-end" : "justify-start")}
      >
        <div
          className="flex items-center gap-1.5 max-w-[70%] rounded-2xl px-3.5 py-1.5 text-[12px] italic select-none"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.3)" }}
        >
          Message removed
        </div>
      </div>
    );
  }

  const startPress = (e) => {
    isLongPressRef.current = false;
    pressTimer.current = setTimeout(() => {
      isLongPressRef.current = true;
      onOpenActions(m, e);
    }, 450);
  };

  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const handleBubbleClick = (e) => {
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    // Single tap on mobile/touch toggles the 3-dots action button
    setShowMobileActions((prev) => !prev);
  };

  return (
    <div
      id={`msg-${m.id}`}
      className={cn(
        "group/msg flex gap-2 px-3 py-px md:px-4",
        mine ? "justify-end" : "justify-start"
      )}
      onDoubleClick={() => onReply(m)}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchMove={cancelPress}
    >
      {/* ── Left avatar slot (groups, incoming) ── */}
      {!mine && isGroup && (
        <div className="w-7 shrink-0 self-end mb-[2px]">
          {showAvatar ? (
            <Avatar src={null} name={m.senderName || "?"} size="sm" />
          ) : (
            <span className="block w-7" />
          )}
        </div>
      )}

      {/* ── Bubble column ── */}
      <div className={cn("flex max-w-[78%] flex-col md:max-w-[62%]", mine && "items-end")}>
        {showName && !mine && isGroup && m.senderName && (
          <span className="mb-0.5 ml-1 text-[11px] font-semibold text-teal-400">
            {m.senderName}
          </span>
        )}

        <div className="relative flex items-end gap-1">
          {/* Action button — left for my messages */}
          {mine && (
            <button
              type="button"
              aria-label="Actions"
              onClick={(e) => onOpenActions(m, e)}
              className={cn(
                "size-6 place-items-center rounded-md text-white/30 transition-opacity hover:text-white/80",
                showMobileActions ? "grid text-white/80 bg-white/10" : "hidden group-hover/msg:grid"
              )}
            >
              <span className="text-[11px] leading-none">···</span>
            </button>
          )}

          {/* ── Bubble ── */}
          <div
            onClick={handleBubbleClick}
            className={cn(
              "relative rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed cursor-pointer select-none md:select-text",
              mine
                ? "rounded-br-[4px] bg-[#2b5278] text-white"
                : "rounded-bl-[4px] bg-[#182533] text-[#e3e3e3] border border-white/[0.06]"
            )}
          >
            {m.replyTo && (
              <ReplyPreview
                replyTo={m.replyTo}
                mine={mine}
                onClick={(e) => {
                  e.stopPropagation();
                  onJumpTo(m.replyTo.id);
                }}
              />
            )}

            <span className="break-words whitespace-pre-wrap">{m.text}</span>

            {/* Inline meta — time + ticks */}
            <span
              className={cn(
                "ml-2 inline-flex translate-y-[2px] items-center gap-1 text-[10px] tabular-nums float-right mt-1",
                mine ? "text-white/45" : "text-white/30"
              )}
            >
              {m.edited && <span className="italic opacity-70">edited</span>}
              {formatTime(m.createdAt)}
              {mine && <Ticks delivered={m.delivered} read={m.read} />}
            </span>
            <span className="block clear-both h-0" />
          </div>

          {/* Action button — right for incoming */}
          {!mine && (
            <button
              type="button"
              aria-label="Actions"
              onClick={(e) => onOpenActions(m, e)}
              className={cn(
                "size-6 place-items-center rounded-md text-white/30 transition-opacity hover:text-white/80",
                showMobileActions ? "grid text-white/80 bg-white/10" : "hidden group-hover/msg:grid"
              )}
            >
              <span className="text-[11px] leading-none">···</span>
            </button>
          )}
        </div>

        {/* Reactions row */}
        {m.reactions?.length > 0 && (
          <div className={cn("mt-1 flex flex-wrap gap-1", mine ? "justify-end mr-1" : "ml-1")}>
            {m.reactions.map((r) => (
              <ReactionPill
                key={r.emoji}
                emoji={r.emoji}
                count={r.count}
                reactedByMe={r.reactedByMe}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenReactionsDetail) {
                    onOpenReactionsDetail(m);
                  } else if (onReact) {
                    onReact(m, r.emoji);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const MessageRow = memo(MessageRowBase);
