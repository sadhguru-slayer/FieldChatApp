import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquarePlus, Plus, Search, Settings, Users, User, Laptop, LogOut, MoreVertical } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/useAppStore";
import { getConversations, getMe } from "@/services/api";
import { formatListTime, formatLastSeen } from "@/lib/format";
import { NotificationPopover } from "./NotificationPopover";
import { cn } from "@/lib/utils";

export function Sidebar({ onOpenSettings }) {
  const activeId = useAppStore((s) => s.activeId);
  const setActiveId = useAppStore((s) => s.setActiveId);
  const filter = useAppStore((s) => s.filter);
  const setFilter = useAppStore((s) => s.setFilter);
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);
  const setCreateGroupOpen = useAppStore((s) => s.setCreateGroupOpen);
  const setCreateDmOpen = useAppStore((s) => s.setCreateDmOpen);
  const setMobileView = useAppStore((s) => s.setMobileView);
  const setActiveScreen = useAppStore((s) => s.setActiveScreen);
  const signOut = useAppStore((s) => s.signOut);
  const presence = useAppStore((s) => s.presence);

  const queryClient = useQueryClient();

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe });

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
    staleTime: 15000,
  });

  const filtered = conversations.filter((c) => {
    if (filter === "groups") return c.type === "group";
    if (filter === "dms") return c.type === "dm";
    return true;
  });

  const selectConv = (id) => {
    setActiveId(id);
    setActiveScreen("chat");
    setMobileView("chat");

    queryClient.setQueryData(["conversations"], (old) => {
      if (!Array.isArray(old)) return old;
      return old.map((c) => (String(c.id) === String(id) ? { ...c, unread: 0 } : c));
    });
  };

  return (
    <aside className="flex h-full w-full flex-col select-none border-r border-border/40 bg-sidebar text-sidebar-foreground">
      {/* ── Top Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border/40 px-3.5 py-3 bg-surface/40">
        <button
          type="button"
          onClick={() => setActiveScreen("profile")}
          className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-85 transition-opacity"
        >
          <Avatar src={me?.avatar} name={me?.name || "User"} size="md" online />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xs font-semibold text-foreground tracking-tight">
              {me?.name || "User"}
            </h2>
            <p className="truncate text-[11px] text-muted-foreground font-normal">
              {me?.customStatus || "Online"}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-0.5 shrink-0">
          <NotificationPopover />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="User Options"
                className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
              >
                <MoreVertical className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-surface border-border text-foreground shadow-lg">
              <DropdownMenuItem onClick={() => setActiveScreen("profile")} className="gap-2 text-xs hover:bg-elevated cursor-pointer">
                <User className="size-3.5 text-muted-foreground" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveScreen("settings")} className="gap-2 text-xs hover:bg-elevated cursor-pointer">
                <Settings className="size-3.5 text-muted-foreground" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveScreen("devices")} className="gap-2 text-xs hover:bg-elevated cursor-pointer">
                <Laptop className="size-3.5 text-muted-foreground" /> Devices & Sessions
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/60" />
              <DropdownMenuItem onClick={() => signOut()} className="gap-2 text-xs text-destructive hover:bg-destructive/10 cursor-pointer">
                <LogOut className="size-3.5" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Search Bar ───────────────────────────────────────────────────── */}
      <div className="px-3 pt-3 pb-1.5">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="group flex h-8.5 w-full items-center gap-2.5 rounded-lg px-2.5 text-xs text-muted-foreground transition-all hover:bg-elevated/70 hover:text-foreground border border-border/40 bg-surface/60 shadow-2xs focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Search className="size-3.5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span className="truncate font-normal text-[11.5px]">Search Fieldchat...</span>
          <kbd className="ml-auto rounded-md bg-accent/10 px-1.5 py-0.5 text-[9px] font-mono text-accent font-medium border border-accent/20">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* ── Filter Tabs ──────────────────────────────────────────────────── */}
      <div className="px-3 py-2">
        <div className="flex gap-1 rounded-lg bg-surface/80 p-0.5 border border-border/30">
          {[
            { id: "all", label: "All" },
            { id: "groups", label: "Groups" },
            { id: "dms", label: "Direct" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilter(t.id)}
              className={cn(
                "flex-1 rounded-md py-1 text-[11px] font-medium transition-all",
                filter === t.id
                  ? "bg-accent/15 text-accent font-semibold border border-accent/30 shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-elevated/30"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Conversation List Wrapper with Floating Action Button ────────── */}
      <div className="relative flex-1 min-h-0 overflow-hidden flex flex-col">
        <div className="scroll-slim flex-1 overflow-y-auto px-1.5 py-1">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-2.5 py-2">
                  <Skeleton className="size-10 rounded-full shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2.5 w-36" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs font-medium text-muted-foreground mb-1">No conversations</p>
              <p className="text-[11px] text-muted-foreground/70">
                Start a direct message or create a group to begin.
              </p>
            </div>
          ) : (
            filtered.map((c) => {
              const isActive = activeId === String(c.id);
              const lastMsg = c.lastMessage;
              const isDm = c.type === "dm";
              const wsPresence = isDm && c.otherUserId ? presence[String(c.otherUserId)] : undefined;
              const isOnline = isDm
                ? (wsPresence !== undefined ? wsPresence.online : Boolean(c.isOnline))
                : false;
              const lastSeenTs = isDm
                ? (wsPresence !== undefined ? wsPresence.lastSeen : c.lastSeen)
                : null;
              const lastSeenText = !isOnline ? formatLastSeen(lastSeenTs) : null;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectConv(c.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-all mb-0.5 relative group",
                    isActive
                      ? "bg-elevated text-foreground font-medium shadow-2xs before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-1 before:rounded-r-full before:bg-accent"
                      : "hover:bg-surface/70 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {/* Avatar with online dot */}
                  <div className="relative shrink-0">
                    <Avatar src={c.avatar} name={c.title} size="md" />
                    {isDm && (
                      <span
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-sidebar transition-all duration-300",
                          isOnline
                            ? "bg-emerald-500"
                            : "bg-zinc-600"
                        )}
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={cn("truncate text-[13px] tracking-tight", isActive ? "font-semibold text-foreground" : "font-medium text-foreground/90")}>
                        {c.title}
                      </span>
                      {c.updatedAt > 0 && (
                        <span className="shrink-0 text-[10.5px] text-muted-foreground/80 font-normal">
                          {formatListTime(c.updatedAt)}
                        </span>
                      )}
                    </div>

                    <p className="line-clamp-1 text-[11.5px] text-muted-foreground font-normal">
                      {isDm && !isOnline && lastSeenText ? (
                        <span className="text-[10.5px] text-muted-foreground/70">
                          {lastSeenText}
                        </span>
                      ) : lastMsg
                        ? lastMsg.deletedForEveryone
                          ? "🚫 Message removed"
                          : lastMsg.senderName && c.type === "group"
                          ? `${lastMsg.senderName}: ${lastMsg.text}`
                          : lastMsg.text || "New conversation"
                        : c.type === "group"
                        ? "Group created"
                        : "Say hello!"}
                    </p>
                  </div>

                  {c.unread > 0 && (
                    <span className="grid min-w-4.5 h-4.5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground shrink-0 shadow-xs shadow-accent/25">
                      {c.unread}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* ── Floating Action Button (FAB) Speed Dial ────────────────── */}
        <FloatingActionButton
          onNewDm={() => setCreateDmOpen(true)}
          onNewGroup={() => setCreateGroupOpen(true)}
        />
      </div>
    </aside>
  );
}

function FloatingActionButton({ onNewDm, onNewGroup }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Outside click backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/20 backdrop-blur-[1px] animate-in fade-in-0 duration-150"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className="absolute right-3.5 z-30 flex flex-col items-end gap-2.5"
        style={{
          bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* Speed Dial Actions */}
        {open && (
          <div className="flex flex-col items-end gap-2 animate-in fade-in-0 slide-in-from-bottom-3 duration-200">
            {/* New Group Action */}
            <button
              type="button"
              onClick={() => {
                onNewGroup();
                setOpen(false);
              }}
              className="group flex items-center gap-2.5 rounded-full pl-3 pr-1.5 py-1.5 bg-surface border border-border/60 text-foreground shadow-lg transition-all hover:bg-elevated active:scale-95"
            >
              <span className="text-[11.5px] font-semibold text-foreground tracking-tight select-none">
                New Group
              </span>
              <div className="grid size-7 place-items-center rounded-full bg-elevated border border-border/40 text-muted-foreground group-hover:text-foreground">
                <Users className="size-3.5" />
              </div>
            </button>

            {/* New DM Action */}
            <button
              type="button"
              onClick={() => {
                onNewDm();
                setOpen(false);
              }}
              className="group flex items-center gap-2.5 rounded-full pl-3 pr-1.5 py-1.5 bg-surface border border-border/60 text-foreground shadow-lg transition-all hover:bg-elevated active:scale-95"
            >
              <span className="text-[11.5px] font-semibold text-foreground tracking-tight select-none">
                New DM
              </span>
              <div className="grid size-7 place-items-center rounded-full bg-elevated border border-border/40 text-muted-foreground group-hover:text-foreground">
                <MessageSquarePlus className="size-3.5" />
              </div>
            </button>
          </div>
        )}

        {/* Main Trigger Button */}
        <button
          type="button"
          aria-label={open ? "Close actions" : "Create new chat"}
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            "grid size-11 place-items-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/30 transition-all duration-200 active:scale-95 hover:scale-105",
            open && "bg-elevated text-foreground border border-border/60 shadow-xl"
          )}
        >
          <Plus
            className={cn(
              "size-5 transition-transform duration-300",
              open ? "rotate-45" : "rotate-0"
            )}
          />
        </button>
      </div>
    </>
  );
}


