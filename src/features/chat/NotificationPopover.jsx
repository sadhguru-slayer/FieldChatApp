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
  UserPlus,
  UserMinus,
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

  const getTypeIcon = (item) => {
    const action = item.data?.action;
    if (action === "ADDED_TO_GROUP") {
      return (
        <span className="grid size-4.5 place-items-center rounded-full bg-emerald-500 text-zinc-950 border border-zinc-950 shadow-xs font-bold">
          <UserPlus className="size-2.5" />
        </span>
      );
    }
    if (action === "REMOVED_FROM_GROUP") {
      return (
        <span className="grid size-4.5 place-items-center rounded-full bg-rose-500 text-white border border-zinc-950 shadow-xs">
          <UserMinus className="size-2.5" />
        </span>
      );
    }

    switch (item.type) {
      case "MESSAGE":
        return (
          <span className="grid size-4.5 place-items-center rounded-full bg-sky-500 text-white border border-zinc-950 shadow-xs">
            <MessageSquare className="size-2.5" />
          </span>
        );
      case "MENTION":
        return (
          <span className="grid size-4.5 place-items-center rounded-full bg-indigo-500 text-white border border-zinc-950 shadow-xs">
            <AtSign className="size-2.5" />
          </span>
        );
      case "REACTION":
        return (
          <span className="grid size-4.5 place-items-center rounded-full bg-rose-500 text-white border border-zinc-950 shadow-xs">
            <Heart className="size-2.5" />
          </span>
        );
      case "ALERT":
        return (
          <span className="grid size-4.5 place-items-center rounded-full bg-amber-500 text-zinc-950 border border-zinc-950 shadow-xs font-bold">
            <AlertTriangle className="size-2.5" />
          </span>
        );
      case "SYSTEM":
      default:
        return (
          <span className="grid size-4.5 place-items-center rounded-full bg-zinc-700 text-zinc-100 border border-zinc-950 shadow-xs">
            <Info className="size-2.5" />
          </span>
        );
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open Notifications"
          className="relative grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground select-none"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[9.5px] font-bold text-white shadow-md shadow-indigo-500/30 fc-scale-in">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[360px] sm:w-[400px] p-0 bg-zinc-950/95 border border-zinc-800/80 text-foreground shadow-2xl rounded-2xl overflow-hidden backdrop-blur-2xl fc-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/60 px-4 py-3 bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="grid size-7 place-items-center rounded-lg bg-zinc-800/80 border border-zinc-700/50 text-zinc-300">
              <Bell className="size-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-100 tracking-tight leading-none mb-0.5">
                Notifications
              </h3>
              <p className="text-[10px] text-zinc-400 font-normal">
                Stay updated with activity
              </p>
            </div>
            {unreadCount > 0 && (
              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/30">
                {unreadCount} new
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead()}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all border border-transparent hover:border-indigo-500/20"
            >
              <CheckCheck className="size-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-zinc-800/60 px-3 py-2 bg-zinc-900/20">
          <div className="flex gap-1 rounded-xl bg-zinc-900 p-1 border border-zinc-800/80 w-full">
            {[
              { id: "all", label: "All Activity" },
              { id: "unread", label: `Unread ${unreadCount > 0 ? `(${unreadCount})` : ''}` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "flex-1 rounded-lg py-1.5 text-[11px] font-medium transition-all text-center select-none",
                  filter === tab.id
                    ? "bg-zinc-800 text-zinc-100 font-semibold shadow-xs border border-zinc-700/60"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List - Clean Edge-to-Edge List */}
        <div className="max-h-[380px] overflow-y-auto scroll-slim divide-y divide-zinc-800/40">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-full shrink-0 bg-zinc-800" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-3/4 bg-zinc-800" />
                    <Skeleton className="h-2.5 w-1/2 bg-zinc-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <div className="grid size-12 place-items-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-500 mb-3 shadow-inner">
                <BellOff className="size-5" />
              </div>
              <p className="text-xs font-bold text-zinc-200 mb-1">
                {filter === "unread" ? "No unread notifications" : "Quiet for now"}
              </p>
              <p className="text-[11px] text-zinc-400/80 max-w-[220px] leading-relaxed">
                {filter === "unread"
                  ? "You've read all your updates!"
                  : "Direct messages and group invites will appear here."}
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
                    "group relative flex items-start gap-3.5 px-4 py-3 transition-colors cursor-pointer select-none border-l-2",
                    !item.is_read
                      ? "bg-zinc-900/40 border-l-indigo-500 text-zinc-100 hover:bg-zinc-900/80"
                      : "bg-transparent border-l-transparent text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
                  )}
                >
                  {/* Avatar & Type Badge */}
                  <div className="relative shrink-0 pt-0.5">
                    <Avatar src={avatarSrc} name={senderName} size="md" />
                    <span className="absolute -bottom-1 -right-1">
                      {getTypeIcon(item)}
                    </span>
                  </div>

                  {/* Notification Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5 mb-0.5">
                      <span
                        className={cn(
                          "truncate text-xs tracking-tight",
                          !item.is_read ? "font-bold text-zinc-100" : "font-medium text-zinc-300"
                        )}
                      >
                        {item.title}
                      </span>
                      <span className="shrink-0 text-[10px] text-zinc-500 font-normal">
                        {formatRelative(item.created_at)}
                      </span>
                    </div>

                    <p className="line-clamp-2 text-[11.5px] text-zinc-400 font-normal leading-relaxed">
                      {item.body}
                    </p>
                  </div>

                  {/* Actions & Unread Indicator Dot */}
                  <div className="flex flex-col items-end gap-2 shrink-0 pt-1">
                    {!item.is_read && (
                      <span
                        aria-label="Unread notification"
                        className="size-2 rounded-full bg-indigo-500 shadow-xs shadow-indigo-500/50"
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
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
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
