import { memo, useState, useRef, useEffect } from "react";
import {
  Check,
  CheckCheck,
  Clock,
  Reply,
  Paperclip,
  Play,
  FileText,
  Download,
  MoreHorizontal,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { formatTime } from "@/lib/format";
import { cn, getFullMediaUrl } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { FormattedMessageText } from "@/components/FormattedMessageText";
import { LinkPreview } from "@/components/LinkPreview";
import { renderPdfPage1Thumbnail } from "@/lib/pdfThumbnail";
import { LazyGif } from "./LazyGif";

// ─── Delivery Ticks ────────────────────────────────────────────────────────
function Ticks({ delivered, read, mine, status }) {
  if (status === "sending" || status === "offline") {
    return (
      <span
        className="inline-flex items-center justify-center rounded-full bg-white/10 p-[2px] border border-white/15 shrink-0 select-none"
        title={status === "offline" ? "Queued offline" : "Sending..."}
      >
        <Clock className={cn("size-2.5 text-white/70", status === "sending" && "animate-pulse")} />
      </span>
    );
  }
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

  const displayName = replyTo.display_name || replyTo.senderName || "Unknown";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "mb-1.5 flex w-full items-stretch overflow-hidden rounded-xl text-left text-[11px] transition-all active:opacity-75 select-none",
        mine ? "bg-black/25 hover:bg-black/35 text-white" : "bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200"
      )}
    >
      <span
        className={cn(
          "w-[3px] shrink-0 rounded-l-xl",
          mine ? "bg-white/80" : "bg-accent"
        )}
      />
      <span className="flex flex-col px-2.5 py-1.5 min-w-0">
        <span className={cn("block font-bold text-[10.5px] leading-tight truncate", mine ? "text-white" : "text-accent")}>
          {displayName}
        </span>
        <span className="mt-0.5 line-clamp-1 text-[11px] leading-snug opacity-75">
          {replyTo.isDeleted ? <span className="italic">Message unavailable</span> : replyTo.text}
        </span>
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
        "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-all active:scale-95 shadow-2xs select-none",
        reactedByMe
          ? "border-accent/40 bg-accent/15 text-accent"
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
function PdfAttachmentPreview({ mediaUrl, mediaName, mine, onPdfClick }) {
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const fullUrl = getFullMediaUrl(mediaUrl);

  useEffect(() => {
    let active = true;
    if (fullUrl) {
      renderPdfPage1Thumbnail(fullUrl).then((thumb) => {
        if (active && thumb) setThumbnailUrl(thumb);
      });
    }
    return () => {
      active = false;
    };
  }, [fullUrl]);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (onPdfClick) {
          onPdfClick({ mediaUrl, mediaName });
        } else {
          window.open(fullUrl, "_blank");
        }
      }}
      className={cn(
        "mb-1.5 w-full max-w-sm rounded-xl overflow-hidden border transition-all select-none cursor-pointer group/pdf shadow-sm",
        mine
          ? "bg-black/30 border-white/15 hover:bg-black/40 text-white"
          : "bg-surface border-border/60 hover:bg-elevated/70 text-foreground"
      )}
    >
      {/* Page 1 Static Thumbnail Preview (Half height) */}
      {thumbnailUrl ? (
        <div className="relative w-full h-24 sm:h-28 bg-zinc-950/80 overflow-hidden flex items-start justify-center border-b border-white/10">
          <img
            src={thumbnailUrl}
            alt="PDF Page 1"
            loading="lazy"
            className="w-full h-full object-cover object-top bg-white transition-transform duration-300 group-hover/pdf:scale-[1.02]"
          />
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-white font-mono font-bold text-[9px] border border-white/10 shadow-xs">
            PAGE 1
          </div>
        </div>
      ) : (
        <div className="w-full h-16 bg-zinc-900/40 flex flex-col items-center justify-center gap-1 border-b border-white/10">
          <FileText className="size-5 text-red-400 opacity-80" />
          <span className="text-[10px] text-muted-foreground font-mono">PDF Document</span>
        </div>
      )}

      {/* WhatsApp-style Red PDF Footer Badge */}
      <div className="p-2 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="relative grid size-8.5 place-items-center rounded-lg bg-red-500/20 border border-red-500/30 text-red-500 shrink-0">
            <FileText className="size-4" />
            <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded bg-red-600 text-[7.5px] font-extrabold uppercase text-white font-mono leading-none shadow-xs">
              PDF
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate leading-tight group-hover/pdf:underline">
              {mediaName || "Document.pdf"}
            </p>
            <p className="text-[10px] opacity-75 mt-0.5 font-medium">
              Click to view full PDF
            </p>
          </div>
        </div>

        <a
          href={fullUrl}
          download={mediaName || "document.pdf"}
          onClick={(e) => e.stopPropagation()}
          className="grid size-7 place-items-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 shrink-0"
          title="Download PDF"
        >
          <Download className="size-3.5" />
        </a>
      </div>
    </div>
  );
}

function MediaAttachment({ mediaUrl, mediaName, mine, onPdfClick }) {
  const isImage = /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(mediaName || mediaUrl || "");
  const isVideo = /\.(mp4|webm|ogg|mov|m4v)$/i.test(mediaName || mediaUrl || "");
  const isGif = (mediaName && mediaName.startsWith("[GIF]")) || /\.gif$/i.test(mediaName || mediaUrl || "");
  if (isImage || isVideo || isGif) return null; // Handled directly in bubble code for edge-to-edge look

  const isPdf = /\.pdf$/i.test(mediaName || mediaUrl || "");
  const fullUrl = getFullMediaUrl(mediaUrl);

  if (isPdf) {
    return (
      <PdfAttachmentPreview
        mediaUrl={mediaUrl}
        mediaName={mediaName}
        mine={mine}
        onPdfClick={onPdfClick}
      />
    );
  }

  // ── Generic File Attachment ──
  return (
    <div className="mb-1 w-full min-w-[190px]">
      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "flex items-center gap-2.5 rounded-xl border p-2.5 transition-all hover:bg-white/5 select-none",
          mine
            ? "bg-black/20 border-white/10 text-white"
            : "bg-surface border-border text-foreground shadow-2xs"
        )}
      >
        <div className={cn("grid size-9 place-items-center rounded-lg shrink-0", mine ? "bg-white/10" : "bg-elevated")}>
          <Paperclip className="size-4" />
        </div>
        <div className="min-w-0 flex-1 pr-1">
          <p className="text-[12px] font-semibold truncate leading-tight">
            {mediaName || "Attachment"}
          </p>
          <p className="text-[9.5px] opacity-75 mt-0.5">
            Click to view / download
          </p>
        </div>
        <div className={cn("grid size-7 place-items-center rounded-md shrink-0", mine ? "text-white/80" : "text-muted-foreground")}>
          <Download className="size-3.5" />
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
  onPdfClick,
  isMultiSelectMode = false,
  isSelected = false,
}) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchCurrentX = useRef(0);
  const bubbleWrapperRef = useRef(null);
  const [swipeHint, setSwipeHint] = useState(false);
  const setProfileModalUserId = useAppStore((s) => s.setProfileModalUserId);

  const SWIPE_THRESHOLD = 45;

  const startPress = (e) => {
    if (isMultiSelectMode) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchCurrentX.current = e.touches[0].clientX;
  };

  const moveTouch = (e) => {
    if (isMultiSelectMode) return;
    touchCurrentX.current = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = touchCurrentX.current - touchStartX.current;
    const diffY = currentY - touchStartY.current;

    // Only allow swipe to the right (diffX > 0)
    const isHoriz = diffX > 0 && Math.abs(diffX) > Math.abs(diffY) * 1.2;

    if (bubbleWrapperRef.current && isHoriz) {
      const translate = Math.min(diffX * 0.4, 52);
      bubbleWrapperRef.current.style.transition = "none";
      bubbleWrapperRef.current.style.transform = `translateX(${translate}px)`;
      setSwipeHint(translate >= SWIPE_THRESHOLD * 0.7);
    }
  };

  const endTouch = () => {
    if (isMultiSelectMode) return;
    const diffX = touchCurrentX.current - touchStartX.current;

    if (bubbleWrapperRef.current) {
      bubbleWrapperRef.current.style.transition = "transform 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      bubbleWrapperRef.current.style.transform = "translateX(0px)";
      setTimeout(() => {
        if (bubbleWrapperRef.current) bubbleWrapperRef.current.style.transition = "";
      }, 230);
    }
    setSwipeHint(false);

    const translate = Math.min(Math.max(0, diffX) * 0.4, 52);
    if (translate >= SWIPE_THRESHOLD * 0.7) {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(15);
      }
      onReply(m);
    }
  };

  // Tap on message highlights the bubble (Teams style) and reveals 3-dot button
  const handleRowClick = (e) => {
    e.stopPropagation();
    if (onToggleAction) {
      onToggleAction(m.id);
    }
  };

  const handleBubbleClick = (e) => {
    e.stopPropagation();
    if (onToggleAction) {
      onToggleAction(m.id);
    }
  };

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
    const senderDisplayName = m.display_name || m.senderName || "?";
    return (
      <div
        id={`msg-${m.id}`}
        className={cn(
          "group/msg relative flex gap-2 px-3 py-0.5 md:px-4 items-stretch cursor-pointer select-none md:select-text max-w-full transition-colors duration-150",
          mine ? "justify-end" : "justify-start",
          isActionActive && "bg-accent/[0.05] dark:bg-white/[0.03] rounded-xl"
        )}
        onClick={handleRowClick}
        onContextMenu={(e) => { e.preventDefault(); onOpenActions?.(m, e); }}
        onTouchStart={startPress}
        onTouchEnd={endTouch}
        onTouchMove={moveTouch}
      >
        <div
          ref={bubbleWrapperRef}
          className={cn(
            "relative z-10 flex items-end gap-1.5 sm:gap-2 max-w-full min-w-0 transition-transform",
            mine ? "justify-end ml-auto" : "justify-start"
          )}
        >
          {/* Multi-select check */}
          {isMultiSelectMode && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleAction) onToggleAction(m.id);
              }}
              className="mr-2 self-center flex items-center justify-center shrink-0 cursor-pointer select-none"
            >
              <div
                className={cn(
                  "size-5 rounded-full border flex items-center justify-center transition-all",
                  isSelected
                    ? "bg-accent border-accent text-white"
                    : "border-zinc-700 bg-zinc-900/60 hover:border-zinc-500"
                )}
              >
                {isSelected && <Check className="size-3.5 stroke-[3]" />}
              </div>
            </div>
          )}

          {/* Avatar column for incoming group message */}
          {!mine && isGroup && (
            <div className="w-7 shrink-0 self-end mb-[2px]">
              {showAvatar ? (
                <button
                  type="button"
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (m.senderId) setProfileModalUserId(m.senderId);
                  }}
                >
                  <Avatar src={m.senderAvatar} name={senderDisplayName} size="sm" />
                </button>
              ) : (
                <span className="block w-7" />
              )}
            </div>
          )}

          {/* Stub bubble column */}
          <div className={cn("flex max-w-[22rem] flex-col md:max-w-[26rem]", mine && "items-end")}>
            <div className="relative flex items-center gap-1">
              {/* 3-Dot Action button — LEFT of my bubble */}
              {mine && !isMultiSelectMode && (
                <button
                  type="button"
                  aria-label="More message options"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenActions?.(m, e);
                  }}
                  className={cn(
                    "size-7 place-items-center rounded-lg text-muted-foreground transition-all duration-150 hover:text-foreground hover:bg-elevated hover:scale-105 active:scale-95 shrink-0 cursor-pointer shadow-2xs",
                    isActionActive
                      ? "grid text-foreground bg-elevated border border-border/60 scale-100 opacity-100"
                      : "hidden md:grid opacity-0 group-hover/msg:opacity-100 pointer-events-none group-hover/msg:pointer-events-auto"
                  )}
                  title="More options"
                >
                  <MoreHorizontal className="size-3.5" />
                </button>
              )}

              {/* Message removed pill */}
              <div
                onClick={handleBubbleClick}
                className={cn(
                  "flex items-center gap-1.5 rounded-2xl border border-dashed border-border/40 bg-surface/30 px-3.5 py-1.5 text-[11.5px] italic text-muted-foreground select-none transition-all cursor-pointer",
                  isActionActive && "ring-2 ring-accent ring-offset-1 ring-offset-background shadow-md",
                  isSelected && "ring-2 ring-accent shadow-xs"
                )}
              >
                Message removed
              </div>

              {/* 3-Dot Action button — RIGHT of incoming bubble */}
              {!mine && !isMultiSelectMode && (
                <button
                  type="button"
                  aria-label="More message options"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenActions?.(m, e);
                  }}
                  className={cn(
                    "size-7 place-items-center rounded-lg text-muted-foreground transition-all duration-150 hover:text-foreground hover:bg-elevated hover:scale-105 active:scale-95 shrink-0 cursor-pointer shadow-2xs",
                    isActionActive
                      ? "grid text-foreground bg-elevated border border-border/60 scale-100 opacity-100"
                      : "hidden md:grid opacity-0 group-hover/msg:opacity-100 pointer-events-none group-hover/msg:pointer-events-auto"
                  )}
                  title="More options"
                >
                  <MoreHorizontal className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Use display_name if available, otherwise fall back to senderName
  const senderDisplayName = m.display_name || m.senderName || "?";

  return (
    <div
      id={`msg-${m.id}`}
      className={cn(
        "group/msg relative flex gap-2 px-3 py-0.5 md:px-4 items-stretch cursor-pointer select-none md:select-text max-w-full transition-colors duration-150",
        mine ? "justify-end" : "justify-start",
        // MS Teams-inspired message row highlight wash when active
        isActionActive && "bg-accent/[0.05] dark:bg-white/[0.03] rounded-xl"
      )}
      style={{ touchAction: "pan-y" }}
      onClick={handleRowClick}
      onTouchStart={startPress}
      onTouchEnd={endTouch}
      onTouchMove={moveTouch}
    >
      {/* ── Swipe-to-reply visual hint ── */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 z-0 flex items-center justify-center size-7 rounded-full transition-all duration-150",
          swipeHint ? "bg-accent text-white scale-100 opacity-100 shadow-sm" : "bg-zinc-800/80 text-zinc-400 scale-75 opacity-0"
        )}
      >
        <Reply className="size-3.5" />
      </div>

      {/* ── Inner content that translates on swipe ── */}
      <div
        ref={bubbleWrapperRef}
        className={cn(
          "relative z-10 flex items-end gap-1.5 sm:gap-2 max-w-full min-w-0 transition-transform",
          mine ? "justify-end ml-auto" : "justify-start"
        )}
      >
        {/* ── Multi-select check ── */}
        {isMultiSelectMode && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleAction) onToggleAction(m.id);
            }}
            className="mr-2 self-center flex items-center justify-center shrink-0 cursor-pointer select-none"
          >
            <div
              className={cn(
                "size-5 rounded-full border flex items-center justify-center transition-all",
                isSelected
                  ? "bg-accent border-accent text-white"
                  : "border-zinc-700 bg-zinc-900/60 hover:border-zinc-500"
              )}
            >
              {isSelected && <Check className="size-3.5 stroke-[3]" />}
            </div>
          </div>
        )}

        {/* ── Avatar column ── */}
        {!mine && isGroup && (
          <div className="w-7 shrink-0 self-end mb-[2px]">
            {showAvatar ? (
              <button
                type="button"
                className="hover:opacity-80 transition-opacity cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (m.senderId) setProfileModalUserId(m.senderId);
                }}
              >
                <Avatar src={m.senderAvatar} name={senderDisplayName} size="sm" />
              </button>
            ) : (
              <span className="block w-7" />
            )}
          </div>
        )}

        {/* ── Bubble column ── */}
        <div className={cn("flex max-w-[22rem] flex-col md:max-w-[26rem]", mine && "items-end")}>
          {showName && !mine && isGroup && senderDisplayName && (
            <button
              type="button"
              className="mb-0.5 ml-1 text-left text-[10.5px] font-semibold text-zinc-400 hover:text-zinc-200 transition-colors w-fit cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (m.senderId) setProfileModalUserId(m.senderId);
              }}
            >
              {senderDisplayName}
            </button>
          )}

          <div className="relative flex items-center gap-1">
            {/* ── 3-Dot Action button — LEFT of my bubble. Click on this button opens the context menu ── */}
            {mine && !isMultiSelectMode && (
              <button
                type="button"
                aria-label="More message options"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenActions(m, e);
                }}
                className={cn(
                  "size-7 place-items-center rounded-lg text-muted-foreground transition-all duration-150 hover:text-foreground hover:bg-elevated hover:scale-105 active:scale-95 shrink-0 cursor-pointer shadow-2xs",
                  isActionActive
                    ? "grid text-foreground bg-elevated border border-border/60 scale-100 opacity-100"
                    : "hidden md:grid opacity-0 group-hover/msg:opacity-100 pointer-events-none group-hover/msg:pointer-events-auto"
                )}
                title="More options"
              >
                <MoreHorizontal className="size-3.5" />
              </button>
            )}

            {/* ── Bubble ── */}
            {(() => {
              const isGifMedia = m.mediaUrl && (Boolean(m.isGif) || /\.gif$/i.test(m.mediaName || m.mediaUrl || "") || m.type === "gif" || (m.mediaName && m.mediaName.startsWith("[GIF]")));
              const isImageMedia = m.mediaUrl && !isGifMedia && /\.(jpeg|jpg|png|webp|svg|bmp)$/i.test(m.mediaName || m.mediaUrl || "");
              const isVideoMedia = m.mediaUrl && !isGifMedia && /\.(mp4|webm|ogg|mov|m4v)$/i.test(m.mediaName || m.mediaUrl || "");
              const isMedia = isGifMedia || isImageMedia || isVideoMedia;
              const isMediaOnly = isMedia && !m.text && !m.replyTo;
              const isMediaWithText = isMedia && (m.text || m.replyTo);

              if (isMediaOnly) {
                return (
                  <div
                    onClick={handleBubbleClick}
                    className={cn(
                      "relative overflow-hidden cursor-pointer select-none md:select-text shadow-sm transition-all duration-150 rounded-2xl w-[70vw] min-w-[180px] max-w-[260px] sm:w-[280px] sm:max-w-[320px] md:max-w-[340px]",
                      getBubbleRadiusClass(),
                      // Teams-style highlight outline when active
                      isActionActive && "ring-2 ring-accent ring-offset-1 ring-offset-background shadow-md",
                      isSelected && "ring-2 ring-accent shadow-xs"
                    )}
                  >
                    {isGifMedia ? (
                      <LazyGif
                        src={m.mediaUrl}
                        alt={m.mediaName || "GIF"}
                        isVideo={!/\.(png|jpe?g|webp|svg)$/i.test(m.mediaName || m.mediaUrl || "")}
                        className="max-h-[190px] sm:max-h-[240px] md:max-h-[280px] w-full aspect-[4/3] object-cover"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onMediaClick) onMediaClick(m);
                          else window.open(getFullMediaUrl(m.mediaUrl), "_blank");
                        }}
                      />
                    ) : isVideoMedia ? (
                      <div
                        className="relative w-full max-h-[190px] sm:max-h-[240px] md:max-h-[280px] aspect-[4/3] min-w-[180px] overflow-hidden bg-black/40 flex items-center justify-center cursor-pointer hover:bg-black/50 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onMediaClick) onMediaClick(m);
                          else window.open(getFullMediaUrl(m.mediaUrl), "_blank");
                        }}
                      >
                        <video
                          src={getFullMediaUrl(m.mediaUrl)}
                          className="size-full object-cover"
                          muted
                          preload="metadata"
                        />
                        <div className="absolute inset-0 grid place-items-center bg-black/25 hover:bg-black/35 transition-colors">
                          <span className="grid size-11 place-items-center rounded-full bg-black/60 text-white border border-white/10 shadow-lg backdrop-blur-xs transition-transform hover:scale-110 active:scale-95">
                            <Play className="size-4.5 fill-white ml-0.5" />
                          </span>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={getFullMediaUrl(m.mediaUrl)}
                        alt={m.mediaName || "Image attachment"}
                        loading="lazy"
                        className="max-h-[190px] sm:max-h-[240px] md:max-h-[280px] w-full aspect-[4/3] object-cover cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onMediaClick) {
                            onMediaClick(m);
                          } else {
                            window.open(getFullMediaUrl(m.mediaUrl), "_blank");
                          }
                        }}
                      />
                    )}
                    {/* Overlay meta with zero unnecessary bezels */}
                    <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/65 text-white/95 text-[10px] flex items-center gap-1 backdrop-blur-md font-mono select-none whitespace-nowrap shrink-0">
                      {m.edited && <span className="italic opacity-70 text-[9px]">edited</span>}
                      {formatTime(m.createdAt)}
                      {mine && <Ticks delivered={m.delivered} read={m.read} mine={mine} status={m.status} />}
                    </div>
                  </div>
                );
              }

              if (isMediaWithText) {
                return (
                  <div
                    onClick={handleBubbleClick}
                    className={cn(
                      "relative text-xs leading-relaxed cursor-pointer select-none md:select-text shadow-sm transition-all duration-150 p-0 overflow-hidden w-[70vw] min-w-[180px] max-w-[260px] sm:w-[280px] sm:max-w-[320px] md:max-w-[340px]",
                      mine
                        ? "bg-accent/85 text-white font-normal"
                        : "bg-zinc-800/60 text-zinc-200 border border-zinc-700/40 font-normal",
                      getBubbleRadiusClass(),
                      // Teams-style highlight outline when active
                      isActionActive && "ring-2 ring-accent ring-offset-1 ring-offset-background shadow-md",
                      isSelected && "ring-2 ring-accent shadow-xs"
                    )}
                  >
                    <div className="relative w-full overflow-hidden">
                      {isGifMedia ? (
                        <LazyGif
                          src={m.mediaUrl}
                          alt={m.mediaName || "GIF"}
                          isVideo={!/\.(png|jpe?g|webp|svg)$/i.test(m.mediaName || m.mediaUrl || "")}
                          className="max-h-[190px] sm:max-h-[240px] md:max-h-[260px] w-full aspect-[4/3] object-cover"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onMediaClick) onMediaClick(m);
                            else window.open(getFullMediaUrl(m.mediaUrl), "_blank");
                          }}
                        />
                      ) : isVideoMedia ? (
                        <div
                          className="relative w-full max-h-[190px] sm:max-h-[240px] md:max-h-[260px] aspect-[4/3] overflow-hidden bg-black/40 flex items-center justify-center cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onMediaClick) onMediaClick(m);
                            else window.open(getFullMediaUrl(m.mediaUrl), "_blank");
                          }}
                        >
                          <video
                            src={getFullMediaUrl(m.mediaUrl)}
                            className="size-full object-cover"
                            muted
                            preload="metadata"
                          />
                          <div className="absolute inset-0 grid place-items-center bg-black/25 hover:bg-black/35 transition-colors">
                            <span className="grid size-11 place-items-center rounded-full bg-black/60 text-white border border-white/10 shadow-lg backdrop-blur-xs transition-transform hover:scale-110 active:scale-95">
                              <Play className="size-4.5 fill-white ml-0.5" />
                            </span>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={getFullMediaUrl(m.mediaUrl)}
                          alt={m.mediaName || "Image attachment"}
                          loading="lazy"
                          className="max-h-[190px] sm:max-h-[240px] md:max-h-[260px] w-full aspect-[4/3] object-cover cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onMediaClick) {
                              onMediaClick(m);
                            } else {
                              window.open(getFullMediaUrl(m.mediaUrl), "_blank");
                            }
                          }}
                        />
                      )}
                    </div>
                    <div className="px-3 pb-2 pt-1.5 text-[13px] leading-[17px]">
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
                      {/* Formatted Text with link, IP, phone auto-detection */}
                      <FormattedMessageText text={m.text} mine={mine} />

                      {/* WhatsApp-style Link Preview */}
                      <LinkPreview text={m.text} mine={mine} />

                      {/* Inline meta */}
                      <span
                        className={cn(
                          "ml-2.5 inline-flex translate-y-[2px] items-center gap-1 text-[10px] tabular-nums float-right mt-1 font-mono whitespace-nowrap",
                          mine ? "text-white/80 font-medium" : "text-muted-foreground/80"
                        )}
                      >
                        {m.edited && <span className="italic opacity-70">edited</span>}
                        {formatTime(m.createdAt)}
                        {mine && <Ticks delivered={m.delivered} read={m.read} mine={mine} status={m.status} />}
                      </span>
                      <span className="block clear-both h-0" />
                    </div>
                  </div>
                );
              }

              // Standard layout for text or file attachment (Sleek, minimal bezels)
              return (
                <div
                  onClick={handleBubbleClick}
                  className={cn(
                    "relative px-3 py-1.5 sm:px-3.5 sm:py-2 text-[13px] leading-[1.45] cursor-pointer select-none md:select-text shadow-sm transition-all duration-150 max-w-[20rem] sm:max-w-[24rem] md:max-w-[26rem]",
                    mine
                      ? "bg-accent/85 text-white"
                      : "bg-zinc-800/60 text-zinc-100 border border-zinc-700/40",
                    getBubbleRadiusClass(),
                    // Teams-style highlight outline when active
                    isActionActive && "ring-2 ring-accent ring-offset-1 ring-offset-background shadow-md",
                    isSelected && "ring-2 ring-accent shadow-xs"
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
                      onPdfClick={onPdfClick}
                    />
                  )}

                  {/* Formatted Text with link, IP, phone auto-detection */}
                  {m.text && <FormattedMessageText text={m.text} mine={mine} />}

                  {/* WhatsApp-style Link Preview */}
                  {m.text && <LinkPreview text={m.text} mine={mine} />}

                  {/* Inline meta — time + ticks */}
                  <span
                    className={cn(
                      "ml-3 inline-flex translate-y-[3px] items-center gap-1 text-[10px] tabular-nums float-right mt-0.5 font-mono whitespace-nowrap",
                      mine ? "text-white/70" : "text-zinc-400"
                    )}
                  >
                    {m.edited && <span className="italic opacity-70">edited</span>}
                    {formatTime(m.createdAt)}
                    {mine && <Ticks delivered={m.delivered} read={m.read} mine={mine} status={m.status} />}
                  </span>
                  <span className="block clear-both h-0" />
                </div>
              );
            })()}

            {/* ── 3-Dot Action button — RIGHT of incoming bubble. Click on this button opens the context menu ── */}
            {!mine && !isMultiSelectMode && (
              <button
                type="button"
                aria-label="More message options"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenActions(m, e);
                }}
                className={cn(
                  "size-7 place-items-center rounded-lg text-muted-foreground transition-all duration-150 hover:text-foreground hover:bg-elevated hover:scale-105 active:scale-95 shrink-0 cursor-pointer shadow-2xs",
                  isActionActive
                    ? "grid text-foreground bg-elevated border border-border/60 scale-100 opacity-100"
                    : "hidden md:grid opacity-0 group-hover/msg:opacity-100 pointer-events-none group-hover/msg:pointer-events-auto"
                )}
                title="More options"
              >
                <MoreHorizontal className="size-3.5" />
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
    </div>
  );
}

// ─── Media Grid Tile Component ────────────────────────────────────────────────
function MediaGridTile({ msg, onClick }) {
  const fullUrl = getFullMediaUrl(msg.mediaUrl);
  const isGif = Boolean(msg.isGif) || msg.type === "gif" || (msg.mediaName && msg.mediaName.startsWith("[GIF]")) || /\.gif$/i.test(msg.mediaName || msg.mediaUrl || "");
  const isVideo = !isGif && /\.(mp4|webm|ogg|mov|m4v)$/i.test(msg.mediaName || msg.mediaUrl || "");

  if (isGif) {
    return (
      <LazyGif
        src={msg.mediaUrl}
        alt={msg.mediaName || "GIF"}
        isVideo={!/\.(png|jpe?g|webp|svg)$/i.test(msg.mediaName || msg.mediaUrl || "")}
        className="size-full object-cover"
        onClick={onClick}
      />
    );
  }

  if (isVideo) {
    return (
      <div
        className="relative size-full overflow-hidden bg-black/40 flex items-center justify-center cursor-pointer"
        onClick={onClick}
      >
        <video
          src={fullUrl}
          className="size-full object-cover"
          muted
          preload="metadata"
        />
        <div className="absolute inset-0 grid place-items-center bg-black/20 hover:bg-black/35 transition-colors">
          <span className="grid size-8 place-items-center rounded-full bg-black/60 text-white border border-white/10 shadow-sm backdrop-blur-xs">
            <Play className="size-3.5 fill-white ml-0.5" />
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={fullUrl}
      alt={msg.mediaName || "Media"}
      loading="lazy"
      className="size-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
      onClick={onClick}
    />
  );
}

// ─── WhatsApp-style Media Grid Row ────────────────────────────────────────────
function MediaGridRowBase({
  group,
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
  onPdfClick,
  isMultiSelectMode = false,
  isSelected = false,
}) {
  const items = group.messages;
  const firstMsg = items[0];
  const lastMsg = items[items.length - 1];
  const count = items.length;
  const groupIds = items.map((m) => m.id);
  const senderDisplayName = firstMsg.display_name || firstMsg.senderName || "?";
  const setProfileModalUserId = useAppStore((s) => s.setProfileModalUserId);

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

  const handleTileClick = (msg, e) => {
    e.stopPropagation();
    if (isMultiSelectMode) {
      if (onToggleAction) onToggleAction(groupIds);
    } else if (onMediaClick) {
      onMediaClick(msg);
    }
  };

  return (
    <div
      id={`msg-${firstMsg.id}`}
      className={cn(
        "group/msg relative flex gap-2 px-3 py-0.5 md:px-4 items-stretch cursor-pointer select-none md:select-text max-w-full transition-colors duration-150",
        mine ? "justify-end" : "justify-start",
        isActionActive && "bg-accent/[0.05] dark:bg-white/[0.03] rounded-xl"
      )}
      onClick={(e) => {
        e.stopPropagation();
        if (onToggleAction) onToggleAction(groupIds);
      }}
    >
      <div
        className={cn(
          "relative z-10 flex items-end gap-1.5 sm:gap-2 max-w-full min-w-0",
          mine ? "justify-end ml-auto" : "justify-start"
        )}
      >
        {isMultiSelectMode && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleAction) onToggleAction(groupIds);
            }}
            className="mr-2 self-center flex items-center justify-center shrink-0 cursor-pointer select-none"
          >
            <div
              className={cn(
                "size-5 rounded-full border flex items-center justify-center transition-all",
                isSelected
                  ? "bg-accent border-accent text-white"
                  : "border-zinc-700 bg-zinc-900/60 hover:border-zinc-500"
              )}
            >
              {isSelected && <Check className="size-3.5 stroke-[3]" />}
            </div>
          </div>
        )}

        {!mine && isGroup && (
          <div className="w-7 shrink-0 self-end mb-[2px]">
            {showAvatar ? (
              <button
                type="button"
                className="hover:opacity-80 transition-opacity cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (firstMsg.senderId) setProfileModalUserId(firstMsg.senderId);
                }}
              >
                <Avatar src={firstMsg.senderAvatar} name={senderDisplayName} size="sm" />
              </button>
            ) : (
              <span className="block w-7" />
            )}
          </div>
        )}

        <div className={cn("flex flex-col", mine && "items-end")}>
          {showName && !mine && isGroup && senderDisplayName && (
            <button
              type="button"
              className="mb-0.5 ml-1 text-left text-[10.5px] font-semibold text-zinc-400 hover:text-zinc-200 transition-colors w-fit cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (firstMsg.senderId) setProfileModalUserId(firstMsg.senderId);
              }}
            >
              {senderDisplayName}
            </button>
          )}

          <div className="relative flex items-center gap-1">
            {mine && !isMultiSelectMode && (
              <button
                type="button"
                aria-label="More message options"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenActions({ ...firstMsg, groupMessages: items }, e);
                }}
                className={cn(
                  "size-7 place-items-center rounded-lg text-muted-foreground transition-all duration-150 hover:text-foreground hover:bg-elevated hover:scale-105 active:scale-95 shrink-0 cursor-pointer shadow-2xs",
                  isActionActive
                    ? "grid text-foreground bg-elevated border border-border/60 scale-100 opacity-100"
                    : "hidden md:grid opacity-0 group-hover/msg:opacity-100 pointer-events-none group-hover/msg:pointer-events-auto"
                )}
                title="More options"
              >
                <MoreHorizontal className="size-3.5" />
              </button>
            )}

            <div
              className={cn(
                "relative overflow-hidden cursor-pointer select-none md:select-text shadow-sm transition-all duration-150 w-[72vw] min-w-[220px] max-w-[270px] sm:w-[320px] sm:max-w-[340px] p-0.5 bg-black/40",
                getBubbleRadiusClass(),
                isActionActive && "ring-2 ring-accent ring-offset-1 ring-offset-background shadow-md",
                isSelected && "ring-2 ring-accent shadow-xs"
              )}
            >
              {/* WhatsApp Grid: 2, 3, or 4+ items */}
              {count === 2 && (
                <div className="grid grid-cols-2 gap-0.5 w-full aspect-[4/3] rounded-xl overflow-hidden">
                  <div className="relative size-full overflow-hidden">
                    <MediaGridTile msg={items[0]} onClick={(e) => handleTileClick(items[0], e)} />
                  </div>
                  <div className="relative size-full overflow-hidden">
                    <MediaGridTile msg={items[1]} onClick={(e) => handleTileClick(items[1], e)} />
                  </div>
                </div>
              )}

              {count === 3 && (
                <div className="grid grid-cols-2 grid-rows-2 gap-0.5 w-full aspect-[4/3] rounded-xl overflow-hidden">
                  <div className="row-span-2 relative size-full overflow-hidden">
                    <MediaGridTile msg={items[0]} onClick={(e) => handleTileClick(items[0], e)} />
                  </div>
                  <div className="relative size-full overflow-hidden">
                    <MediaGridTile msg={items[1]} onClick={(e) => handleTileClick(items[1], e)} />
                  </div>
                  <div className="relative size-full overflow-hidden">
                    <MediaGridTile msg={items[2]} onClick={(e) => handleTileClick(items[2], e)} />
                  </div>
                </div>
              )}

              {count >= 4 && (
                <div className="grid grid-cols-2 grid-rows-2 gap-0.5 w-full aspect-[4/3] rounded-xl overflow-hidden">
                  <div className="relative size-full overflow-hidden">
                    <MediaGridTile msg={items[0]} onClick={(e) => handleTileClick(items[0], e)} />
                  </div>
                  <div className="relative size-full overflow-hidden">
                    <MediaGridTile msg={items[1]} onClick={(e) => handleTileClick(items[1], e)} />
                  </div>
                  <div className="relative size-full overflow-hidden">
                    <MediaGridTile msg={items[2]} onClick={(e) => handleTileClick(items[2], e)} />
                  </div>
                  <div className="relative size-full overflow-hidden">
                    <MediaGridTile msg={items[3]} onClick={(e) => handleTileClick(items[3], e)} />
                    {count > 4 && (
                      <div
                        onClick={(e) => handleTileClick(items[3], e)}
                        className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center font-bold text-lg sm:text-xl text-white font-mono select-none hover:bg-black/70 transition-colors"
                      >
                        +{count - 3}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Overlay meta bottom-right */}
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white/95 text-[10px] flex items-center gap-1 backdrop-blur-md font-mono select-none whitespace-nowrap shadow-sm pointer-events-none">
                {lastMsg.edited && <span className="italic opacity-70 text-[9px]">edited</span>}
                {formatTime(lastMsg.createdAt)}
                {mine && <Ticks delivered={lastMsg.delivered} read={lastMsg.read} mine={mine} status={lastMsg.status} />}
              </div>
            </div>

            {!mine && !isMultiSelectMode && (
              <button
                type="button"
                aria-label="More message options"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenActions({ ...firstMsg, groupMessages: items }, e);
                }}
                className={cn(
                  "size-7 place-items-center rounded-lg text-muted-foreground transition-all duration-150 hover:text-foreground hover:bg-elevated hover:scale-105 active:scale-95 shrink-0 cursor-pointer shadow-2xs",
                  isActionActive
                    ? "grid text-foreground bg-elevated border border-border/60 scale-100 opacity-100"
                    : "hidden md:grid opacity-0 group-hover/msg:opacity-100 pointer-events-none group-hover/msg:pointer-events-auto"
                )}
                title="More options"
              >
                <MoreHorizontal className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const MessageRow = memo(MessageRowBase);
export const MediaGridRow = memo(MediaGridRowBase);

