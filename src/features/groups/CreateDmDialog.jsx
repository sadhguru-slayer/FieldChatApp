import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Avatar } from "@/components/Avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppStore } from "@/store/useAppStore";
import { createDm, getUsers } from "@/services/api";

export function CreateDmDialog() {
  const open = useAppStore((s) => s.createDmOpen);
  const setOpen = useAppStore((s) => s.setCreateDmOpen);
  const setActiveId = useAppStore((s) => s.setActiveId);

  const qc = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const createMut = useMutation({
    mutationFn: (targetId) => createDm(targetId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Direct Message created");
      if (res?.conversation_id) setActiveId(String(res.conversation_id));
      setOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to start DM");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New Direct Message</DialogTitle>
        </DialogHeader>

        <div className="scroll-slim max-h-72 overflow-y-auto space-y-1 pt-2">
          {users.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">No users found.</p>
          ) : (
            users.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => createMut.mutate(u.id)}
                disabled={createMut.isPending}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-elevated transition-colors"
              >
                <Avatar src={u.avatar} name={u.name} size="md" online={u.online} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">{u.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">@{u.username}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
