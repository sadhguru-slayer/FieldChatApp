import { useState } from "react";
import { X } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { cn } from "@/lib/utils";

export function ReactionsDetailModal({ message, meId, onRemoveReaction, onClose }) {
  if (!message || !message.reactions || message.reactions.length === 0) return null;

  const reactions = message.reactions;
  const [selectedTab, setSelectedTab] = useState("all");

  const totalCount = reactions.reduce((acc, r) => acc + (r.count || 1), 0);

  const filteredReactions =
    selectedTab === "all"
      ? reactions
      : reactions.filter((r) => r.emoji === selectedTab);

  // Expand reactions into individual user items
  const userItems = [];
  filteredReactions.forEach((r) => {
    // If current user reacted with this emoji
    if (r.reactedByMe) {
      userItems.push({
        id: "me-" + r.emoji,
        name: "You",
        isMe: true,
        emoji: r.emoji,
      });
    }
    // Generate items for remaining counts
    const remainingCount = r.reactedByMe ? r.count - 1 : r.count;
    for (let i = 0; i < remainingCount; i++) {
      userItems.push({
        id: `user-${r.emoji}-${i}`,
        name: `User ${i + 1}`,
        isMe: false,
        emoji: r.emoji,
      });
    }
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-border/60 bg-surface text-foreground shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <h3 className="text-xs font-semibold tracking-tight text-foreground">Reactions</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Emoji Tabs */}
        <div className="scroll-slim flex gap-1 overflow-x-auto border-b border-border/40 px-3 py-2">
          <button
            type="button"
            onClick={() => setSelectedTab("all")}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
              selectedTab === "all"
                ? "bg-accent/15 text-accent font-semibold border border-accent/30"
                : "text-muted-foreground hover:bg-elevated hover:text-foreground"
            )}
          >
            <span>All</span>
            <span className="rounded-full bg-elevated px-1.5 py-0.2 text-[10px] tabular-nums text-muted-foreground">
              {totalCount}
            </span>
          </button>

          {reactions.map((r) => (
            <button
              key={r.emoji}
              type="button"
              onClick={() => setSelectedTab(r.emoji)}
              className={cn(
                "flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                selectedTab === r.emoji
                  ? "bg-accent/15 text-accent font-semibold border border-accent/30"
                  : "text-muted-foreground hover:bg-elevated hover:text-foreground"
              )}
            >
              <span>{r.emoji}</span>
              <span className="rounded-full bg-elevated px-1.5 py-0.2 text-[10px] tabular-nums text-muted-foreground">
                {r.count}
              </span>
            </button>
          ))}
        </div>

        {/* User List */}
        <div className="scroll-slim max-h-64 overflow-y-auto p-2 space-y-0.5">
          {userItems.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={!item.isMe}
              onClick={() => {
                if (item.isMe && onRemoveReaction) {
                  onRemoveReaction(message, item.emoji);
                  onClose();
                }
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors select-none",
                item.isMe
                  ? "hover:bg-destructive/10 group cursor-pointer border border-accent/20 bg-accent/5"
                  : "cursor-default"
              )}
            >
              <div className="flex items-center gap-3">
                <Avatar name={item.name} size="sm" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground">
                    {item.name}
                  </span>
                  {item.isMe && (
                    <span className="text-[10px] text-accent group-hover:text-destructive transition-colors">
                      Tap to remove
                    </span>
                  )}
                </div>
              </div>
              <span className="text-base">{item.emoji}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
