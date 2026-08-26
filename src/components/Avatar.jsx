import { useMemo } from "react";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-7 text-[11px]",
  md: "size-9 text-xs",
  lg: "size-11 text-sm",
  xl: "size-16 text-lg font-semibold",
};

export function Avatar({ src, name = "", size = "md", online = false, className }) {
  const initials = useMemo(() => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [name]);

  return (
    <div className={cn("relative inline-block shrink-0 select-none", className)}>
      <div
        className={cn(
          "grid place-items-center overflow-hidden rounded-full bg-elevated font-medium text-foreground ring-1 ring-border shadow-sm",
          SIZES[size],
        )}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="size-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : null}
        <span className={src ? "sr-only" : ""}>{initials}</span>
      </div>

      {online && (
        <span
          aria-label="Online"
          className="absolute bottom-0 right-0 size-2.5 rounded-full bg-success ring-2 ring-background"
        />
      )}
    </div>
  );
}
