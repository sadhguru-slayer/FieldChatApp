import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search as SearchIcon, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/Avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/store/useAppStore";
import { createDm, getUsers } from "@/services/api";

export function CreateDmDialog() {
  const open = useAppStore((s) => s.createDmOpen);
  const setOpen = useAppStore((s) => s.setCreateDmOpen);
  const setActiveId = useAppStore((s) => s.setActiveId);

  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: users = [], isFetching } = useQuery({
    queryKey: ["users", search],
    queryFn: () => getUsers(search, 20, 0),
    enabled: open,
  });

  const createMut = useMutation({
    mutationFn: (targetId) => createDm(targetId),
    onSuccess: (res, targetUserId) => {
      const dmId = res?.conversation_id || res?.dm_id || res?.id;
      if (dmId) {
        const targetUser = users.find((u) => String(u.id) === String(targetUserId));
        qc.setQueryData(["conversations"], (old) => {
          if (!Array.isArray(old)) return old;
          const exists = old.some((c) => String(c.id) === String(dmId));
          if (exists) return old;
          const item = {
            id: String(dmId),
            title: targetUser?.name || targetUser?.username || "Direct Message",
            type: "dm",
            otherUserId: targetUserId,
            avatar: targetUser?.avatar || null,
            updatedAt: Date.now(),
            lastMessage: null,
            unread: 0,
          };
          return [item, ...old];
        });
        setActiveId(String(dmId));
      } else {
        qc.invalidateQueries({ queryKey: ["conversations"] });
      }
      toast.success("Direct Message created");
      setOpen(false);
      setSearch("");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to start DM");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm bg-surface border-border/60 text-foreground rounded-2xl shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b border-border/30">
          <DialogTitle className="text-sm font-semibold tracking-tight text-foreground">New Direct Message</DialogTitle>
        </DialogHeader>

        {/* Search input */}
        <div className="relative flex items-center border-b border-border/40 px-3.5 py-2.5 bg-surface/50">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or username..."
            className="w-full bg-transparent pl-2.5 pr-6 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 grid size-5 place-items-center rounded-full text-muted-foreground hover:bg-elevated hover:text-foreground transition-colors"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {/* User list */}
        <div className="scroll-slim max-h-72 overflow-y-auto p-2 space-y-1">
          {isFetching ? (
            <div className="space-y-1.5 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-elevated/40 animate-pulse">
                  <Skeleton className="size-9 rounded-full bg-elevated" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-3 w-28 bg-elevated" />
                    <Skeleton className="h-2.5 w-20 bg-elevated" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className="p-6 text-center text-xs text-muted-foreground">
              {search ? `No users found matching "${search}"` : "No users found."}
            </p>
          ) : (
            <>
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => createMut.mutate(u.id)}
                  disabled={createMut.isPending}
                  className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-elevated transition-colors border border-transparent hover:border-border/40"
                >
                  <Avatar src={u.avatar} name={u.name} size="md" online={u.online} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{u.name}</p>
                    <p className="text-[10.5px] text-muted-foreground truncate">@{u.username}</p>
                  </div>
                </button>
              ))}

              {users.length >= 20 && (
                <div className="p-3 text-center border-t border-border/20 mt-1">
                  <p className="text-[11px] text-muted-foreground">
                    Type in search bar to find more users...
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
