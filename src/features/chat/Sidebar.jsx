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
import { formatListTime } from "@/lib/format";
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
  const activeScreen = useAppStore((s) => s.activeScreen);
  const signOut = useAppStore((s) => s.signOut);

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
    
    // Clear unread badge optimistically in-memory
    queryClient.setQueryData(["conversations"], (old) => {
      if (!Array.isArray(old)) return old;
      return old.map((c) => (String(c.id) === String(id) ? { ...c, unread: 0 } : c));
    });
  };

  return (
    <aside
      className="flex h-full w-full flex-col select-none"
      style={{ background: "#17212b", borderRight: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* ── Top: User Header ─────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#1c2a38" }}
      >
        <button
          type="button"
          onClick={() => setActiveScreen("profile")}
          className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-80 transition-opacity"
        >
          <Avatar src={me?.avatar} name={me?.name || "User"} size="md" online />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[13px] font-semibold text-[#e3e3e3]">
              {me?.name || "User"}
            </h2>
            <p className="truncate text-[11px] text-[#5d8aa8]">
              {me?.customStatus || "Online"}
            </p>
          </div>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="User Options"
              className="grid size-8 place-items-center rounded-lg text-[#5d8aa8] transition-colors hover:bg-white/8 hover:text-[#e3e3e3]"
            >
              <MoreVertical className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-[#182533] border-white/10 text-[#e3e3e3]">
            <DropdownMenuItem onClick={() => setActiveScreen("profile")} className="gap-2 text-xs hover:bg-white/5 cursor-pointer">
              <User className="size-3.5 text-[#5d8aa8]" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveScreen("settings")} className="gap-2 text-xs hover:bg-white/5 cursor-pointer">
              <Settings className="size-3.5 text-[#5d8aa8]" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveScreen("devices")} className="gap-2 text-xs hover:bg-white/5 cursor-pointer">
              <Laptop className="size-3.5 text-[#5d8aa8]" /> Devices & Sessions
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem onClick={() => signOut()} className="gap-2 text-xs text-red-400 hover:bg-red-500/10 cursor-pointer">
              <LogOut className="size-3.5" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Search Bar ───────────────────────────────────────────────────── */}
      <div className="px-3 py-2">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="group flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-[12px] text-[#5d8aa8] transition-all hover:bg-white/8 hover:text-[#e3e3e3] border border-white/5 hover:border-white/10 shadow-sm"
          style={{
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <Search className="size-3.5 shrink-0 text-[#5d8aa8] group-hover:text-[#8ab4d0] transition-colors" />
          <span className="truncate font-normal">Search Fieldchat...</span>
          <kbd className="ml-auto rounded-md bg-white/5 px-1.5 py-0.5 text-[9px] font-mono text-[#5d8aa8] border border-white/10 group-hover:border-white/20 group-hover:text-[#8ab4d0] transition-colors">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* ── Filter Tabs ──────────────────────────────────────────────────── */}
      <div
        className="flex gap-0.5 px-3 pb-2"
      >
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
              "flex-1 rounded-lg py-1 text-[11px] font-medium transition-all",
              filter === t.id
                ? "text-[#e3e3e3] font-semibold"
                : "text-[#5d8aa8] hover:text-[#8ab4d0]"
            )}
            style={{
              background: filter === t.id ? "rgba(93,138,168,0.15)" : "transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Conversation List ─────────────────────────────────────────────── */}
      <div className="scroll-slim flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-1.5">
                <Skeleton className="size-11 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-2.5 w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[13px] font-semibold text-[#e3e3e3]/50 mb-1">No conversations</p>
            <p className="text-[11px] text-[#5d8aa8]/70">
              Create a group or direct message to begin.
            </p>
          </div>
        ) : (
          filtered.map((c) => {
            const isActive = activeId === String(c.id);
            const lastMsg = c.lastMessage;

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => selectConv(c.id)}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors relative",
                  isActive ? "bg-white/8" : "hover:bg-white/5"
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-r-full"
                    style={{ background: "#5d8aa8" }}
                  />
                )}

                <Avatar src={c.avatar} name={c.title} size="lg" className="shrink-0" />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="truncate text-[13.5px] font-semibold text-[#e3e3e3]">
                      {c.title}
                    </span>
                    {c.updatedAt > 0 && (
                      <span className="shrink-0 text-[11px] text-[#5d8aa8]">
                        {formatListTime(c.updatedAt)}
                      </span>
                    )}
                  </div>

                  <p className="line-clamp-1 text-[12px] text-[#5d8aa8]">
                    {lastMsg
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
                  <span
                    className="grid size-5 place-items-center rounded-full text-[10px] font-bold text-white shrink-0"
                    style={{ background: "#5d8aa8" }}
                  >
                    {c.unread}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* ── Bottom Actions: New Group & New DM ─────────────────────────── */}
      <div
        className="flex items-center gap-2 border-t px-3 py-3"
        style={{ borderColor: "rgba(255,255,255,0.07)", background: "#1c2a38" }}
      >
        <button
          type="button"
          onClick={() => setCreateGroupOpen(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[12px] font-medium text-[#5d8aa8] transition-colors hover:bg-white/8 hover:text-[#e3e3e3]"
        >
          <Users className="size-4" />
          New Group
        </button>
        <div className="h-6 w-px" style={{ background: "rgba(255,255,255,0.08)" }} />
        <button
          type="button"
          onClick={() => setCreateDmOpen(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[12px] font-medium text-[#5d8aa8] transition-colors hover:bg-white/8 hover:text-[#e3e3e3]"
        >
          <MessageSquarePlus className="size-4" />
          New DM
        </button>
      </div>
    </aside>
  );
}


