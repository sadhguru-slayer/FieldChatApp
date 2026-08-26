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

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe });
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const createMut = useMutation({
    mutationFn: () => createGroup({ name, description, memberIds: selectedUserIds }),
    onSuccess: (newConv) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Group created successfully!");
      setActiveId(newConv.id);
      setOpen(false);
      setName("");
      setDescription("");
      setSelectedUserIds([]);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Group Chat</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground uppercase">
              Group Name
            </label>
            <Input
              required
              placeholder="e.g. Design Guild"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground uppercase">
              Description (Optional)
            </label>
            <Input
              placeholder="What is this group about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground uppercase">
              Add Members
            </label>
            <div className="scroll-slim max-h-48 overflow-y-auto space-y-1 rounded-lg border border-border bg-background p-1.5">
              {addableUsers.length === 0 ? (
                <p className="p-3 text-center text-xs text-muted-foreground">No other users found.</p>
              ) : (
                addableUsers.map((u) => {
                  const checked = selectedUserIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleUser(u.id)}
                      className={`flex w-full items-center justify-between rounded-md p-2 text-left text-xs transition-colors ${
                        checked ? "bg-elevated font-medium text-foreground" : "hover:bg-elevated/50 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar src={u.avatar} name={u.name} size="sm" />
                        <div>
                          <p className="font-medium text-foreground">{u.name}</p>
                          <p className="text-[10px] text-muted-foreground">@{u.username}</p>
                        </div>
                      </div>
                      {checked && <span className="text-primary font-bold">✓</span>}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <Button
            onClick={() => createMut.mutate()}
            disabled={!name.trim() || createMut.isPending}
            className="w-full text-xs"
          >
            {createMut.isPending ? "Creating..." : "Create Group"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
