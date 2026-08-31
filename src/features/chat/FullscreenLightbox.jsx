import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, Download, User } from "lucide-react";
import { cn } from "@/lib/utils";

function getFullMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:9000${url}`;
  }
  return `http://localhost:9000${url}`;
}

export function FullscreenLightbox({ message, messages = [], onClose, onSelect }) {
  const [zoomLevel, setZoomLevel] = useState(1);

  // Filter messages to get only media items (images and videos)
  const mediaMessages = messages.filter((m) => {
    return m.mediaUrl && /\.(jpeg|jpg|gif|png|webp|svg|mp4|webm|ogg|mov|m4v)$/i.test(m.mediaName || m.mediaUrl || "");
  });

  const currentIndex = mediaMessages.findIndex((m) => m.id === message.id);

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelect(mediaMessages[currentIndex - 1]);
      setZoomLevel(1);
    }
  };

  const handleNext = () => {
    if (currentIndex < mediaMessages.length - 1) {
      onSelect(mediaMessages[currentIndex + 1]);
      setZoomLevel(1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, mediaMessages]);

  // Touch navigation for mobile swipes
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 60;
    const diff = touchStartX.current - touchEndX.current;

    if (diff > swipeThreshold) {
      handleNext();
    } else if (diff < -swipeThreshold) {
      handlePrev();
    }
  };

  if (currentIndex === -1) return null;

  const currentMsg = mediaMessages[currentIndex];
  const fullUrl = getFullMediaUrl(currentMsg.mediaUrl);
  const senderName = currentMsg.senderName || currentMsg.display_name || currentMsg.username || "Someone";
  const caption = currentMsg.text || "";
  const isVideo = /\.(mp4|webm|ogg|mov|m4v)$/i.test(currentMsg.mediaName || currentMsg.mediaUrl || "");
  const filename = currentMsg.mediaName || (isVideo ? "video.mp4" : "image.jpg");

  const handleZoomToggle = () => {
    setZoomLevel((z) => (z === 1 ? 2 : 1));
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col justify-between bg-zinc-950/98 backdrop-blur-md select-none text-zinc-100"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent z-10">
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <div className="grid size-8 place-items-center rounded-full bg-zinc-800 shrink-0">
            <User className="size-4 text-zinc-300" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate text-zinc-200">
              {senderName}
            </p>
            <p className="text-[10px] text-zinc-400 truncate">
              {filename}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Download button */}
          <a
            href={fullUrl}
            download={filename}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new tab / Download"
            className="grid size-9 place-items-center rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 hover:text-white transition-all active:scale-95 cursor-pointer"
          >
            <Download className="size-4" />
          </a>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close viewer"
            className="grid size-9 place-items-center rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 hover:text-white transition-all active:scale-95"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div 
        className="relative flex-1 flex items-center justify-center overflow-hidden px-4"
        onClick={onClose}
      >
        {/* Left Arrow (Desktop) */}
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="absolute left-4 z-20 hidden md:grid size-12 place-items-center rounded-full bg-black/40 hover:bg-black/75 border border-white/5 text-zinc-300 hover:text-white transition-all active:scale-90"
          >
            <ChevronLeft className="size-6" />
          </button>
        )}

        {/* Media content (Image or Video) */}
        {isVideo ? (
          <video
            key={currentMsg.id}
            src={fullUrl}
            controls
            autoPlay
            playsInline
            className="max-w-full max-h-[75vh] md:max-h-[80vh] rounded-lg shadow-2xl outline-none z-10"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div 
            className="relative max-w-full max-h-[80vh] flex items-center justify-center transition-transform duration-250 ease-out"
            style={{ transform: `scale(${zoomLevel})` }}
            onClick={(e) => { e.stopPropagation(); handleZoomToggle(); }}
          >
            <img
              src={fullUrl}
              alt={filename}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl cursor-zoom-in"
            />
          </div>
        )}

        {/* Right Arrow (Desktop) */}
        {currentIndex < mediaMessages.length - 1 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="absolute right-4 z-20 hidden md:grid size-12 place-items-center rounded-full bg-black/40 hover:bg-black/75 border border-white/5 text-zinc-300 hover:text-white transition-all active:scale-90"
          >
            <ChevronRight className="size-6" />
          </button>
        )}
      </div>

      {/* Bottom Info Bar */}
      <div className="bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 pb-6 z-10 flex flex-col items-center text-center">
        {caption && (
          <p className="text-xs md:text-sm font-normal text-zinc-200 max-w-2xl line-clamp-3 mb-2 leading-relaxed">
            {caption}
          </p>
        )}
        
        {/* Slide indicators / pagination */}
        <div className="px-3 py-1 rounded-full bg-black/50 border border-white/5 text-[10px] tracking-wider font-semibold text-zinc-400">
          {currentIndex + 1} / {mediaMessages.length}
        </div>
      </div>
    </div>
  );
}
