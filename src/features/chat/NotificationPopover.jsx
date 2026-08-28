import { useState } from "react";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  MessageSquare,
  AtSign,
  Heart,
  Info,
  AlertTriangle,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/useNotifications";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export function NotificationPopover() {
  const [filter, setFilter] = useState("all"); // 'all' | 'unread'
  const {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    handleNotificationClick,
  } = useNotifications();

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    return true;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case "MESSAGE":
        return <MessageSquare className="size-3 text-sky-400" />;
      case "MENTION":
        return <AtSign className="size-3 text-indigo-400" />;
      case "REACTION":
        return <Heart className="size-3 text-rose-400" />;
      case "ALERT":
        return <AlertTriangle className="size-3 text-amber-400" />;
      case "SYSTEM":
      default:
        return <Info className="size-3 text-emerald-400" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open Notifications"
          className="relative grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9.5px] font-bold text-accent-foreground shadow-xs shadow-accent/40 animate-in zoom-in-50 duration-150">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[340px] sm:w-[380px] p-0 bg-surface border-border/80 text-foreground shadow-2xl rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 bg-surface/80">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-foreground tracking-tight">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent border border-accent/25">
                {unreadCount} unread
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead()}
              className="flex items-center gap-1 text-[11px] font-medium text-accent hover:text-accent/80 transition-colors"
            >
              <CheckCheck className="size-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-border/40 px-3 py-1.5 bg-surface/40">
          <div className="flex gap-1 rounded-lg bg-surface p-0.5 border border-border/30 w-full">
            {[
              { id: "all", label: "All Activity" },
              { id: "unread", label: `Unread (${unreadCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "flex-1 rounded-md py-1 text-[11px] font-medium transition-all text-center",
                  filter === tab.id
                    ? "bg-accent/15 text-accent font-semibold border border-accent/30 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-elevated/40"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-[360px] overflow-y-auto scroll-slim p-1.5 space-y-1">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="size-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2.5 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="grid size-10 place-items-center rounded-full bg-elevated/60 text-muted-foreground/60 mb-2">
                <BellOff className="size-5" />
              </div>
              <p className="text-xs font-semibold text-foreground/80 mb-0.5">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </p>
              <p className="text-[11px] text-muted-foreground/70 max-w-[220px]">
                {filter === "unread"
                  ? "You've read all your recent updates."
                  : "Activity like direct messages and group updates will appear here."}
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const senderName = item.data?.username || item.title;
              const avatarSrc = item.data?.avatar;

              return (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={cn(
                    "group relative flex items-start gap-3 rounded-xl p-2.5 transition-all cursor-pointer select-none",
                    !item.is_read
                      ? "bg-elevated/70 hover:bg-elevated text-foreground"
                      : "hover:bg-surface/70 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {/* Avatar & Type Badge */}
                  <div className="relative shrink-0 pt-0.5">
                    <Avatar src={avatarSrc} name={senderName} size="md" />
                    <span className="absolute -bottom-1 -right-1 grid size-4.5 place-items-center rounded-full bg-surface ring-2 ring-surface shadow-xs">
                      {getTypeIcon(item.type)}
                    </span>
                  </div>

                  {/* Notification Content (Avatar -> sender/context -> preview -> time) */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span
                        className={cn(
                          "truncate text-[12.5px] tracking-tight",
                          !item.is_read ? "font-semibold text-foreground" : "font-medium text-foreground/90"
                        )}
                      >
                        {item.title}
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground/70 font-normal">
                        {formatRelative(item.created_at)}
                      </span>
                    </div>

                    <p className="line-clamp-2 text-[11.5px] text-muted-foreground/90 font-normal leading-relaxed">
                      {item.body}
                    </p>
                  </div>

                  {/* Actions & Unread Indicator Dot */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0 pt-1">
                    {!item.is_read && (
                      <span
                        aria-label="Unread notification"
                        className="size-2 rounded-full bg-accent shadow-xs shadow-accent/40"
                      />
                    )}

                    {!item.is_read && (
                      <button
                        type="button"
                        aria-label="Mark as read"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface transition-all"
                        title="Mark read"
                      >
                        <Check className="size-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
