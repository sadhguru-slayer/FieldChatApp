import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Globe, ExternalLink } from "lucide-react";
import { getLinkPreview } from "@/services/api";
import { cn } from "@/lib/utils";

// Regex for extracting standard HTTP/HTTPS URLs
const FIRST_URL_REGEX = /(?:https?:\/\/|www\.)[^\s<>()]+(?:\([^\s<>()]+\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’])/i;

export function extractFirstUrl(text) {
  if (!text) return null;
  const match = text.match(FIRST_URL_REGEX);
  if (!match) return null;
  const raw = match[0];
  return raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
}

export function LinkPreview({ text, mine = false, className }) {
  const [imgError, setImgError] = useState(false);
  const targetUrl = extractFirstUrl(text);

  const { data: preview, isLoading } = useQuery({
    queryKey: ["link-preview", targetUrl],
    queryFn: () => getLinkPreview(targetUrl),
    enabled: !!targetUrl,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours cache
    gcTime: 1000 * 60 * 60 * 24,
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (!targetUrl || isLoading || !preview || !preview.success) {
    return null;
  }

  // If there's neither a title, description, nor image, ignore it
  if (!preview.title && !preview.description && !preview.image) {
    return null;
  }

  const handleClick = (e) => {
    e.stopPropagation();
    window.open(preview.url || targetUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      onClick={handleClick}
      role="link"
      tabIndex={0}
      className={cn(
        "group/lp my-1.5 flex flex-col overflow-hidden rounded-xl border transition-all duration-150 cursor-pointer select-none text-left",
        mine
          ? "border-white/15 bg-black/35 hover:bg-black/45 text-white"
          : "border-border/50 bg-surface/80 hover:bg-elevated/70 text-foreground",
        className
      )}
    >
      {preview.image && !imgError && (
        <div className="relative w-full overflow-hidden bg-black/40 max-h-36 aspect-[16/9]">
          <img
            src={preview.image}
            alt={preview.title || "Link preview thumbnail"}
            loading="lazy"
            onError={() => setImgError(true)}
            className="size-full object-cover transition-transform duration-300 group-hover/lp:scale-[1.02]"
          />
        </div>
      )}

      <div className="p-2.5 flex flex-col justify-between">
        {preview.title && (
          <h4 className="line-clamp-2 text-xs font-semibold leading-snug tracking-tight text-foreground/95">
            {preview.title}
          </h4>
        )}

        {preview.description && (
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
            {preview.description}
          </p>
        )}

        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground/80 font-mono truncate">
          {preview.favicon ? (
            <img
              src={preview.favicon}
              alt=""
              className="size-3.5 rounded-xs shrink-0"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <Globe className="size-3 shrink-0" />
          )}
          <span className="truncate">{preview.domain || targetUrl}</span>
          <ExternalLink className="size-2.5 opacity-0 group-hover/lp:opacity-100 transition-opacity shrink-0 ml-auto" />
        </div>
      </div>
    </div>
  );
}
