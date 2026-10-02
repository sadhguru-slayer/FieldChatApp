import { useState, useRef, useEffect } from "react";
import { cn, getFullMediaUrl } from "@/lib/utils";

export function LazyGif({ src, alt = "GIF", className, onClick }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [isInViewport, setIsInViewport] = useState(false);

  const fullUrl = getFullMediaUrl(src);
  const isVideoFormat = /\.(mp4|webm|ogg|mov|m4v)$/i.test(src || "");

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsInViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting);
      },
      { threshold: 0.1, rootMargin: "50px" }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Control video playback based on viewport visibility
  useEffect(() => {
    if (!videoRef.current) return;
    if (isInViewport) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isInViewport]);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className={cn("relative overflow-hidden cursor-pointer select-none group/gif", className)}
    >
      {isVideoFormat ? (
        <video
          ref={videoRef}
          src={fullUrl}
          muted
          loop
          playsInline
          preload="metadata"
          className="size-full object-cover"
        />
      ) : (
        <img
          src={fullUrl}
          alt={alt}
          loading="lazy"
          className="size-full object-cover"
        />
      )}

      {/* Floating GIF Badge (like WhatsApp / Telegram) */}
      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white font-extrabold text-[9px] tracking-wider border border-white/10 shadow-xs font-mono select-none">
        GIF
      </div>
    </div>
  );
}
