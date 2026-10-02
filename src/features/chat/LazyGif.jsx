import { useState, useRef, useEffect } from "react";
import { cn, getFullMediaUrl } from "@/lib/utils";

export function LazyGif({ src, alt = "GIF", isVideo = false, className, onClick }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [isInViewport, setIsInViewport] = useState(true);

  const fullUrl = getFullMediaUrl(src);
  const cleanUrl = (src || "").split("?")[0].split("#")[0].toLowerCase();
  const cleanAlt = (alt || "").split("?")[0].split("#")[0].toLowerCase();
  const isVideoFormat =
    isVideo ||
    /\.(mp4|webm|ogg|mov|m4v)$/i.test(cleanUrl) ||
    /\.(mp4|webm|ogg|mov|m4v)$/i.test(cleanAlt) ||
    (!/\.(gif|png|jpe?g|webp|svg)$/i.test(cleanUrl) && !/\.(gif|png|jpe?g|webp|svg)$/i.test(cleanAlt));

  const tryPlay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }
  };

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
      { threshold: 0.05, rootMargin: "80px" }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Control video playback based on viewport visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isInViewport) {
      tryPlay();
    } else {
      video.pause();
    }
  }, [isInViewport, fullUrl]);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className={cn("relative overflow-hidden cursor-pointer select-none group/gif", className)}
    >
      {isVideoFormat ? (
        <video
          ref={(el) => {
            if (el) {
              el.defaultMuted = true;
              el.muted = true;
            }
            videoRef.current = el;
          }}
          src={fullUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={tryPlay}
          onCanPlay={tryPlay}
          className="size-full object-cover pointer-events-none"
        />
      ) : (
        <img
          src={fullUrl}
          alt={alt}
          loading="lazy"
          className="size-full object-cover pointer-events-none"
        />
      )}

      {/* Floating GIF Badge (like WhatsApp / Telegram) */}
      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white font-extrabold text-[9px] tracking-wider border border-white/10 shadow-xs font-mono select-none pointer-events-none">
        GIF
      </div>
    </div>
  );
}
