import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { createGroup, getMe, getUsers } from "@/services/api";

export function CreateGroupDialog() {
  const open = useAppStore((s) => s.createGroupOpen);
  const setOpen = useAppStore((s) => s.setCreateGroupOpen);
  const setActiveId = useAppStore((s) => s.setActiveId);

  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [memberSearch, setMemberSearch] = useState("");

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe });
  const { data: users = [], isFetching } = useQuery({
    queryKey: ["users", memberSearch],
    queryFn: () => getUsers(memberSearch, 20, 0),
    enabled: open,
  });

  const createMut = useMutation({
    mutationFn: () => createGroup({ name, description, memberIds: selectedUserIds }),
    onSuccess: (newConv) => {
      const groupId = newConv?.id || newConv?.conversation_id;
      if (groupId) {
        qc.setQueryData(["conversations"], (old) => {
          if (!Array.isArray(old)) return old;
          const exists = old.some((c) => String(c.id) === String(groupId));
          if (exists) return old;
          const item = {
            id: String(groupId),
            title: name,
            type: "group",
            memberCount: (selectedUserIds?.length || 0) + 1,
            updatedAt: Date.now(),
            lastMessage: null,
            unread: 0,
          };
          return [item, ...old];
        });
        setActiveId(String(groupId));
      } else {
        qc.invalidateQueries({ queryKey: ["conversations"] });
      }
      toast.success("Group created successfully!");
      setOpen(false);
      setName("");
      setDescription("");
      setSelectedUserIds([]);
      setMemberSearch("");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create group");
    },
  });

  const toggleUser = (id) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const addableUsers = users.filter((u) => String(u.id) !== String(me?.id));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md bg-surface border-border/60 text-foreground rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold tracking-tight text-foreground">Create New Group Chat</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
              Group Name
            </label>
            <Input
              required
              placeholder="e.g. Design Guild"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs bg-elevated/50 border-border/40 focus-visible:ring-accent/40"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
              Description (Optional)
            </label>
            <Input
              placeholder="What is this group about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs bg-elevated/50 border-border/40 focus-visible:ring-accent/40"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Add Members
              </label>
              {selectedUserIds.length > 0 && (
                <span className="text-[10.5px] text-accent font-medium">
                  {selectedUserIds.length} selected
                </span>
              )}
            </div>

            <Input
              placeholder="Search members to add..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="text-xs bg-elevated/50 border-border/40 focus-visible:ring-accent/40 h-8"
            />

            <div className="scroll-slim max-h-44 overflow-y-auto space-y-1 rounded-xl border border-border/40 bg-elevated/30 p-1.5">
              {isFetching ? (
                <p className="p-3 text-center text-xs text-muted-foreground animate-pulse">Loading users...</p>
              ) : addableUsers.length === 0 ? (
                <p className="p-3 text-center text-xs text-muted-foreground">
                  {memberSearch ? `No members found matching "${memberSearch}"` : "No other users found."}
                </p>
              ) : (
                <>
                  {addableUsers.map((u) => {
                    const checked = selectedUserIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleUser(u.id)}
                        className={`flex w-full items-center justify-between rounded-lg p-2 text-left text-xs transition-colors ${
                          checked ? "bg-accent/15 border border-accent/30 font-medium text-foreground" : "hover:bg-elevated/60 text-muted-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar src={u.avatar} name={u.name} size="sm" />
                          <div>
                            <p className="font-medium text-foreground">{u.name}</p>
                            <p className="text-[10px] text-muted-foreground">@{u.username}</p>
                          </div>
                        </div>
                        {checked && <span className="text-accent font-bold text-xs">✓</span>}
                      </button>
                    );
                  })}

                  {addableUsers.length >= 20 && (
                    <div className="p-2 text-center border-t border-border/20 mt-1">
                      <p className="text-[10.5px] text-muted-foreground">
                        Type in search bar to find more members...
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <Button
            onClick={() => createMut.mutate()}
            disabled={!name.trim() || createMut.isPending}
            className="w-full text-xs font-semibold bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl h-9 shadow-xs"
          >
            {createMut.isPending ? "Creating..." : "Create Group"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
