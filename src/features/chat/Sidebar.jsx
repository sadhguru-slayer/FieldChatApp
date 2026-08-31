import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquarePlus,
  Plus,
  Search,
  Settings,
  Users,
  User,
  Laptop,
  LogOut,
  MoreVertical,
  Menu,
  X,
  ChevronRight,
  MessageCircle,
  Bell,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/store/useAppStore";
import { getConversations, getMe, markAllAsRead, clearChat } from "@/services/api";
import { formatListTime, formatLastSeen } from "@/lib/format";
import { NotificationPopover } from "./NotificationPopover";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import { useAnimatePresence } from "@/hooks/useAnimatePresence";

// ─── Desktop Hamburger Drawer ─────────────────────────────────────────────────
export function DesktopMenuDrawer({ isOpen, me, onClose }) {
  const { shouldRender, isClosing } = useAnimatePresence(isOpen, 180);
  const setActiveScreen = useAppStore((s) => s.setActiveScreen);
  const signOut = useAppStore((s) => s.signOut);
  const setCreateGroupOpen = useAppStore((s) => s.setCreateGroupOpen);
  const setCreateDmOpen = useAppStore((s) => s.setCreateDmOpen);

  if (!shouldRender) return null;

  const navItems = [
    { icon: User, label: "Profile", screen: "profile", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
    { icon: Settings, label: "Settings", screen: "settings", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
    { icon: Laptop, label: "Devices & Sessions", screen: "devices", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  ];

  return (
    <>
      {/* Semi-transparent backdrop — shows app content behind it */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 cursor-pointer",
          isClosing ? "fc-fade-out" : "fc-fade-in"
        )}
        style={{ backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />

      {/* Slide-in drawer from left */}
      <div
        className={cn(
          "fixed left-0 top-0 bottom-0 z-50 w-[275px] flex flex-col bg-sidebar/98 border-r border-border/40 shadow-2xl",
          isClosing ? "fc-slide-out-left" : "fc-slide-in-left"
        )}
        style={{ backdropFilter: "blur(20px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-5 pb-4 border-b border-border/30">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full overflow-hidden border border-border/20">
              <img src="/Logo.svg" alt="Logo" className="size-full object-contain scale-[1.2] origin-center" />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground uppercase">Fieldchat</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-elevated transition-all"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* User Profile Card */}
        <button
          type="button"
          onClick={() => { setActiveScreen("profile"); onClose(); }}
          className="flex items-center gap-3.5 px-4 py-4 border-b border-border/20 hover:bg-surface/60 transition-all text-left group"
        >
          <Avatar src={me?.avatar} name={me?.display_name || me?.name || "User"} size="lg" online />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">{me?.display_name || me?.name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">@{me?.username}</p>
            <p className="text-[11px] text-emerald-400 mt-0.5 font-medium">{me?.customStatus || "Online"}</p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors shrink-0" />
        </button>

        {/* Quick Actions */}
        <div className="p-3 border-b border-border/20 space-y-1.5">
          <button
            type="button"
            onClick={() => { setCreateDmOpen(true); onClose(); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-foreground bg-surface/50 hover:bg-elevated border border-border/30 transition-all group"
          >
            <MessageSquarePlus className="size-4 text-accent" />
            <span>New Direct Message</span>
          </button>
          <button
            type="button"
            onClick={() => { setCreateGroupOpen(true); onClose(); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-foreground bg-surface/50 hover:bg-elevated border border-border/30 transition-all group"
          >
            <Users className="size-4 text-violet-400" />
            <span>New Group</span>
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto scroll-slim">
          <p className="px-3 pt-2 pb-1 text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground/60">
            Account & App
          </p>
          {navItems.map(({ icon: Icon, label, screen, color, bg }) => (
            <button
              key={screen}
              type="button"
              onClick={() => { setActiveScreen(screen); onClose(); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-foreground/80 hover:bg-elevated hover:text-foreground transition-all group"
            >
              <div className={cn("grid size-8 place-items-center rounded-lg border shrink-0 transition-transform group-hover:scale-105", bg)}>
                <Icon className={cn("size-4", color)} />
              </div>
              <span className="font-medium text-[13px]">{label}</span>
              <ChevronRight className="ml-auto size-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
            </button>
          ))}
        </div>

        {/* Sign Out */}
        <div className="px-3 pb-6 pt-2 border-t border-border/30">
          <button
            type="button"
            onClick={() => { signOut(); onClose(); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-destructive hover:bg-destructive/10 transition-all group"
          >
            <div className="grid size-8 place-items-center rounded-lg border border-destructive/20 bg-destructive/10 shrink-0">
              <LogOut className="size-4" />
            </div>
            <span className="font-medium text-[13px]">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Floating Action Button ────────────────────────────────────────────────────
function FloatingActionButton({ onNewDm, onNewGroup }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/20 fc-fade-in"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="absolute right-4 z-30 flex flex-col items-end gap-2.5 bottom-[calc(5.3rem+env(safe-area-inset-bottom,0px))] md:bottom-6">
        {/* Speed Dial Actions */}
        {open && (
          <div className="flex flex-col items-end gap-2.5 fc-slide-up-sm">
            {/* New Group */}
            <button
              type="button"
              onClick={() => { onNewGroup(); setOpen(false); }}
              className="group flex items-center gap-2.5 rounded-full pl-3.5 pr-1.5 py-1.5 bg-surface/95 backdrop-blur-sm border border-border/60 text-foreground shadow-xl transition-all hover:bg-elevated hover:shadow-2xl active:scale-95 no-tap-highlight"
            >
              <span className="text-[12px] font-semibold text-foreground tracking-tight select-none">New Group</span>
              <div className="grid size-8 place-items-center rounded-full bg-elevated border border-border/40 text-muted-foreground group-hover:text-foreground transition-colors">
                <Users className="size-3.5" />
              </div>
            </button>

            {/* New DM */}
            <button
              type="button"
              onClick={() => { onNewDm(); setOpen(false); }}
              className="group flex items-center gap-2.5 rounded-full pl-3.5 pr-1.5 py-1.5 bg-surface/95 backdrop-blur-sm border border-border/60 text-foreground shadow-xl transition-all hover:bg-elevated hover:shadow-2xl active:scale-95 no-tap-highlight"
            >
              <span className="text-[12px] font-semibold text-foreground tracking-tight select-none">New Message</span>
              <div className="grid size-8 place-items-center rounded-full bg-elevated border border-border/40 text-muted-foreground group-hover:text-foreground transition-colors">
                <MessageSquarePlus className="size-3.5" />
              </div>
            </button>
          </div>
        )}

        {/* Main Trigger */}
        <button
          type="button"
          aria-label={open ? "Close" : "New chat"}
          onClick={() => setOpen((p) => !p)}
          className={cn(
            "grid size-11 place-items-center rounded-full shadow-xl transition-all duration-250 active:scale-95 no-tap-highlight",
            open
              ? "bg-elevated text-foreground border border-border/60 shadow-2xl rotate-45"
              : "bg-accent text-accent-foreground shadow-accent/30 hover:shadow-accent/40 hover:scale-105"
          )}
          style={{ width: 44, height: 44 }}
        >
          <Plus className={cn("size-4.5 transition-transform duration-250", open ? "rotate-45" : "rotate-0")} />
        </button>
      </div>
    </>
  );
}

// ─── Conversation Item ─────────────────────────────────────────────────────────
function ConvItem({ c, isActive, onClick, presence, onMarkAsRead, onClearChat }) {
  const isDm = c.type === "dm";
  const wsPresence = isDm && c.otherUserId ? presence[String(c.otherUserId)] : undefined;
  const isOnline = isDm
    ? (wsPresence !== undefined ? wsPresence.online : Boolean(c.isOnline))
    : false;
  const lastSeenTs = isDm
    ? (wsPresence !== undefined ? wsPresence.lastSeen : c.lastSeen)
    : null;
  const lastSeenText = !isOnline ? formatLastSeen(lastSeenTs) : null;
  const lastMsg = c.lastMessage;

  const preview = (() => {
    if (!lastMsg) return isDm ? "Say hello!" : "Group created";
    if (lastMsg.deletedForEveryone) return "🚫 Message removed";
    const name = lastMsg.senderName || lastMsg.display_name || lastMsg.username;
    let text = lastMsg.text || "";
    if (!text && (lastMsg.mediaUrl || lastMsg.mediaName)) {
      const isImg = /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(lastMsg.mediaName || lastMsg.mediaUrl || "");
      text = isImg ? "📷 Photo" : "📁 Attachment";
    }
    if (c.type === "group") return name ? `${name}: ${text}` : text;
    return name === "You" ? `You: ${text}` : (text || "New conversation");
  })();

  return (
    <div className="relative group/item w-full">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all duration-150 mb-0.5 no-tap-highlight pr-10",
          isActive
            ? "bg-accent/10 border border-accent/20 shadow-xs"
            : "hover:bg-surface/80 active:bg-elevated border border-transparent"
        )}
      >
        {/* Active indicator */}
        {isActive && (
          <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-accent" />
        )}

        {/* Avatar */}
        <div className="relative shrink-0">
          <Avatar src={c.avatar} name={c.title} size="md" />
          {isDm && (
            <span className={cn(
              "absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-sidebar transition-colors duration-300",
              isOnline ? "bg-emerald-500" : "bg-zinc-600"
            )} />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className={cn(
              "truncate text-[13.5px] tracking-tight pr-4",
              isActive ? "font-semibold text-foreground" : "font-medium text-foreground/90"
            )}>
              {c.title}
            </span>
            {c.updatedAt > 0 && (
              <span className={cn(
                "shrink-0 text-[11px] font-normal",
                c.unread > 0 ? "text-accent font-semibold" : "text-muted-foreground/70"
              )}>
                {formatListTime(c.updatedAt)}
              </span>
            )}
          </div>
          <p className="line-clamp-1 text-[12px] text-muted-foreground font-normal">
            {isDm && !isOnline && lastSeenText ? (
              <span className="text-[11px] text-muted-foreground/60">{lastSeenText}</span>
            ) : preview}
          </p>
        </div>

        {/* Unread badge */}
        {c.unread > 0 && (
          <span className="grid min-w-5 h-5 place-items-center rounded-full bg-accent px-1.5 text-[10.5px] font-bold text-accent-foreground shrink-0 shadow-sm shadow-accent/30 absolute right-3 bottom-2.5">
            {c.unread > 99 ? "99+" : c.unread}
          </span>
        )}
      </button>

      {/* Action Trigger overlay on hover */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10 opacity-100 md:opacity-0 md:group-hover/item:opacity-100 transition-opacity duration-150">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="grid size-7 place-items-center rounded-lg hover:bg-elevated text-muted-foreground hover:text-foreground transition-all"
            >
              <MoreVertical className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMarkAsRead(); }}>
              Mark as read
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onClearChat(); }}
              className="text-destructive focus:bg-destructive/15 focus:text-destructive"
            >
              Clear chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
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
  const setMobileTab = useAppStore((s) => s.setMobileTab);
  const menuOpen = useAppStore((s) => s.menuOpen);
  const setMenuOpen = useAppStore((s) => s.setMenuOpen);
  const toggleMenu = useAppStore((s) => s.toggleMenu);
  const presence = useAppStore((s) => s.presence);
  
  const [scrolled, setScrolled] = useState(false);
  const [clearChatConvId, setClearChatConvId] = useState(null);

  const queryClient = useQueryClient();

  const handleMarkAsRead = async (conversationId) => {
    try {
      await markAllAsRead(conversationId);
      queryClient.setQueryData(["conversations"], (old) => {
        if (!old) return old;
        return old.map((conv) => {
          if (String(conv.id) === String(conversationId)) {
            return { ...conv, unread: 0 };
          }
          return conv;
        });
      });
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleClearChat = async () => {
    if (!clearChatConvId) return;
    try {
      await clearChat(clearChatConvId);
      queryClient.setQueryData(["conversations"], (old) => {
        if (!old) return old;
        return old.map((conv) => {
          if (String(conv.id) === String(clearChatConvId)) {
            return { ...conv, lastMessage: null, unread: 0 };
          }
          return conv;
        });
      });
      queryClient.invalidateQueries({ queryKey: ["messages", String(clearChatConvId)] });
    } catch (err) {
      console.error("Failed to clear chat:", err);
    } finally {
      setClearChatConvId(null);
    }
  };

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
    setMobileTab("chats");
    queryClient.setQueryData(["conversations"], (old) => {
      if (!Array.isArray(old)) return old;
      return old.map((c) => (String(c.id) === String(id) ? { ...c, unread: 0 } : c));
    });
  };

  const tabs = [
    { id: "all", label: "All" },
    { id: "groups", label: "Groups" },
    { id: "dms", label: "Direct" },
  ];

  return (
    <aside className="flex h-full w-full flex-col select-none bg-sidebar text-sidebar-foreground relative overflow-hidden">

      {/* ── Desktop Hamburger Drawer ─────────────────────────────────────── */}
      <DesktopMenuDrawer isOpen={menuOpen} me={me} onClose={() => setMenuOpen(false)} />

      {/* ── Desktop Header ───────────────────────────────────────────────── */}
      <div className="hidden md:flex items-center justify-between border-b border-border/30 px-3.5 py-3 bg-sidebar shrink-0">
        {/* Left: Hamburger + Brand */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleMenu}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-elevated transition-all"
            aria-label="Menu"
          >
            <Menu className="size-4.5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full overflow-hidden border border-border/20">
              <img src="/Logo.svg" alt="Logo" className="size-full object-contain scale-[1.2] origin-center" />
            </div>
            <span className="text-[13px] font-bold tracking-tight text-foreground uppercase">Fieldchat</span>
          </div>
        </div>

        {/* Right: Notifications */}
        <div className="flex items-center gap-1">
          <NotificationPopover />
        </div>
      </div>

      {/* ── Mobile Header ────────────────────────────────────────────────── */}
      <div
        className="md:hidden flex items-center justify-between border-b border-border/30 px-4 bg-sidebar shrink-0"
        style={{
          paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))",
          paddingBottom: "0.75rem",
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full overflow-hidden border border-border/20">
            <img src="/Logo.svg" alt="Logo" className="size-full object-contain scale-[1.2] origin-center" />
          </div>
          <span className="text-[14px] font-bold tracking-tight text-foreground">Fieldchat</span>
        </div>

        {/* Right icons */}
        <div className="flex items-center">
          <NotificationPopover />
          
          {/* Animated Search Icon Container (Morphy transition) */}
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex items-center justify-end",
              scrolled ? "w-10 opacity-100 pl-1" : "w-0 opacity-0 pl-0"
            )}
          >
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-elevated transition-colors no-tap-highlight"
              aria-label="Search"
            >
              <Search className="size-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Desktop Search Bar (Always pinned) ───────────────────────────── */}
      <div className="hidden md:block px-3 pt-3 pb-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="group flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-xs text-muted-foreground transition-all hover:bg-elevated/70 hover:text-foreground border border-border/40 bg-surface/30"
        >
          <Search className="size-3.5 shrink-0" />
          <span className="truncate font-normal text-[12px]">Search conversations...</span>
          <kbd className="ml-auto rounded-md bg-accent/10 px-1.5 py-0.5 text-[9px] font-mono text-accent font-medium border border-accent/20">⌘K</kbd>
        </button>
      </div>



      {/* ── Filter Tabs ──────────────────────────────────────────────────── */}
      <div className="px-3 py-2 shrink-0">
        <div className="flex gap-1 rounded-xl bg-surface/50 p-0.5 border border-border/30">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilter(t.id)}
              className={cn(
                "flex-1 rounded-lg py-1.5 text-[11.5px] font-medium transition-all duration-200 no-tap-highlight",
                filter === t.id
                  ? "bg-accent/20 text-accent font-semibold border border-accent/30 shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-elevated/40"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Conversation List ─────────────────────────────────────────────── */}
      <div className="relative flex-1 min-h-0 overflow-hidden flex flex-col">
        <div 
          className="scroll-slim flex-1 overflow-y-auto px-2 py-1 pb-safe"
          onScroll={(e) => setScrolled(e.target.scrollTop > 30)}
        >
          {/* ── Mobile Search Bar (Scrolls with list) ── */}
          <div className="md:hidden px-1 pt-1 pb-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-full items-center gap-2.5 rounded-2xl px-3.5 bg-elevated/40 border border-border/30 text-muted-foreground no-tap-highlight hover:bg-elevated/70 transition-colors"
            >
              <Search className="size-4 shrink-0" />
              <span className="text-[13px] text-muted-foreground/80">Search Fieldchat...</span>
            </button>
          </div>
          {isLoading && conversations.length === 0 ? (
            <div className="space-y-1 px-1 py-1.5 fc-fade-in">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 bg-surface/20 border border-transparent"
                >
                  <Skeleton className="size-10 shrink-0 rounded-full bg-elevated/80" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Skeleton className="h-3.5 w-24 rounded-md bg-elevated/80" />
                      <Skeleton className="h-2.5 w-9 rounded-md bg-elevated/50" />
                    </div>
                    <Skeleton
                      className="h-3 rounded-md bg-elevated/50"
                      style={{ width: `${Math.max(45, 85 - ((i * 13) % 40))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
              <div className="grid size-14 place-items-center rounded-2xl border border-border/30 bg-surface/50 text-3xl">
                💬
              </div>
              <p className="text-xs font-semibold text-foreground/70">No conversations yet</p>
              <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                Start a direct message or create a group to begin chatting.
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {filtered.map((c) => (
                <ConvItem
                  key={c.id}
                  c={c}
                  isActive={activeId === String(c.id)}
                  onClick={() => selectConv(c.id)}
                  presence={presence}
                  onMarkAsRead={() => handleMarkAsRead(c.id)}
                  onClearChat={() => setClearChatConvId(c.id)}
                />
              ))}
              {/* Bottom padding for FAB + mobile bottom nav */}
              <div className="h-20 md:h-16" />
            </div>
          )}
        </div>

        <FloatingActionButton
          onNewDm={() => setCreateDmOpen(true)}
          onNewGroup={() => setCreateGroupOpen(true)}
        />
      </div>

      {/* Clear Chat Confirmation Modal */}
      <AlertDialog open={!!clearChatConvId} onOpenChange={(open) => !open && setClearChatConvId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Chat History?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all messages in this conversation? This action is permanent and cannot be undone. Any media files sent in this chat will also be deleted from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearChat} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Clear Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
