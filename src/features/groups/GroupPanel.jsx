import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronRight,
  Crown,
  FileText,
  Globe,
  Image as ImageIcon,
  LogOut,
  Mail,
  MoreVertical,
  Pencil,
  Plus,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Smile,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
  ZoomIn,
  AtSign,
  Info,
  Layers,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import { useAppStore } from "@/store/useAppStore";
import {
  addMembers,
  clearChat,
  deleteGroup,
  dismissGroupAdmin,
  getConversations,
  getGroupMembers,
  getMe,
  getUserProfile,
  getUsers,
  getCommonGroups,
  leaveGroup,
  makeGroupAdmin,
  removeMember,
  updateGroup,
} from "@/services/api";
import { uploadFileWithProgress } from "@/services/api/attachments";
import { cn, getFullMediaUrl } from "@/lib/utils";
import { MediaLinksDocsView } from "@/features/chat/MediaLinksDocsView";
import { FullscreenLightbox } from "@/features/chat/FullscreenLightbox";

export function GroupPanel() {
  const activeId = useAppStore((s) => s.activeId);
  const panel = useAppStore((s) => s.panel);
  const closePanel = useAppStore((s) => s.closePanel);
  const setActiveId = useAppStore((s) => s.setActiveId);
  const setProfileModalUserId = useAppStore((s) => s.setProfileModalUserId);
  const setCreateGroupOpen = useAppStore((s) => s.setCreateGroupOpen);

  const qc = useQueryClient();

  const [panelView, setPanelView] = useState(panel === "mld" ? "mld" : "info"); // "info" | "mld"
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (panel === "mld") {
      setPanelView("mld");
    } else if (panel === "details") {
      setPanelView("info");
    }
  }, [panel]);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [clearChatConfirmOpen, setClearChatConfirmOpen] = useState(false);
  const [lightboxMessage, setLightboxMessage] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [avatarViewerOpen, setAvatarViewerOpen] = useState(false);

  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [addMemberSearch, setAddMemberSearch] = useState("");
  const scrollContainerRef = useRef(null);

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe });
  const { data: conversations = [] } = useQuery({ queryKey: ["conversations"], queryFn: getConversations });

  const activeConv = conversations.find((c) => String(c.id) === String(activeId));
  const isGroup = activeConv?.type === "group";
  const otherUserId = !isGroup ? activeConv?.otherUserId : null;

  // For DMs: Fetch user profile and common groups
  const { data: otherUserProfile } = useQuery({
    queryKey: ["userProfile", otherUserId],
    queryFn: () => getUserProfile(otherUserId),
    enabled: !!otherUserId && !isGroup,
  });

  const { data: serverCommonGroups = [] } = useQuery({
    queryKey: ["commonGroups", otherUserId],
    queryFn: () => getCommonGroups(otherUserId),
    enabled: !!otherUserId && !isGroup,
  });

  // For Groups: Fetch group members
  const { data: groupMembers = [] } = useQuery({
    queryKey: ["groupMembers", activeId],
    queryFn: () => getGroupMembers(activeId),
    enabled: !!activeId && isGroup,
  });

  const { data: allUsers = [], isFetching: isFetchingUsers } = useQuery({
    queryKey: ["users", addMemberSearch],
    queryFn: () => getUsers(addMemberSearch, 20, 0),
    enabled: addOpen,
  });

  // Groups where current user is admin/owner
  const myAdminGroups = conversations.filter(
    (c) => c.type === "group" && (c.role === "OWNER" || c.role === "ADMIN")
  );

  const updateMut = useMutation({
    mutationFn: (patch) => updateGroup({ conversationId: activeId, patch }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Group updated");
      setEditOpen(false);
    },
  });

  const addMut = useMutation({
    mutationFn: (userIds) => addMembers({ conversationId: activeId, userIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["groupMembers", activeId] });
      toast.success("Members added");
      setAddOpen(false);
      setSelectedUserIds([]);
    },
  });

  const addOtherUserToSpecificGroupMut = useMutation({
    mutationFn: ({ groupId, userId }) => addMembers({ conversationId: groupId, userIds: [userId] }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["groupMembers", variables.groupId] });
      qc.invalidateQueries({ queryKey: ["commonGroups", otherUserId] });
      toast.success("Added to group");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to add to group");
    },
  });

  const makeAdminMut = useMutation({
    mutationFn: (userId) => makeGroupAdmin({ conversationId: activeId, userId }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["groupMembers", activeId] });
      toast.success(data?.message || "Member promoted to admin");
    },
    onError: (err) => toast.error(err.message || "Failed to make member admin"),
  });

  const dismissAdminMut = useMutation({
    mutationFn: (userId) => dismissGroupAdmin({ conversationId: activeId, userId }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["groupMembers", activeId] });
      toast.success(data?.message || "Admin dismissed");
    },
    onError: (err) => toast.error(err.message || "Failed to dismiss admin"),
  });

  const removeMut = useMutation({
    mutationFn: (userId) => removeMember({ conversationId: activeId, userId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["groupMembers", activeId] });
      toast.success("Member removed");
    },
    onError: (err) => toast.error(err.message || "Failed to remove member"),
  });

  const leaveMut = useMutation({
    mutationFn: () => leaveGroup({ conversationId: activeId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Left group");
      setActiveId(null);
      closePanel();
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteGroup({ conversationId: activeId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Group deleted");
      setActiveId(null);
      closePanel();
    },
  });

  const clearChatMut = useMutation({
    mutationFn: () => clearChat(activeId),
    onSuccess: () => {
      qc.setQueryData(["conversations"], (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((conv) => {
          if (String(conv.id) === String(activeId)) {
            return { ...conv, lastMessage: null, unread: 0 };
          }
          return conv;
        });
      });
      qc.invalidateQueries({ queryKey: ["messages", String(activeId)] });
      toast.success("Chat history cleared");
      setClearChatConfirmOpen(false);
    },
    onError: (err) => toast.error(err.message || "Failed to clear chat"),
  });

  if (!activeConv) return null;

  // ── SUB-VIEW: Media, Links & Docs Dedicated View ────────────────────────────
  if (panelView === "mld") {
    return (
      <MediaLinksDocsView
        conversationId={activeId}
        title={activeConv.title}
        onClose={() => {
          if (panel === "mld") {
            closePanel();
          } else {
            setPanelView("info");
          }
        }}
        onMediaClick={(msg) => setLightboxMessage(msg)}
      />
    );
  }

  const isOwnerOrAdmin = activeConv.role === "OWNER" || activeConv.role === "ADMIN";
  const existingMemberIds = new Set(groupMembers.map((m) => String(m.id)));
  const addableUsers = allUsers.filter(
    (u) => !existingMemberIds.has(String(u.id)) && String(u.id) !== String(me?.id)
  );

  const displayAvatar = isGroup
    ? activeConv.avatar
    : otherUserProfile?.avatar_url || otherUserProfile?.avatar || activeConv.avatar;
  const displayName = isGroup
    ? activeConv.title
    : otherUserProfile?.display_name || otherUserProfile?.name || activeConv.title;
  const username = isGroup ? null : otherUserProfile?.username;
  const bio = isGroup ? activeConv.description : otherUserProfile?.bio;
  const customStatus = isGroup ? null : otherUserProfile?.custom_status || otherUserProfile?.customStatus;
  const email = isGroup ? null : otherUserProfile?.email;

  return (
    <div className="flex h-full w-full mx-auto flex-col bg-background text-foreground select-none relative overflow-hidden">
      {/* ── Top Header with Sticky Scroll Morph ────────────────────────── */}
      <div className="flex h-14 items-center justify-between border-b border-border/30 px-3 bg-surface/80 backdrop-blur-md shrink-0 z-20">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={closePanel}
            className="grid size-9 place-items-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-elevated transition-colors shrink-0 no-tap-highlight cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="size-5" />
          </button>

          {/* Sticky header portion — fades in smoothly when scrolled past top hero */}
          <div
            className={cn(
              "flex items-center gap-2.5 min-w-0 transition-all duration-200",
              scrolled ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
            )}
          >
            <Avatar src={displayAvatar} name={displayName} size="sm" className="size-8 shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-foreground leading-tight">{displayName}</p>
              <p className="truncate text-[10px] text-muted-foreground">
                {isGroup ? `${groupMembers.length} members` : username ? `@${username}` : "Direct Message"}
              </p>
            </div>
          </div>

          {!scrolled && (
            <h1 className="truncate text-[13.5px] font-bold text-foreground tracking-tight leading-tight">
              {isGroup ? "Group Info" : "Chat Info"}
            </h1>
          )}
        </div>

        <button
          type="button"
          onClick={closePanel}
          className="grid size-9 place-items-center rounded-xl text-muted-foreground hover:bg-elevated hover:text-foreground transition-colors no-tap-highlight cursor-pointer"
          aria-label="Close"
        >
          <X className="size-4.5" />
        </button>
      </div>

      {/* ── Scrollable Body ─────────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 80)}
        className="scroll-slim flex-1 overflow-y-auto p-4 space-y-5 pb-16"
      >
        {/* ── 1. Main User/Group Hero Section ────────────────────────── */}
        <div className="text-center flex flex-col items-center pt-1 pb-3">
          {/* Avatar with click-to-preview lightbox */}
          <div
            className={cn(
              "relative inline-block group/avatar mx-auto",
              displayAvatar ? "cursor-pointer" : "cursor-default"
            )}
            onClick={() => {
              if (displayAvatar) setAvatarViewerOpen(true);
            }}
            role={displayAvatar ? "button" : undefined}
            tabIndex={displayAvatar ? 0 : -1}
            title={displayAvatar ? "Click to view photo" : ""}
          >
            <Avatar
              src={displayAvatar}
              name={displayName}
              size="xl"
              className="size-22 border-2 border-border/40 shadow-xl ring-4 ring-white/5"
            />
            {displayAvatar && (
              <span className="absolute inset-0 rounded-full flex items-center justify-center bg-black/45 opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                <ZoomIn className="size-5 text-white" />
              </span>
            )}
          </div>

          <div className="mt-3 space-y-0.5">
            <h2 className="text-base font-bold text-foreground tracking-tight">{displayName}</h2>
            {username && (
              <p className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1">
                <AtSign className="size-3 opacity-60" />
                <span>{username}</span>
              </p>
            )}
            {customStatus && (
              <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="truncate max-w-[200px]">{customStatus}</span>
              </div>
            )}
          </div>

          {/* Group edit button (if admin/owner) */}
          {isGroup && isOwnerOrAdmin && (
            <div className="pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setName(activeConv.title || "");
                  setDescription(activeConv.description || "");
                  setAvatarUrl(activeConv.avatar || "");
                  setEditOpen(true);
                }}
                className="gap-2 text-[11.5px] h-8 rounded-xl border-border/40 bg-surface/40 hover:bg-elevated text-foreground"
              >
                <Pencil className="size-3.5" />
                Edit Group
              </Button>
            </div>
          )}
        </div>

        {/* ── 2. User Details / Bio / Email (For DMs) ────────────────── */}
        {!isGroup && (
          <div className="space-y-1.5 rounded-2xl bg-surface/50 border border-border/30 overflow-hidden divide-y divide-border/20 backdrop-blur-md shadow-2xs">
            {email && (
              <div className="flex items-center gap-3 px-3.5 py-3 text-xs">
                <Mail className="size-4 text-muted-foreground/70 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Email</p>
                  <p className="text-foreground font-medium truncate select-text mt-0.5">{email}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1 px-3.5 py-3 text-xs">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <Info className="size-3 opacity-70" />
                <span>About / Bio</span>
              </div>
              <p
                className={cn(
                  "text-xs leading-relaxed select-text mt-0.5",
                  bio ? "text-foreground whitespace-pre-wrap" : "text-muted-foreground/50 italic"
                )}
              >
                {bio || "No bio available."}
              </p>
            </div>
          </div>
        )}

        {/* ── 3. Media, Links & Docs Section (Shared MLD Entry Card) ─── */}
        <div className="space-y-1.5">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground px-1">
            Shared Content
          </p>

          <button
            type="button"
            onClick={() => setPanelView("mld")}
            className="group flex w-full items-center justify-between p-3.5 rounded-2xl border border-border/40 bg-surface/50 hover:bg-elevated/70 transition-all text-left shadow-2xs cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="grid size-9 place-items-center rounded-xl bg-accent/10 border border-accent/20 text-accent group-hover:scale-105 transition-transform shrink-0">
                <Layers className="size-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">Media, Links & Docs</p>
                <p className="text-[11px] text-muted-foreground">View all shared photos, files & links</p>
              </div>
            </div>

            <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
          </button>
        </div>

        {/* ── 4. DM Actions: Create Group, Add to Groups, Common Groups ── */}
        {!isGroup && (
          <>
            <div className="my-1 border-t border-border/20" />

            {/* Create Group with User */}
            <div className="space-y-1.5">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                Group Actions
              </p>

              <button
                type="button"
                onClick={() => setCreateGroupOpen(true)}
                className="flex w-full items-center gap-3 p-3 rounded-2xl border border-border/40 bg-surface/50 hover:bg-elevated/70 transition-all text-left shadow-2xs cursor-pointer group"
              >
                <div className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                  <UserPlus className="size-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground">Create Group with {displayName}</p>
                  <p className="text-[11px] text-muted-foreground">Start a new group together</p>
                </div>
              </button>
            </div>

            {/* Add to Groups (Where current user is admin/owner) */}
            {myAdminGroups.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
                  <ShieldCheck className="size-3 text-emerald-400" />
                  <span>Add to Your Groups ({myAdminGroups.length})</span>
                </p>

                <div className="rounded-2xl border border-border/30 bg-surface/40 overflow-hidden divide-y divide-border/20 max-h-48 overflow-y-auto scroll-slim">
                  {myAdminGroups.map((grp) => (
                    <div
                      key={grp.id}
                      className="flex items-center justify-between p-2.5 hover:bg-elevated/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                        <Avatar src={grp.avatar} name={grp.title} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{grp.title}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">{grp.role}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          addOtherUserToSpecificGroupMut.mutate({
                            groupId: grp.id,
                            userId: otherUserId,
                          })
                        }
                        disabled={addOtherUserToSpecificGroupMut.isPending}
                        className="px-2.5 py-1 rounded-lg bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 text-[11px] font-semibold transition-all cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Common Groups */}
            <div className="space-y-2">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
                <Users className="size-3 text-indigo-400" />
                <span>Common Groups ({serverCommonGroups.length})</span>
              </p>

              {serverCommonGroups.length === 0 ? (
                <div className="rounded-2xl border border-border/30 bg-surface/30 p-4 text-center">
                  <p className="text-xs text-muted-foreground">No groups in common</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-border/30 bg-surface/40 overflow-hidden divide-y divide-border/20">
                  {serverCommonGroups.map((grp) => (
                    <button
                      key={grp.id}
                      type="button"
                      onClick={() => {
                        setActiveId(String(grp.id));
                        closePanel();
                      }}
                      className="flex w-full items-center justify-between p-2.5 hover:bg-elevated/60 transition-colors text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                        <Avatar src={grp.avatar_url} name={grp.name} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                            {grp.name}
                          </p>
                          {grp.description && (
                            <p className="text-[10.5px] text-muted-foreground truncate">{grp.description}</p>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── 5. Group Member Management Section (For Groups) ────────── */}
        {isGroup && (
          <div className="space-y-3">
            <div className="my-1 border-t border-border/20" />

            <div className="flex items-center justify-between px-1">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Members ({groupMembers.length})
              </h5>
              {isOwnerOrAdmin && (
                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="flex items-center gap-1.5 text-[11.5px] font-bold text-accent hover:underline transition-all cursor-pointer"
                >
                  <UserPlus className="size-3.5" />
                  <span>Add Member</span>
                </button>
              )}
            </div>

            {/* Member List */}
            <div className="space-y-1 rounded-2xl border border-border/30 bg-surface/40 p-1.5 max-h-64 overflow-y-auto scroll-slim">
              {groupMembers.map((u) => {
                const isMe = String(u.id) === String(me?.id);
                const memName = u.display_name || u.name || "Unknown";
                const isMemberAdmin = u.role === "ADMIN";
                const isMemberOwner = u.role === "OWNER";
                const isMemberRegular = !isMemberAdmin && !isMemberOwner;

                return (
                  <div
                    key={u.id}
                    className="group flex items-center justify-between p-2 rounded-xl hover:bg-elevated/50 transition-colors"
                  >
                    <button
                      type="button"
                      className="flex items-center gap-3 min-w-0 text-left cursor-pointer flex-1"
                      onClick={() => setProfileModalUserId(u.id)}
                    >
                      <Avatar src={u.avatar} name={memName} size="sm" />
                      <div className="min-w-0 flex flex-col justify-center">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[13px] font-semibold truncate text-foreground group-hover:text-accent transition-colors">
                            {memName}
                          </p>
                          {isMe && <span className="text-muted-foreground text-xs">(You)</span>}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {isMemberOwner ? (
                            <span className="flex items-center gap-1 text-[9.5px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20 uppercase tracking-wide">
                              <Crown className="size-2.5" /> Owner
                            </span>
                          ) : isMemberAdmin ? (
                            <span className="flex items-center gap-1 text-[9.5px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.2 rounded border border-emerald-400/20 uppercase tracking-wide">
                              <ShieldCheck className="size-2.5" /> Admin
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-muted-foreground/80 tracking-wide uppercase">
                              Member
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Member Actions Menu */}
                    <div className="flex items-center gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="grid size-7 place-items-center rounded-lg hover:bg-elevated text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                            aria-label="Member options"
                          >
                            <MoreVertical className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => setProfileModalUserId(u.id)}>
                            <User className="size-3.5 mr-2 opacity-70" />
                            View Profile
                          </DropdownMenuItem>

                          {isOwnerOrAdmin && !isMe && isMemberRegular && (
                            <DropdownMenuItem
                              onClick={() => makeAdminMut.mutate(u.id)}
                              disabled={makeAdminMut.isPending}
                              className="text-emerald-400 focus:text-emerald-300 focus:bg-emerald-500/15"
                            >
                              <ShieldCheck className="size-3.5 mr-2" />
                              Make Group Admin
                            </DropdownMenuItem>
                          )}

                          {isOwnerOrAdmin && !isMe && isMemberAdmin && activeConv.role === "OWNER" && (
                            <DropdownMenuItem
                              onClick={() => dismissAdminMut.mutate(u.id)}
                              disabled={dismissAdminMut.isPending}
                              className="text-amber-400 focus:text-amber-300 focus:bg-amber-500/15"
                            >
                              <ShieldX className="size-3.5 mr-2" />
                              Dismiss as Admin
                            </DropdownMenuItem>
                          )}

                          {isOwnerOrAdmin && !isMe && !isMemberOwner && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => removeMut.mutate(u.id)}
                                disabled={removeMut.isPending}
                                className="text-destructive focus:bg-destructive/15 focus:text-destructive"
                              >
                                <UserX className="size-3.5 mr-2" />
                                Remove from Group
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 6. Clear Chat & Danger Actions ─────────────────────────── */}
        <div className="pt-2 space-y-2 border-t border-border/20">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setClearChatConfirmOpen(true)}
            className="w-full gap-2 text-muted-foreground hover:text-foreground hover:bg-elevated border-border/40 bg-surface/30 text-xs h-9.5 rounded-xl transition-all cursor-pointer font-semibold"
          >
            <Trash2 className="size-4 opacity-70" />
            <span>Clear Chat History</span>
          </Button>

          {isGroup && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => leaveMut.mutate()}
                disabled={leaveMut.isPending}
                className="w-full gap-2 text-destructive hover:bg-destructive/10 hover:border-destructive/30 border-border/40 bg-surface/30 text-xs h-9.5 rounded-xl transition-all cursor-pointer font-semibold"
              >
                <LogOut className="size-4" />
                <span>Exit Group</span>
              </Button>

              {activeConv.role === "OWNER" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteMut.mutate()}
                  disabled={deleteMut.isPending}
                  className="w-full gap-2 text-xs h-9.5 rounded-xl shadow-md cursor-pointer font-bold"
                >
                  <Trash2 className="size-4" />
                  <span>Delete Group for Everyone</span>
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Modals & Lightbox ────────────────────────────────────────── */}

      {/* Clear Chat Confirmation Modal */}
      <AlertDialog open={clearChatConfirmOpen} onOpenChange={setClearChatConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Chat History?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all messages in this chat? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clearChatMut.mutate()}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
            >
              {clearChatMut.isPending ? "Clearing..." : "Clear Chat"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Group Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Group Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex flex-col items-center gap-3">
              <Avatar src={avatarUrl} name={name} size="xl" />
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-semibold text-accent hover:underline cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-surface/50">
                  {isUploading ? "Uploading image..." : avatarUrl ? "Change Avatar" : "Upload Avatar"}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp, image/gif"
                    disabled={isUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!file.type.startsWith("image/")) {
                        toast.error("Please select an image file only.");
                        return;
                      }

                      const objectUrl = URL.createObjectURL(file);
                      setAvatarUrl(objectUrl);

                      setIsUploading(true);
                      try {
                        const res = await uploadFileWithProgress(file, () => {}, { entity_id: activeId });
                        if (res?.url) {
                          setAvatarUrl(res.url);
                          toast.success("Avatar image uploaded");
                        }
                      } catch (err) {
                        toast.error("Failed to upload avatar image");
                      } finally {
                        setIsUploading(false);
                      }
                    }}
                  />
                </label>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarUrl("");
                      toast.info("Avatar removed");
                    }}
                    className="text-[11px] font-medium text-destructive hover:underline transition-colors px-2 py-1 rounded-lg hover:bg-destructive/10 flex items-center gap-1"
                  >
                    <Trash2 className="size-3" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Group Name
                </label>
                <Input
                  placeholder="Group name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Description
                </label>
                <textarea
                  placeholder="Group description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="flex w-full rounded-xl border border-border/40 bg-surface/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-accent/50 resize-none"
                />
              </div>

              <Button
                onClick={() => updateMut.mutate({ name, description, avatar_url: avatarUrl || null })}
                disabled={!name.trim() || updateMut.isPending || isUploading}
                className="w-full text-xs font-semibold"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Members Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Members to Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input
              placeholder="Search users to add..."
              value={addMemberSearch}
              onChange={(e) => setAddMemberSearch(e.target.value)}
              className="text-xs bg-elevated/50 border-border/40 focus-visible:ring-accent/40 h-8.5 rounded-xl"
            />

            <div className="max-h-60 overflow-y-auto space-y-1.5 scroll-slim border border-border/30 rounded-2xl p-1.5 bg-surface/30">
              {isFetchingUsers ? (
                <p className="text-center text-xs text-muted-foreground py-4 animate-pulse">Loading users...</p>
              ) : addableUsers.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-4">
                  {addMemberSearch ? `No users found matching "${addMemberSearch}"` : "No users available to add."}
                </p>
              ) : (
                <>
                  {addableUsers.map((u) => {
                    const checked = selectedUserIds.includes(u.id);
                    const memDisp = u.display_name || u.name || "Unknown";

                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() =>
                          setSelectedUserIds((prev) =>
                            checked ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                          )
                        }
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl p-2 text-left text-xs transition-colors cursor-pointer",
                          checked ? "bg-accent/15 font-medium border border-accent/30" : "hover:bg-elevated/50"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar src={u.avatar} name={memDisp} size="sm" />
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{memDisp}</p>
                            <p className="text-[10px] text-muted-foreground truncate">@{u.username}</p>
                          </div>
                        </div>
                        {checked && <span className="text-accent text-xs font-bold mr-1">✓</span>}
                      </button>
                    );
                  })}
                </>
              )}
            </div>

            <Button
              onClick={() => addMut.mutate(selectedUserIds)}
              disabled={selectedUserIds.length === 0 || addMut.isPending}
              className="w-full text-xs font-semibold rounded-xl"
            >
              Add Selected ({selectedUserIds.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Avatar Lightbox */}
      {avatarViewerOpen && displayAvatar && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 backdrop-blur-md"
          onClick={() => setAvatarViewerOpen(false)}
        >
          <button
            type="button"
            onClick={() => setAvatarViewerOpen(false)}
            className="absolute top-4 right-4 z-10 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all border border-white/10 shadow-lg cursor-pointer"
            aria-label="Close image viewer"
          >
            <X className="size-5" />
          </button>
          <div className="relative p-4 max-w-[95vw] max-h-[92vh] flex flex-col items-center">
            <img
              src={getFullMediaUrl(displayAvatar)}
              alt={displayName}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl ring-1 ring-white/15"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="mt-3 text-sm font-semibold text-white/90 bg-black/50 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
              {displayName}
            </p>
          </div>
        </div>
      )}

      {/* Lightbox for MLD images/videos */}
      {lightboxMessage && (
        <FullscreenLightbox
          message={lightboxMessage}
          onClose={() => setLightboxMessage(null)}
        />
      )}
    </div>
  );
}
