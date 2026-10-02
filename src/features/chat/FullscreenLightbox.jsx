import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { toast } from "sonner";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  User,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Film,
  Reply,
  Forward,
  Trash2,
  Smile,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

function getFullMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const storageUrl = import.meta.env?.VITE_STORAGE_URL;
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

function formatVideoTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

// ── Custom Video Player Component ─────────────────────────────────────────────
function CustomVideoPlayer({ src, isActive, showChrome }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);

  // Auto-pause when slide is inactive
  useEffect(() => {
    if (!isActive && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const togglePlay = useCallback((e) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback((e) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  }, []);

  const toggleFullscreen = useCallback((e) => {
    e?.stopPropagation();
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  const handleTimeUpdate = () => {
    if (!videoRef.current || isSeeking) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
  };

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center w-full h-full max-h-[82vh] group/player"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={src}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain cursor-pointer outline-none ring-1 ring-white/10"
      />

      {/* Center Big Play Button when paused */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="size-16 md:size-20 rounded-full bg-black/60 backdrop-blur-md text-white grid place-items-center shadow-2xl ring-1 ring-white/20 transition-transform group-hover/player:scale-110">
            <Play className="size-8 md:size-10 ml-1 text-white fill-white" />
          </div>
        </div>
      )}

      {/* Floating Video Controls Bar */}
      <div
        className={cn(
          "absolute bottom-4 left-4 right-4 max-w-xl mx-auto rounded-2xl bg-black/75 backdrop-blur-xl border border-white/10 px-4 py-2.5 flex flex-col gap-2 transition-all duration-300 shadow-2xl",
          showChrome || isHovering || !isPlaying
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3 pointer-events-none"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrubber timeline */}
        <div className="relative flex items-center w-full group/seek py-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onMouseDown={() => setIsSeeking(true)}
            onMouseUp={() => setIsSeeking(false)}
            onTouchStart={() => setIsSeeking(true)}
            onTouchEnd={() => setIsSeeking(false)}
            onChange={handleSeek}
            className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-accent"
            style={{
              background: `linear-gradient(to right, var(--color-accent, #6366f1) ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%)`,
            }}
          />
        </div>

        {/* Buttons and timestamps */}
        <div className="flex items-center justify-between text-xs text-white/90">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={togglePlay}
              className="p-1 rounded-lg hover:bg-white/15 active:scale-95 transition-all text-white"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 fill-white" />}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="p-1 rounded-lg hover:bg-white/15 active:scale-95 transition-all text-white/80 hover:text-white"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="size-4 text-rose-400" /> : <Volume2 className="size-4" />}
            </button>

            <span className="text-[11px] font-mono text-white/70">
              {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1 rounded-lg hover:bg-white/15 active:scale-95 transition-all text-white/80 hover:text-white"
              aria-label="Fullscreen"
            >
              {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Fullscreen Lightbox ──────────────────────────────────────────────────
export function FullscreenLightbox({
  message,
  messages = [],
  meId,
  onClose,
  onSelect,
  onReply,
  onSendReply,
  onForward,
  onDelete,
  onReact,
}) {
  const [showChrome, setShowChrome] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const replyInputRef = useRef(null);
  const thumbnailsRef = useRef(null);

  useEffect(() => {
    if (isReplying) {
      setTimeout(() => replyInputRef.current?.focus(), 50);
    }
  }, [isReplying]);

  // Filter messages to get only media items (images and videos)
  const mediaMessages = useMemo(() => {
    return messages.filter((m) => {
      return (
        m.mediaUrl &&
        (Boolean(m.isGif) ||
          m.type === "gif" ||
          (m.mediaName && m.mediaName.startsWith("[GIF]")) ||
          /\.(jpeg|jpg|gif|png|webp|svg|mp4|webm|ogg|mov|m4v)$/i.test(m.mediaName || m.mediaUrl || ""))
      );
    });
  }, [messages]);

  const initialIndex = useMemo(() => {
    const idx = mediaMessages.findIndex((m) => String(m.id) === String(message?.id));
    return idx >= 0 ? idx : 0;
  }, [mediaMessages, message]);

  // Keep startIndex stable throughout the component's lifetime so Embla never re-inits on slide change
  const [stableStartIndex] = useState(initialIndex);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const showChromeRef = useRef(showChrome);

  useEffect(() => {
    showChromeRef.current = showChrome;
  }, [showChrome]);

  // Setup Embla Carousel with smooth, gentle duration (35)
  const [emblaRef, emblaApi] = useEmblaCarousel({
    startIndex: stableStartIndex,
    loop: false,
    duration: 35,
    dragFree: false,
    skipSnaps: false,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // Smooth continuous Parallax + Fade Tween Engine
  const tweenParallaxAndFade = useCallback((embla, eventName) => {
    if (!embla) return;
    const engine = embla.internalEngine();
    const scrollProgress = embla.scrollProgress();
    const slidesInView = embla.slidesInView();
    const isScrollEvent = eventName === "scroll";
    const slideNodes = embla.slideNodes();
    const numSlides = embla.scrollSnapList().length;
    if (numSlides === 0) return;

    if (numSlides === 1) {
      if (slideNodes[0]) {
        slideNodes[0].style.opacity = "1";
        slideNodes[0].style.pointerEvents = "";
      }
      return;
    }

    embla.scrollSnapList().forEach((scrollSnap, snapIndex) => {
      let diffToTarget = scrollSnap - scrollProgress;
      const slidesInSnap = engine.slideRegistry[snapIndex];
      if (!slidesInSnap) return;

      slidesInSnap.forEach((slideIndex) => {
        if (isScrollEvent && !slidesInView.includes(slideIndex)) return;

        if (engine.options.loop) {
          engine.slideLooper.loopPoints.forEach((loopItem) => {
            const target = loopItem.target();
            if (slideIndex === loopItem.index && target !== 0) {
              const sign = Math.sign(target);
              if (sign === -1) {
                diffToTarget = scrollSnap - (1 + scrollProgress);
              }
              if (sign === 1) {
                diffToTarget = scrollSnap + (1 - scrollProgress);
              }
            }
          });
        }

        // Normalize distance: 1.0 = distance between adjacent slides
        const progressDiff = diffToTarget * (numSlides - 1);

        // Smooth parallax translation: -20% to +20%
        const translate = progressDiff * -20;

        // Smooth, non-abrupt fade:
        // When UI is hidden, adjacent slides naturally fade to 0.0 at distance 1.0
        // When UI is shown, gentle fade down to 0.15
        const fadeRate = showChromeRef.current ? 0.85 : 1.0;
        const opacity = Math.max(0, Math.min(1, 1 - Math.abs(progressDiff) * fadeRate));

        const slideNode = slideNodes[slideIndex];
        if (slideNode) {
          slideNode.style.opacity = opacity.toFixed(3);
          slideNode.style.pointerEvents = opacity < 0.1 ? "none" : "";

          const parallaxLayer = slideNode.querySelector(".embla__parallax__layer");
          if (parallaxLayer) {
            parallaxLayer.style.transform = `translate3d(${translate.toFixed(2)}%, 0px, 0px)`;
          }
        }
      });
    });
  }, []);

  const onSelectSlide = useCallback(() => {
    if (!emblaApi) return;
    const snap = emblaApi.selectedScrollSnap();
    setCurrentIndex(snap);
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    setZoomLevel(1);
    setIsReplying(false);
    setReplyText("");

    const activeMsg = mediaMessages[snap];
    if (activeMsg && onSelect) {
      onSelect(activeMsg);
    }
  }, [emblaApi, mediaMessages, onSelect]);

  // Attach Embla events
  useEffect(() => {
    if (!emblaApi) return;

    tweenParallaxAndFade(emblaApi);
    onSelectSlide();

    emblaApi
      .on("reInit", tweenParallaxAndFade)
      .on("reInit", onSelectSlide)
      .on("scroll", tweenParallaxAndFade)
      .on("slideFocus", tweenParallaxAndFade)
      .on("select", onSelectSlide);

    return () => {
      emblaApi
        .off("reInit", tweenParallaxAndFade)
        .off("reInit", onSelectSlide)
        .off("scroll", tweenParallaxAndFade)
        .off("slideFocus", tweenParallaxAndFade)
        .off("select", onSelectSlide);
    };
  }, [emblaApi, tweenParallaxAndFade, onSelectSlide]);

  // React to showChrome toggle to immediately hide or restore side images
  useEffect(() => {
    if (!emblaApi) return;
    tweenParallaxAndFade(emblaApi);
  }, [showChrome, emblaApi, tweenParallaxAndFade]);

  // Handle media deletion while Lightbox is open (slide to next/prev item or close if no media remains)
  useEffect(() => {
    if (mediaMessages.length === 0) {
      onClose();
    } else if (currentIndex >= mediaMessages.length) {
      const nextIdx = Math.max(0, mediaMessages.length - 1);
      setCurrentIndex(nextIdx);
      if (emblaApi) emblaApi.scrollTo(nextIdx);
    } else if (emblaApi) {
      emblaApi.reInit();
    }
  }, [mediaMessages.length, emblaApi, currentIndex, onClose]);

  // Jump to specific slide
  const scrollTo = useCallback((idx) => {
    if (!emblaApi) return;
    emblaApi.scrollTo(idx);
  }, [emblaApi]);

  const handlePrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const handleNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Auto-scroll active thumbnail into view in filmstrip
  useEffect(() => {
    if (!thumbnailsRef.current) return;
    const activeThumb = thumbnailsRef.current.children[currentIndex];
    if (activeThumb) {
      activeThumb.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") onClose();
      if (e.key.toLowerCase() === "f" || e.key.toLowerCase() === "h") {
        setShowChrome((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext, onClose]);

  if (mediaMessages.length === 0) return null;

  const currentMsg = mediaMessages[currentIndex] || mediaMessages[0];
  const senderName = currentMsg?.senderName || currentMsg?.display_name || currentMsg?.username || "Someone";
  const isCurrentGif = Boolean(currentMsg?.isGif || currentMsg?.type === "gif" || (currentMsg?.mediaName && currentMsg?.mediaName.startsWith("[GIF]")) || /\.gif$/i.test(currentMsg?.mediaName || currentMsg?.mediaUrl || ""));
  const isCurrentVideo = !isCurrentGif && /\.(mp4|webm|ogg|mov|m4v)$/i.test(currentMsg?.mediaName || currentMsg?.mediaUrl || "");
  const caption = currentMsg?.text || "";
  const filename = currentMsg?.mediaName || (isCurrentGif ? "animation.gif" : isCurrentVideo ? "video.mp4" : "image.jpg");
  const fullUrl = getFullMediaUrl(currentMsg?.mediaUrl);

  const toggleZoom = () => {
    setZoomLevel((z) => (z === 1 ? 2 : 1));
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-between bg-black/96 backdrop-blur-2xl select-none text-white overflow-hidden animate-in fade-in duration-200">

      {/* ── Top Bar (Sender, Actions, Focus toggle, Close) ─────────────── */}
      <header
        className={cn(
          "relative z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent transition-all duration-300",
          showChrome ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <div className="grid size-8.5 place-items-center rounded-full bg-white/10 border border-white/10 shrink-0 text-white/90">
            <User className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate text-white/90">
              {senderName}
            </p>
            <p className="text-[10px] text-white/50 truncate font-mono">
              {filename}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Zoom toggle (images only) */}
          {!isCurrentVideo && (
            <button
              type="button"
              onClick={toggleZoom}
              title={zoomLevel === 1 ? "Zoom in" : "Reset zoom"}
              className="grid size-9 place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all active:scale-95 border border-white/10 cursor-pointer"
            >
              {zoomLevel === 1 ? <ZoomIn className="size-4" /> : <ZoomOut className="size-4" />}
            </button>
          )}

          {/* Focus Mode Toggle (Hide/Show extra UI) */}
          <button
            type="button"
            onClick={() => setShowChrome(false)}
            title="Focus Mode (Hide UI) — Press F or click"
            className="grid size-9 place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all active:scale-95 border border-white/10 cursor-pointer"
          >
            <EyeOff className="size-4" />
          </button>

          {/* Download button */}
          <a
            href={fullUrl}
            download={filename}
            target="_blank"
            rel="noopener noreferrer"
            title="Download / Open full resolution"
            className="grid size-9 place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all active:scale-95 border border-white/10 cursor-pointer"
          >
            <Download className="size-4" />
          </a>

          {/* ── Vertical Divider ── */}
          <div className="h-5 w-[1px] bg-white/20 mx-0.5 sm:mx-1 shrink-0" />

          {/* Existing Reaction Pills Display */}
          {Array.isArray(currentMsg?.reactions) && currentMsg.reactions.length > 0 && (
            <div className="flex items-center gap-1 max-w-[140px] sm:max-w-[200px] overflow-x-auto py-0.5 scroll-slim shrink-0">
              {currentMsg.reactions.map((r) => (
                <button
                  key={r.emoji}
                  type="button"
                  onClick={() => onReact && onReact(currentMsg, r.emoji)}
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-all active:scale-95 cursor-pointer shrink-0 shadow-2xs select-none",
                    r.reactedByMe
                      ? "border-accent/60 bg-accent/30 text-white font-bold"
                      : "border-white/15 bg-white/10 text-white/80 hover:bg-white/20"
                  )}
                  title={r.reactedByMe ? `You reacted with ${r.emoji}` : `Reacted with ${r.emoji}`}
                >
                  <span>{r.emoji}</span>
                  {r.count > 1 && <span className="font-mono text-[10px] opacity-90">{r.count}</span>}
                </button>
              ))}
            </div>
          )}

          {/* Reaction Picker Button & Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setReactionPickerOpen((p) => !p)}
              title="Add Reaction"
              className={cn(
                "grid size-9 place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all active:scale-95 border border-white/10 cursor-pointer",
                reactionPickerOpen && "bg-white/25 ring-1 ring-white/30 text-white"
              )}
            >
              <Smile className="size-4" />
            </button>

            {reactionPickerOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 flex items-center gap-1 rounded-2xl bg-zinc-900/95 border border-white/15 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
                {["👍", "❤️", "😂", "🔥", "🙏", "😮"].map((emoji) => {
                  const reactedByMe = currentMsg?.reactions?.some((r) => r.emoji === emoji && r.reactedByMe);
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        if (onReact) onReact(currentMsg, emoji);
                        setReactionPickerOpen(false);
                      }}
                      className={cn(
                        "grid size-8 place-items-center rounded-xl text-base hover:bg-white/15 active:scale-95 transition-all cursor-pointer",
                        reactedByMe && "bg-white/25 ring-1 ring-white/40 scale-105"
                      )}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reply */}
          <button
            type="button"
            onClick={() => setIsReplying((prev) => !prev)}
            title="Reply"
            className={cn(
              "grid size-9 place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all active:scale-95 border border-white/10 cursor-pointer",
              isReplying && "bg-white/25 ring-1 ring-white/30 text-white"
            )}
          >
            <Reply className="size-4" />
          </button>

          {/* Forward */}
          <button
            type="button"
            onClick={() => onForward && onForward(currentMsg)}
            title="Forward"
            className="grid size-9 place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all active:scale-95 border border-white/10 cursor-pointer"
          >
            <Forward className="size-4" />
          </button>

          {/* Common Delete button (opens Delete modal) */}
          <button
            type="button"
            onClick={() => onDelete && onDelete(currentMsg)}
            title="Delete"
            className="grid size-9 place-items-center rounded-full bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 hover:text-rose-300 transition-all active:scale-95 border border-rose-500/20 cursor-pointer"
          >
            <Trash2 className="size-4" />
          </button>

          {/* ── Vertical Divider ── */}
          <div className="h-5 w-[1px] bg-white/20 mx-0.5 sm:mx-1 shrink-0" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close viewer"
            className="grid size-9 place-items-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-all active:scale-95 border border-white/15 cursor-pointer"
          >
            <X className="size-4.5" />
          </button>
        </div>
      </header>

      {/* Floating Restore UI button when Focus Mode is active */}
      {!showChrome && (
        <button
          type="button"
          onClick={() => setShowChrome(true)}
          className="fixed top-4 right-4 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/85 text-white/80 hover:text-white backdrop-blur-md border border-white/15 shadow-xl transition-all active:scale-95 text-xs font-medium cursor-pointer"
          title="Show controls (Press F)"
        >
          <Eye className="size-3.5" />
          <span>Show UI</span>
        </button>
      )}

      {/* ── Main Media Canvas (Embla Carousel) ─────────────────────────── */}
      <div className="relative flex-1 min-h-0 w-full flex items-center justify-center">

        {/* Desktop Previous Button */}
        {canScrollPrev && (
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous"
            className={cn(
              "absolute left-4 z-30 hidden md:grid size-12 place-items-center rounded-full bg-black/40 hover:bg-black/80 border border-white/10 text-white/80 hover:text-white shadow-2xl transition-all active:scale-90 hover:scale-105 backdrop-blur-md",
              showChrome ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            <ChevronLeft className="size-6" />
          </button>
        )}

        {/* Embla Viewport */}
        <div className="overflow-hidden w-full h-full" ref={emblaRef}>
          <div className="flex h-full touch-pan-y">
            {mediaMessages.map((m, idx) => {
              const itemUrl = getFullMediaUrl(m.mediaUrl);
              const isGifItem = Boolean(m.isGif || m.type === "gif" || (m.mediaName && m.mediaName.startsWith("[GIF]")) || /\.gif$/i.test(m.mediaName || m.mediaUrl || ""));
              const isVideoItem = !isGifItem && /\.(mp4|webm|ogg|mov|m4v)$/i.test(m.mediaName || m.mediaUrl || "");

              return (
                <div
                  key={m.id}
                  className="embla__slide flex-[0_0_100%] min-w-0 h-full relative flex items-center justify-center p-2 md:p-6 overflow-hidden select-none"
                >
                  <div className="embla__parallax__layer relative w-full h-full flex items-center justify-center will-change-transform">
                    {isGifItem ? (
                      <div className="relative max-w-full max-h-[82vh] flex items-center justify-center">
                        {/\.(mp4|webm|ogg|mov|m4v)$/i.test(m.mediaName || m.mediaUrl || "") || m.isGif ? (
                          <video
                            src={itemUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="max-w-full max-h-[80vh] md:max-h-[82vh] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10 select-none"
                          />
                        ) : (
                          <img
                            src={itemUrl}
                            alt={m.mediaName || "GIF"}
                            className="max-w-full max-h-[80vh] md:max-h-[82vh] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10 select-none"
                          />
                        )}
                      </div>
                    ) : isVideoItem ? (
                      <CustomVideoPlayer
                        src={itemUrl}
                        isActive={currentIndex === idx}
                        showChrome={showChrome}
                      />
                    ) : (
                      <div
                        className="relative max-w-full max-h-[82vh] flex items-center justify-center cursor-zoom-in transition-transform duration-250 ease-out"
                        style={{
                          transform: currentIndex === idx ? `scale(${zoomLevel})` : "scale(1)",
                        }}
                        onDoubleClick={toggleZoom}
                      >
                        <img
                          src={itemUrl}
                          alt={m.mediaName || "Media"}
                          className="max-w-full max-h-[80vh] md:max-h-[82vh] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10 pointer-events-auto select-none"
                          draggable={false}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop Next Button */}
        {canScrollNext && (
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next"
            className={cn(
              "absolute right-4 z-30 hidden md:grid size-12 place-items-center rounded-full bg-black/40 hover:bg-black/80 border border-white/10 text-white/80 hover:text-white shadow-2xl transition-all active:scale-90 hover:scale-105 backdrop-blur-md",
              showChrome ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            <ChevronRight className="size-6" />
          </button>
        )}
      </div>

      {/* ── Bottom Section (Caption, Counter & PC Filmstrip) ──────────── */}
      <footer
        className={cn(
          "relative z-30 flex flex-col items-center bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-3 pb-4 px-4 gap-2 transition-all duration-300",
          showChrome ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        )}
      >
        {/* Caption */}
        {caption && (
          <p className="text-xs md:text-sm font-normal text-white/90 max-w-xl text-center line-clamp-2 px-3 py-1.5 rounded-full bg-black/50 border border-white/10 backdrop-blur-md">
            {caption}
          </p>
        )}

        {/* Inline Lightbox Reply Input Bar */}
        {isReplying && (
          <div className="w-full max-w-lg mx-auto px-3.5 py-2 flex items-center gap-2 rounded-2xl bg-zinc-900/95 border border-white/15 backdrop-blur-xl shadow-2xl animate-in slide-in-from-bottom-2 duration-150 mb-1 select-none">
            <div className="flex flex-col flex-1 min-w-0 text-left">
              <span className="text-[10px] text-white/50 font-medium truncate">
                Replying to <span className="text-accent font-semibold">{senderName}</span>
              </span>
              <input
                ref={replyInputRef}
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply…"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (replyText.trim()) {
                      if (onSendReply) onSendReply(replyText.trim(), currentMsg.id);
                      setReplyText("");
                      setIsReplying(false);
                      toast.success("Reply sent");
                    }
                  }
                  if (e.key === "Escape") {
                    setIsReplying(false);
                  }
                }}
                className="w-full bg-transparent text-xs text-white placeholder:text-white/30 focus:outline-none py-0.5"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (replyText.trim()) {
                  if (onSendReply) onSendReply(replyText.trim(), currentMsg.id);
                  setReplyText("");
                  setIsReplying(false);
                  toast.success("Reply sent");
                }
              }}
              disabled={!replyText.trim()}
              className="grid size-8 place-items-center rounded-xl bg-accent text-white hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0 cursor-pointer shadow-sm"
              title="Send reply"
            >
              <Send className="size-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsReplying(false)}
              className="grid size-7 place-items-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all shrink-0 cursor-pointer"
              title="Cancel reply"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* Slide Counter */}
        <div className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-mono tracking-wider font-semibold text-white/70">
          {currentIndex + 1} / {mediaMessages.length}
        </div>

        {/* Horizontal Filmstrip / Thumbnail List (Always active on PC / bigger screens) */}
        {mediaMessages.length > 1 && (
          <div
            ref={thumbnailsRef}
            className="hidden md:flex items-center gap-2 max-w-2xl overflow-x-auto py-1.5 px-3 scroll-slim rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md mt-1"
          >
            {mediaMessages.map((m, idx) => {
              const thumbUrl = getFullMediaUrl(m.mediaUrl);
              const isVideoThumb = /\.(mp4|webm|ogg|mov|m4v)$/i.test(m.mediaName || m.mediaUrl || "");
              const isSelected = currentIndex === idx;

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => scrollTo(idx)}
                  className={cn(
                    "relative size-12 rounded-xl overflow-hidden shrink-0 border transition-all active:scale-95 cursor-pointer",
                    isSelected
                      ? "border-accent ring-2 ring-accent/60 scale-105 opacity-100 shadow-md shadow-accent/20"
                      : "border-white/15 opacity-40 hover:opacity-85 hover:border-white/40"
                  )}
                  title={m.mediaName || `Media ${idx + 1}`}
                >
                  {isVideoThumb ? (
                    <div className="size-full bg-zinc-900 grid place-items-center relative">
                      <video
                        src={thumbUrl}
                        className="size-full object-cover pointer-events-none"
                        muted
                        preload="metadata"
                      />
                      <div className="absolute inset-0 grid place-items-center bg-black/40">
                        <Film className="size-3.5 text-white/90" />
                      </div>
                    </div>
                  ) : (
                    <img
                      src={thumbUrl}
                      alt={m.mediaName || ""}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </footer>
    </div>
  );
}
