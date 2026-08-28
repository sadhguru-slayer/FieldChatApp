import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search as SearchIcon, Users, X, ArrowRight, UserCheck, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/Avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/store/useAppStore";
import { createDm, search } from "@/services/api";

export function SearchDialog() {
  const open = useAppStore((s) => s.searchOpen);
  const setOpen = useAppStore((s) => s.setSearchOpen);
  const setActiveId = useAppStore((s) => s.setActiveId);
  const qc = useQueryClient();

  const [q, setQ] = useState("");

  const { data, isFetching } = useQuery({
    queryKey: ["search", q],
    queryFn: () => search(q),
    enabled: q.trim().length > 0,
  });

  const dmMut = useMutation({
    mutationFn: (userId) => createDm(userId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      const id = res.dm_id || res.conversation_id;
      if (id) setActiveId(String(id));
      setOpen(false);
      setQ("");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to start conversation");
    },
  });

  const selectUser = (id) => {
    dmMut.mutate(id);
  };

  const selectGroup = (id) => {
    setActiveId(String(id));
    setOpen(false);
    setQ("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="top-[18%] max-w-lg translate-y-0 gap-0 p-0 overflow-hidden rounded-2xl border border-border/60 bg-surface/95 backdrop-blur-2xl text-foreground select-none shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Search Fieldchat</DialogTitle>
        </DialogHeader>

        {/* ── Search Input Field ─────────────────────────────────────────────── */}
        <div className="relative flex items-center border-b border-border/40 px-4 py-3 bg-surface/60">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground transition-colors group-focus-within:text-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people by username or name..."
            className="w-full bg-transparent pl-3 pr-8 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-3.5 grid size-5 place-items-center rounded-full text-muted-foreground hover:bg-elevated hover:text-foreground transition-colors"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {/* ── Search Results & Content ────────────────────────────────────────── */}
        <div className="scroll-slim max-h-[60vh] min-h-[160px] overflow-y-auto p-3 space-y-4">
          {!q && (
            <div className="py-10 text-center space-y-2">
              <div className="mx-auto grid size-10 place-items-center rounded-2xl bg-elevated text-muted-foreground border border-border/40">
                <SearchIcon className="size-5" />
              </div>
              <p className="text-xs font-medium text-foreground/80">Quick Search</p>
              <p className="text-[11px] text-muted-foreground">
                Find friends, team members, or channels across Fieldchat
              </p>
            </div>
          )}

          {isFetching && (
            <div className="space-y-2 px-1 py-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-elevated/40 animate-pulse">
                  <Skeleton className="size-9 rounded-full bg-elevated" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-3 w-32 bg-elevated" />
                    <Skeleton className="h-2.5 w-24 bg-elevated" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isFetching && data?.people?.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 mb-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  People ({data.people.length})
                </span>
              </div>

              {data.people.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  disabled={dmMut.isPending}
                  onClick={() => selectUser(u.id)}
                  className="group flex w-full items-center justify-between rounded-xl p-2.5 text-left transition-all hover:bg-elevated border border-transparent hover:border-border/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={u.avatar} name={u.name} size="md" online={u.online} />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {u.name}
                      </p>
                      <p className="truncate text-[10.5px] text-muted-foreground">@{u.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
                    <span>Message</span>
                    <ArrowRight className="size-3" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isFetching && data?.groups?.length > 0 && (
            <div className="space-y-1 pt-2">
              <div className="flex items-center justify-between px-2 mb-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Groups ({data.groups.length})
                </span>
              </div>

              {data.groups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => selectGroup(g.id)}
                  className="group flex w-full items-center justify-between rounded-xl p-2.5 text-left transition-all hover:bg-elevated border border-transparent hover:border-border/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-elevated border border-border/40 text-muted-foreground group-hover:text-foreground">
                      <Users className="size-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {g.name}
                      </p>
                      {g.description && (
                        <p className="truncate text-[10.5px] text-muted-foreground">{g.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
                    <span>Open</span>
                    <ArrowRight className="size-3" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isFetching && q && data?.people?.length === 0 && data?.groups?.length === 0 && (
            <div className="py-10 text-center space-y-1.5">
              <p className="text-xs font-semibold text-foreground/80">No results found</p>
              <p className="text-[11px] text-muted-foreground">
                No user or group matched "{q}"
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-border/40 px-4 py-2 bg-surface/50 text-[10px] text-muted-foreground">
          <span>Tip: Use ↑ ↓ to navigate</span>
          <span>Press ESC to close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
