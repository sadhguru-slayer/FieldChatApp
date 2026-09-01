import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, LogOut, Pencil, ShieldAlert, ShieldCheck, ShieldX, Trash2, UserPlus, UserX, X, Crown, MoreVertical, User } from "lucide-react";
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
import { useAppStore } from "@/store/useAppStore";
import {
  addMembers,
  deleteGroup,
  dismissGroupAdmin,
  getConversations,
  getGroupMembers,
  getMe,
  getUsers,
  leaveGroup,
  makeGroupAdmin,
  removeMember,
  updateGroup,
} from "@/services/api";
import { uploadFileWithProgress } from "@/services/api/attachments";

export function GroupPanel() {
  const activeId = useAppStore((s) => s.activeId);
  const closePanel = useAppStore((s) => s.closePanel);
  const setActiveId = useAppStore((s) => s.setActiveId);
  const setProfileModalUserId = useAppStore((s) => s.setProfileModalUserId);

  const qc = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [addMemberSearch, setAddMemberSearch] = useState("");

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe });
  const { data: conversations = [] } = useQuery({ queryKey: ["conversations"], queryFn: getConversations });
  const { data: allUsers = [], isFetching: isFetchingUsers } = useQuery({
    queryKey: ["users", addMemberSearch],
    queryFn: () => getUsers(addMemberSearch, 20, 0),
    enabled: addOpen,
  });
  
  const activeConv = conversations.find((c) => String(c.id) === String(activeId));
  const isGroup = activeConv?.type === "group";

  const { data: groupMembers = [] } = useQuery({
    queryKey: ["groupMembers", activeId],
    queryFn: () => getGroupMembers(activeId),
    enabled: !!activeId && isGroup,
  });

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

  const makeAdminMut = useMutation({
    mutationFn: (userId) => makeGroupAdmin({ conversationId: activeId, userId }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["groupMembers", activeId] });
      toast.success(data?.message || "Member promoted to admin");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to make member admin");
    },
  });

  const dismissAdminMut = useMutation({
    mutationFn: (userId) => dismissGroupAdmin({ conversationId: activeId, userId }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["groupMembers", activeId] });
      toast.success(data?.message || "Admin dismissed");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to dismiss admin");
    },
  });

  const removeMut = useMutation({
    mutationFn: (userId) => removeMember({ conversationId: activeId, userId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["groupMembers", activeId] });
      toast.success("Member removed");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to remove member");
    }
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

  if (!activeConv) return null;

  const isOwnerOrAdmin = activeConv.role === "OWNER" || activeConv.role === "ADMIN";
  const existingMemberIds = new Set(groupMembers.map((m) => String(m.id)));
  const addableUsers = allUsers.filter((u) => !existingMemberIds.has(String(u.id)) && String(u.id) !== String(me?.id));

  return (
    <div className="flex h-full w-full mx-auto flex-col bg-background text-foreground select-none">
      {/* Panel Header */}
      <div className="flex h-14 items-center justify-between border-b border-border/30 px-3 select-none bg-sidebar/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-1 min-w-0">
          <button
            type="button"
            onClick={closePanel}
            className="grid size-9 place-items-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-elevated transition-colors mr-1 shrink-0 no-tap-highlight"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="truncate text-[13.5px] font-semibold text-foreground tracking-tight leading-tight">
            {isGroup ? "Group Info" : "User Info"}
          </h1>
        </div>
        <button
          type="button"
          onClick={closePanel}
          className="grid size-9 place-items-center rounded-xl text-muted-foreground hover:bg-elevated hover:text-foreground transition-colors no-tap-highlight"
        >
          <X className="size-4.5" />
        </button>
      </div>

      <div className="scroll-slim flex-1 overflow-y-auto p-4 space-y-6">
        {/* Main Card Header */}
        <div className="text-center space-y-3 pb-4 border-b border-border/20">
          <Avatar src={activeConv.avatar} name={activeConv.title} size="xl" className="mx-auto" />
          <div className="space-y-1">
            <h4 className="text-[15px] font-semibold text-foreground tracking-tight">{activeConv.title}</h4>
            <p className="text-[12px] font-medium text-muted-foreground/80">
              {isGroup ? `Role: ${activeConv.role || "MEMBER"}` : "Direct Message"}
            </p>
          </div>

          {isGroup && isOwnerOrAdmin && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setName(activeConv.title || "");
                  setDescription(activeConv.description || "");
                  setAvatarUrl(activeConv.avatar || "");
                  setEditOpen(true);
                }}
                className="gap-2 text-[11.5px] h-8 rounded-xl border-border/40 bg-surface/30 hover:bg-elevated text-foreground"
              >
                <Pencil className="size-3.5" />
                Edit Group
              </Button>
            </div>
          )}
        </div>

        {/* Group Actions & Member Section */}
        {isGroup && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Members & Roles ({groupMembers.length})
              </h5>
              {isOwnerOrAdmin && (
                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-accent hover:text-accent-foreground transition-colors"
                >
                  <UserPlus className="size-3.5" /> Add Member
                </button>
              )}
            </div>

            {/* Member List */}
            <div className="space-y-1 rounded-2xl border border-border/30 bg-surface/30 p-1.5 max-h-64 overflow-y-auto scroll-slim">
              {groupMembers.map((u) => {
                const isMe = String(u.id) === String(me?.id);
                const displayName = u.display_name || u.name || "Unknown";
                const isMemberAdmin = u.role === "ADMIN";
                const isMemberOwner = u.role === "OWNER";
                const isMemberRegular = u.role === "MEMBER" || (!isMemberAdmin && !isMemberOwner);
                
                return (
                  <div key={u.id} className="group flex items-center justify-between p-2 rounded-xl hover:bg-elevated/50 transition-colors">
                    <button 
                      type="button"
                      className="flex items-center gap-3 min-w-0 text-left cursor-pointer flex-1"
                      onClick={() => setProfileModalUserId(u.id)}
                    >
                      <Avatar src={u.avatar} name={displayName} size="sm" />
                      <div className="min-w-0 flex flex-col justify-center">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[13px] font-semibold truncate text-foreground/90 group-hover:text-foreground transition-colors">
                            {displayName}
                          </p>
                          {isMe && <span className="text-muted-foreground text-xs font-normal">(You)</span>}
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
                      {isOwnerOrAdmin && !isMe && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="grid size-7 place-items-center rounded-lg hover:bg-elevated text-muted-foreground hover:text-foreground transition-all"
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
                            
                            {/* Make Admin option */}
                            {isMemberRegular && (
                              <DropdownMenuItem
                                onClick={() => makeAdminMut.mutate(u.id)}
                                disabled={makeAdminMut.isPending}
                                className="text-emerald-400 focus:text-emerald-300 focus:bg-emerald-500/15"
                              >
                                <ShieldCheck className="size-3.5 mr-2" />
                                Make Group Admin
                              </DropdownMenuItem>
                            )}

                            {/* Dismiss Admin option (Owner only) */}
                            {isMemberAdmin && activeConv.role === "OWNER" && (
                              <DropdownMenuItem
                                onClick={() => dismissAdminMut.mutate(u.id)}
                                disabled={dismissAdminMut.isPending}
                                className="text-amber-400 focus:text-amber-300 focus:bg-amber-500/15"
                              >
                                <ShieldX className="size-3.5 mr-2" />
                                Dismiss as Admin
                              </DropdownMenuItem>
                            )}

                            {!isMemberOwner && (
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
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Danger Actions */}
            <div className="pt-2 space-y-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => leaveMut.mutate()}
                disabled={leaveMut.isPending}
                className="w-full gap-2 text-destructive hover:bg-destructive/10 hover:border-destructive/30 border-border/40 bg-surface/30 text-xs h-9 rounded-xl transition-all"
              >
                <LogOut className="size-4" />
                Leave Group
              </Button>

              {activeConv.role === "OWNER" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteMut.mutate()}
                  disabled={deleteMut.isPending}
                  className="w-full gap-2 text-xs h-9 rounded-xl shadow-md"
                >
                  <Trash2 className="size-4" />
                  Delete Group
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

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
                <label className="text-[11px] font-medium text-accent hover:text-accent/80 cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-surface/50">
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
                        toast.error("Please select an image file only (PNG, JPG, WEBP, GIF).");
                        return;
                      }

                      // Instant optimistic preview
                      const objectUrl = URL.createObjectURL(file);
                      setAvatarUrl(objectUrl);

                      setIsUploading(true);
                      try {
                        const res = await uploadFileWithProgress(file, () => {}, { entity_id: activeId });
                        if (res && res.url) {
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
                      toast.info("Avatar removed. Click Save Changes to apply.");
                    }}
                    className="text-[11px] font-medium text-destructive hover:text-destructive/80 transition-colors px-2 py-1 rounded-lg hover:bg-destructive/10 flex items-center gap-1"
                  >
                    <Trash2 className="size-3" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Group Name</label>
                <Input
                  placeholder="Group name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-xs"
                />
              </div>
              
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Description</label>
                <textarea
                  placeholder="Group description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-xs resize-none"
                />
              </div>

              <Button
                onClick={() => updateMut.mutate({ name, description, avatar_url: avatarUrl || null })}
                disabled={!name.trim() || updateMut.isPending || isUploading}
                className="w-full text-xs"
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
              className="text-xs bg-elevated/50 border-border/40 focus-visible:ring-accent/40 h-8"
            />

            <div className="max-h-60 overflow-y-auto space-y-1.5 scroll-slim border border-border/30 rounded-xl p-1.5 bg-elevated/20">
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
                    const displayName = u.display_name || u.name || "Unknown";
                    
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() =>
                          setSelectedUserIds((prev) =>
                            checked ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                          )
                        }
                        className={`flex w-full items-center justify-between rounded-lg p-2 text-left text-xs transition-colors ${
                          checked ? "bg-elevated font-medium border border-border/40" : "hover:bg-elevated/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar src={u.avatar} name={displayName} size="sm" />
                          <div>
                            <p className="font-medium text-foreground">{displayName}</p>
                            <p className="text-[10px] text-muted-foreground">@{u.username}</p>
                          </div>
                        </div>
                        {checked && <span className="text-primary text-xs font-bold">✓</span>}
                      </button>
                    );
                  })}

                  {addableUsers.length >= 20 && (
                    <div className="p-2 text-center border-t border-border/20 mt-1">
                      <p className="text-[10.5px] text-muted-foreground">
                        Type in search bar above to find more users...
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
            <Button
              onClick={() => addMut.mutate(selectedUserIds)}
              disabled={selectedUserIds.length === 0 || addMut.isPending}
              className="w-full text-xs"
            >
              Add Selected ({selectedUserIds.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
