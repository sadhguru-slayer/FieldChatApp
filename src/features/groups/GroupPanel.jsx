import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut, Pencil, ShieldAlert, Trash2, UserPlus, UserX, X } from "lucide-react";
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

export function GroupPanel() {
  const activeId = useAppStore((s) => s.activeId);
  const closePanel = useAppStore((s) => s.closePanel);
  const setActiveId = useAppStore((s) => s.setActiveId);

  const qc = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe });
  const { data: conversations = [] } = useQuery({ queryKey: ["conversations"], queryFn: getConversations });
  const { data: allUsers = [] } = useQuery({ queryKey: ["users"], queryFn: getUsers });
  
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
    <aside className="flex h-full w-80 flex-col border-l border-border bg-surface/50 text-foreground shrink-0 select-none">
      {/* Panel Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {isGroup ? "Group Details" : "User Info"}
        </h3>
        <button
          type="button"
          onClick={closePanel}
          className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-elevated hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="scroll-slim flex-1 overflow-y-auto p-4 space-y-6">
        {/* Main Card Header */}
        <div className="text-center space-y-2">
          <Avatar src={activeConv.avatar} name={activeConv.title} size="xl" className="mx-auto" />
          <div>
            <h4 className="text-sm font-semibold text-foreground">{activeConv.title}</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isGroup ? `Role: ${activeConv.role || "MEMBER"}` : "Direct Message"}
            </p>
          </div>

          {isGroup && isOwnerOrAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setName(activeConv.title);
                setEditOpen(true);
              }}
              className="gap-1.5 text-[11px] h-7"
            >
              <Pencil className="size-3" />
              Edit Group
            </Button>
          )}
        </div>

        {/* Group Actions & Member Section */}
        {isGroup && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Members & Roles ({groupMembers.length})
              </h5>
              {isOwnerOrAdmin && (
                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                >
                  <UserPlus className="size-3" /> Add Member
                </button>
              )}
            </div>

            {/* Member List */}
            <div className="space-y-2 rounded-lg border border-border bg-background p-2 max-h-64 overflow-y-auto scroll-slim">
              {groupMembers.map((u) => {
                const isMe = String(u.id) === String(me?.id);
                // Use display_name if available, otherwise fall back to name
                const displayName = u.display_name || u.name || "Unknown";
                
                return (
                  <div key={u.id} className="flex items-center justify-between p-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar src={u.avatar} name={displayName} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{displayName} {isMe && "(You)"}</p>
                        <p className="text-[10px] text-muted-foreground">{u.role}</p>
                      </div>
                    </div>

                    {isOwnerOrAdmin && !isMe && u.role !== "OWNER" && (
                      <button
                        type="button"
                        onClick={() => removeMut.mutate(u.id)}
                        className="text-muted-foreground hover:text-destructive p-1"
                        title="Remove member"
                      >
                        <UserX className="size-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Danger Actions */}
            <div className="pt-4 border-t border-border space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => leaveMut.mutate()}
                disabled={leaveMut.isPending}
                className="w-full gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive text-xs"
              >
                <LogOut className="size-3.5" />
                Leave Group
              </Button>

              {activeConv.role === "OWNER" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteMut.mutate()}
                  disabled={deleteMut.isPending}
                  className="w-full gap-2 text-xs"
                >
                  <Trash2 className="size-3.5" />
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
          <div className="space-y-3 pt-2">
            <Input
              placeholder="Group name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs"
            />
            <Button
              onClick={() => updateMut.mutate({ name })}
              disabled={!name.trim() || updateMut.isPending}
              className="w-full text-xs"
            >
              Save Changes
            </Button>
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
            <div className="max-h-60 overflow-y-auto space-y-1.5 scroll-slim">
              {addableUsers.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-4">No users available to add.</p>
              ) : (
                addableUsers.map((u) => {
                  const checked = selectedUserIds.includes(u.id);
                  // Use display_name if available, otherwise fall back to name
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
                        checked ? "bg-elevated font-medium" : "hover:bg-elevated/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar src={u.avatar} name={displayName} size="sm" />
                        <span>{displayName}</span>
                      </div>
                      {checked && <span className="text-primary text-xs">✓</span>}
                    </button>
                  );
                })
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
    </aside>
  );
}
