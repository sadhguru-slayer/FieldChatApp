import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, LogOut, Pencil, ShieldAlert, Trash2, UserPlus, UserX, X } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppStore } from "@/store/useAppStore";
import {
  addMembers,
  deleteGroup,
  getConversations,
  getGroupMembers,
  getMe,
  getUsers,
  leaveGroup,
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
                // Use display_name if available, otherwise fall back to name
                const displayName = u.display_name || u.name || "Unknown";
                
                return (
                  <div key={u.id} className="group flex items-center justify-between p-2 rounded-xl hover:bg-elevated/50 transition-colors">
                    <button 
                      type="button"
                      className="flex items-center gap-3 min-w-0 text-left cursor-pointer"
                      onClick={() => setProfileModalUserId(u.id)}
                    >
                      <Avatar src={u.avatar} name={displayName} size="sm" />
                      <div className="min-w-0 flex flex-col justify-center">
                        <p className="text-[13px] font-semibold truncate text-foreground/90 group-hover:text-foreground transition-colors">
                          {displayName} {isMe && <span className="text-muted-foreground font-normal">(You)</span>}
                        </p>
                        <p className="text-[10px] font-medium text-muted-foreground/80 tracking-wide uppercase mt-0.5">{u.role}</p>
                      </div>
                    </button>

                    {isOwnerOrAdmin && !isMe && u.role !== "OWNER" && (
                      <button
                        type="button"
                        onClick={() => removeMut.mutate(u.id)}
                        className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove member"
                      >
                        <UserX className="size-4" />
                      </button>
                    )}
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
              <label className="text-[11px] font-medium text-accent hover:text-accent/80 cursor-pointer transition-colors">
                {isUploading ? "Uploading image..." : "Change Avatar"}
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
                      const res = await uploadFileWithProgress(file, () => {});
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
                onClick={() => updateMut.mutate({ name, description, avatar_url: avatarUrl })}
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
