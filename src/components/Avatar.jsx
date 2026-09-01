import { useMemo, useState, useEffect } from "react";
import { cn, getFullMediaUrl } from "@/lib/utils";

const SIZES = {
  sm: "size-7 text-[11px]",
  md: "size-9 text-xs",
  lg: "size-11 text-sm",
  xl: "size-16 text-lg font-semibold",
};

export function Avatar({ src, name = "", size = "md", online = false, className }) {
  const [imageError, setImageError] = useState(false);

  // Reset image error state whenever src changes
  useEffect(() => {
    setImageError(false);
  }, [src]);

  const initials = useMemo(() => {
    if (!name) return "?";
    const clean = name.trim();
    if (
      !clean ||
      clean.toLowerCase() === "unknown sender" ||
      clean.toLowerCase() === "unknown" ||
      clean.toLowerCase() === "someone"
    ) {
      return "?";
    }
    if (clean.toLowerCase() === "user" || clean.toLowerCase() === "you") {
      return clean[0].toUpperCase();
    }
    const parts = clean.split(/\s+/);
    if (parts.length === 1) {
      return clean.length === 1
        ? clean.toUpperCase()
        : clean.slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [name]);

  const fullSrc = getFullMediaUrl(src);
  const showImage = fullSrc && !imageError;

  return (
    <div className={cn("relative inline-block shrink-0 select-none", className)}>
      <div
        className={cn(
          "grid place-items-center overflow-hidden rounded-full bg-elevated font-medium text-foreground ring-1 ring-border shadow-sm",
          SIZES[size]
        )}
      >
        {showImage ? (
          <img
            src={fullSrc}
            alt={name}
            className="size-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="font-semibold text-foreground/90">{initials}</span>
        )}
      </div>

      {online && (
        <span
          aria-label="Online"
          className="absolute bottom-0 right-0 size-2.5 rounded-full bg-success ring-2 ring-background z-10"
        />
      )}
    </div>
  );
}
