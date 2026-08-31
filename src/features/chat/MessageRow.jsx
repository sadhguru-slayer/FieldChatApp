import { memo, useState, useRef } from "react";
import {
  Check,
  CheckCheck,
  Copy,
  Pencil,
  Reply,
  Trash2,
  Paperclip,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

// ─── Delivery Ticks ────────────────────────────────────────────────────────
function Ticks({ delivered, read, mine }) {
  if (read) {
    return (
      <span className="inline-flex items-center justify-center rounded-full bg-white/20 p-[2px] border border-white/30 shrink-0 select-none">
        <CheckCheck className="size-2.5 text-white font-extrabold" />
      </span>
    );
  }
  if (delivered) {
    return (
      <span className="inline-flex items-center justify-center rounded-full bg-white/5 p-[2px] border border-white/15 shrink-0 select-none">
        <CheckCheck className="size-2.5 text-white/50" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center rounded-full bg-white/5 p-[2px] border border-white/10 shrink-0 select-none">
      <Check className="size-2.5 text-white/50" />
    </span>
  );
}

// ─── Reply Preview Bar ───────────────────────────────────────────────────────
function ReplyPreview({ replyTo, mine, onClick }) {
  if (!replyTo) return null;
  
  // Use display_name if available, otherwise fall back to senderName
  const displayName = replyTo.display_name || replyTo.senderName || "Unknown";
  
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
        {displayName}
      </span>
      <span className="line-clamp-1 opacity-80">
        {replyTo.isDeleted ? "Message unavailable" : replyTo.text}
      </span>
    </button>
  );
}

// ─── Reaction Pill ────────────────────────────────────────────────────────
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

// ─── System Message ────────────────────────────────────────────────────────
function SystemMessage({ text }) {
  return (
    <div className="my-2.5 flex justify-center px-4">
      <span className="rounded-full bg-elevated/60 px-3.5 py-1 text-[11px] font-medium text-muted-foreground border border-border/40 select-none shadow-2xs">
        {text}
      </span>
    </div>
  );
}

// ─── Media Attachment Rendering ──────────────────────────────────────────────
function getFullMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  
  const storageUrl = import.meta.env.VITE_STORAGE_URL;
  if (storageUrl) {
    return `${storageUrl.replace(/\/$/, "")}${url}`;
  }
  
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:9000${url}`;
  }
  return `http://localhost:9000${url}`;
}

function MediaAttachment({ mediaUrl, mediaName, mine }) {
  const isImage = /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(mediaName || mediaUrl || "");
  if (isImage) return null; // Handled directly in bubble code for premium look
  const fullUrl = getFullMediaUrl(mediaUrl);

  return (
    <div className="mb-1.5">
      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "flex items-center gap-2.5 rounded-xl border p-2.5 transition-all hover:bg-white/5",
          mine
            ? "bg-black/15 border-white/10 text-white"
            : "bg-surface border-border text-foreground"
        )}
      >
        <div className={cn("grid size-9 place-items-center rounded-lg shrink-0", mine ? "bg-white/10" : "bg-elevated")}>
          <Paperclip className="size-4.5" />
        </div>
        <div className="min-w-0 flex-1 pr-2">
          <p className="text-[11.5px] font-semibold truncate leading-tight">
            {mediaName || "Attachment"}
          </p>
          <p className="text-[9.5px] opacity-75 mt-0.5">
            Click to view / download
          </p>
        </div>
      </a>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
function MessageRowBase({
  message: m,
  mine,
  isGroup,
  showAvatar,
  showName,
  prevSameGroup = false,
  nextSameGroup = false,
  isActionActive,
  onToggleAction,
  onReply,
  onOpenActions,
  onReact,
  onOpenReactionsDetail,
  onJumpTo,
  onMediaClick,
}) {
  const pressTimer = useRef(null);
  const isLongPressRef = useRef(false);

  const getBubbleRadiusClass = () => {
    if (mine) {
      if (prevSameGroup && nextSameGroup) return "rounded-2xl";
      if (nextSameGroup && !prevSameGroup) return "rounded-2xl rounded-tr-md";
      if (prevSameGroup && !nextSameGroup) return "rounded-2xl rounded-br-md";
      return "rounded-2xl rounded-br-md";
    } else {
      if (prevSameGroup && nextSameGroup) return "rounded-2xl";
      if (nextSameGroup && !prevSameGroup) return "rounded-2xl rounded-tl-md";
      if (prevSameGroup && !nextSameGroup) return "rounded-2xl rounded-bl-md";
      return "rounded-2xl rounded-tl-md";
    }
  };

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

  // Use display_name if available, otherwise fall back to senderName
  const senderDisplayName = m.display_name || m.senderName || "?";

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
            <Avatar src={null} name={senderDisplayName} size="sm" />
          ) : (
            <span className="block w-7" />
          )}
        </div>
      )}

      {/* ── Bubble column ── */}
      <div className={cn("flex max-w-[80%] flex-col md:max-w-[65%]", mine && "items-end")}>
        {showName && !mine && isGroup && senderDisplayName && (
          <span className="mb-0.5 ml-1 text-[10px] font-semibold text-zinc-400">
            {senderDisplayName}
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
          {(() => {
            const isImageMedia = m.mediaUrl && /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(m.mediaName || m.mediaUrl || "");
            const isMediaOnly = isImageMedia && !m.text && !m.replyTo;
            const isMediaWithText = isImageMedia && m.text;

            if (isMediaOnly) {
              return (
                <div
                  onClick={handleBubbleClick}
                  className={cn(
                    "relative overflow-hidden cursor-pointer select-none md:select-text shadow-sm transition-all duration-150 rounded-2xl max-w-[280px] sm:max-w-xs",
                    getBubbleRadiusClass(),
                    isActionActive && "ring-1.5 ring-accent/60 shadow-xs"
                  )}
                >
                  <img
                    src={getFullMediaUrl(m.mediaUrl)}
                    alt={m.mediaName || "Image attachment"}
                    loading="lazy"
                    className="max-h-[340px] w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onMediaClick) {
                        onMediaClick(m);
                      } else {
                        window.open(getFullMediaUrl(m.mediaUrl), "_blank");
                      }
                    }}
                  />
                  {/* Overlay meta */}
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 text-white/90 text-[10px] flex items-center gap-1 backdrop-blur-xs font-mono select-none">
                    {m.edited && <span className="italic opacity-70 text-[9px]">edited</span>}
                    {formatTime(m.createdAt)}
                    {mine && <Ticks delivered={m.delivered} read={m.read} mine={mine} />}
                  </div>
                </div>
              );
            }

            if (isMediaWithText) {
              return (
                <div
                  onClick={handleBubbleClick}
                  className={cn(
                    "relative text-xs leading-relaxed cursor-pointer select-none md:select-text shadow-md transition-all duration-150 p-0 overflow-hidden max-w-[280px] sm:max-w-xs",
                    mine
                      ? "bg-accent/80 text-white font-normal"
                      : "bg-zinc-800/40 text-zinc-300 border border-zinc-800/30 font-normal",
                    getBubbleRadiusClass(),
                    isActionActive && "ring-1.5 ring-accent/60 shadow-xs"
                  )}
                >
                  <div className="relative w-full overflow-hidden">
                    <img
                      src={getFullMediaUrl(m.mediaUrl)}
                      alt={m.mediaName || "Image attachment"}
                      loading="lazy"
                      className="max-h-[260px] w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onMediaClick) {
                          onMediaClick(m);
                        } else {
                          window.open(getFullMediaUrl(m.mediaUrl), "_blank");
                        }
                      }}
                    />
                  </div>
                  <div className="px-3.5 pb-2.5 pt-2 text-[13px] leading-[17px]">
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
                    
                    {/* Inline meta */}
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
                </div>
              );
            }

            // Standard layout for text or file attachment
            return (
              <div
                onClick={handleBubbleClick}
                className={cn(
                  "relative px-3.5 py-2 text-xs leading-relaxed cursor-pointer select-none md:select-text shadow-md transition-all duration-150 max-w-[280px] sm:max-w-xs",
                  mine
                    ? "bg-accent/80 text-white font-normal"
                    : "bg-zinc-800/40 text-zinc-300 border border-zinc-800/30 font-normal",
                  getBubbleRadiusClass(),
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

                {m.mediaUrl && (
                  <MediaAttachment
                    mediaUrl={m.mediaUrl}
                    mediaName={m.mediaName}
                    mine={mine}
                  />
                )}

                {m.text && <span className="break-words whitespace-pre-wrap">{m.text}</span>}

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
            );
          })()}

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
