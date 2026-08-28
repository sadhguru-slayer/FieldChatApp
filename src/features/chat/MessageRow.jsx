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
function Ticks({ delivered, read, mine }) {
  if (read) return <CheckCheck className="size-3.5 text-sky-300 drop-shadow-2xs font-bold shrink-0" />;
  if (delivered) return <CheckCheck className="size-3.5 text-white/85 shrink-0" />;
  return <Check className="size-3.5 text-white/85 shrink-0" />;
}

// ─── Reply Preview Bar ───────────────────────────────────────────────────────
function ReplyPreview({ replyTo, mine, onClick }) {
  if (!replyTo) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "mb-1.5 block w-full rounded-lg border-l-2 px-2.5 py-1 text-left text-[11px] transition-opacity hover:opacity-85",
        mine
          ? "border-white/60 bg-black/20 text-white/90"
          : "border-accent bg-background/50 text-foreground/80"
      )}
    >
      <span className={cn("block font-semibold text-[10.5px]", mine ? "text-white" : "text-accent")}>
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
        "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-all active:scale-95 shadow-2xs",
        reactedByMe
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-border/60 bg-elevated/80 text-muted-foreground hover:text-foreground hover:bg-elevated"
      )}
    >
      <span>{emoji}</span>
      {count > 1 && <span className="tabular-nums font-mono text-[10px]">{count}</span>}
    </button>
  );
}

// ─── System Message ───────────────────────────────────────────────────────────
function SystemMessage({ text }) {
  return (
    <div className="my-2.5 flex justify-center px-4">
      <span className="rounded-full bg-elevated/60 px-3.5 py-1 text-[11px] font-medium text-muted-foreground border border-border/40 select-none shadow-2xs">
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
  isActionActive,
  onToggleAction,
  onReply,
  onOpenActions,
  onReact,
  onOpenReactionsDetail,
  onJumpTo,
}) {
  const pressTimer = useRef(null);
  const isLongPressRef = useRef(false);

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
        <div className="flex items-center gap-1.5 max-w-[75%] rounded-2xl border border-dashed border-border/40 bg-surface/30 px-3.5 py-1.5 text-[11.5px] italic text-muted-foreground select-none">
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
    e.stopPropagation();
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    if (onToggleAction) {
      onToggleAction(m.id);
    }
  };

  return (
    <div
      id={`msg-${m.id}`}
      className={cn(
        "group/msg flex gap-2 px-3 py-0.5 md:px-4",
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
      <div className={cn("flex max-w-[80%] flex-col md:max-w-[65%]", mine && "items-end")}>
        {showName && !mine && isGroup && m.senderName && (
          <span className="mb-0.5 ml-1 text-[11px] font-semibold text-emerald-400">
            {m.senderName}
          </span>
        )}

        <div className="relative flex items-end gap-1">
          {/* Action button — left for my messages */}
          {mine && (
            <button
              type="button"
              aria-label="Actions"
              onClick={(e) => {
                e.stopPropagation();
                onOpenActions(m, e);
              }}
              className={cn(
                "size-6 place-items-center rounded-md text-muted-foreground/60 transition-all hover:text-foreground hover:bg-elevated",
                isActionActive ? "grid text-foreground bg-elevated border border-border/40" : "hidden group-hover/msg:grid"
              )}
            >
              <span className="text-[11px] leading-none">···</span>
            </button>
          )}

          {/* ── Bubble ── */}
          <div
            onClick={handleBubbleClick}
            className={cn(
              "relative rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed cursor-pointer select-none md:select-text shadow-2xs transition-all duration-150",
              mine
                ? "rounded-br-2xs bg-accent text-accent-foreground shadow-xs shadow-accent/20 font-normal"
                : "rounded-bl-2xs bg-elevated/90 text-foreground border border-border/50 font-normal",
              isActionActive && "ring-1.5 ring-accent/60 shadow-xs"
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
                "ml-2.5 inline-flex translate-y-[2px] items-center gap-1 text-[10px] tabular-nums float-right mt-1 font-mono",
                mine ? "text-accent-foreground/80 font-medium" : "text-muted-foreground/75"
              )}
            >
              {m.edited && <span className="italic opacity-70">edited</span>}
              {formatTime(m.createdAt)}
              {mine && <Ticks delivered={m.delivered} read={m.read} mine={mine} />}
            </span>
            <span className="block clear-both h-0" />
          </div>

          {/* Action button — right for incoming */}
          {!mine && (
            <button
              type="button"
              aria-label="Actions"
              onClick={(e) => {
                e.stopPropagation();
                onOpenActions(m, e);
              }}
              className={cn(
                "size-6 place-items-center rounded-md text-muted-foreground/60 transition-all hover:text-foreground hover:bg-elevated",
                isActionActive ? "grid text-foreground bg-elevated border border-border/40" : "hidden group-hover/msg:grid"
              )}
            >
              <span className="text-[11px] leading-none">···</span>
            </button>
          )}
        </div>

        {/* Reactions row */}
        {m.reactions?.length > 0 && (
          <div className={cn("mt-1 flex flex-wrap gap-1", mine ? "justify-end mr-0.5" : "ml-0.5")}>
            {m.reactions.map((r) => (
              <ReactionPill
                key={r.emoji}
                emoji={r.emoji}
                count={r.count}
                reactedByMe={r.reactedByMe}
                onClick={(e) => {
                  e.stopPropagation();
                  if (r.reactedByMe) {
                    // Direct tap on my own reaction removes it (WhatsApp style)
                    onReact(m, r.emoji);
                  } else if (onOpenReactionsDetail) {
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
