import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { getUserProfile, getMe, createDm, getMyUserId } from "@/services/api";
import { useAppStore } from "@/store/useAppStore";
import {
  Loader2,
  X,
  ZoomIn,
  Mail,
  AtSign,
  ShieldCheck,
  MessageSquare,
  Info,
  Calendar,
} from "lucide-react";
import { cn, getFullMediaUrl } from "@/lib/utils";

// ── Full-screen image viewer modal ───────────────────────────────────────────
function ImageViewer({ src, name, onClose }) {
  const fullSrc = getFullMediaUrl(src);
  if (!fullSrc) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 backdrop-blur-md transition-opacity duration-200"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all border border-white/10 shadow-lg cursor-pointer"
        aria-label="Close image viewer"
      >
        <X className="size-5" />
      </button>

      <div className="relative p-4 max-w-[95vw] max-h-[92vh] flex flex-col items-center">
        <img
          src={fullSrc}
          alt={name || "Profile photo"}
          className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl ring-1 ring-white/15"
          onClick={(e) => e.stopPropagation()}
        />
        {name && (
          <p className="mt-3 text-sm font-semibold text-white/90 bg-black/50 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
            {name}
          </p>
        )}
      </div>
    </div>
  );
}

export function UserProfileModal({ userId, open, onOpenChange }) {
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [showFullInfo, setShowFullInfo] = useState(true);

  const qc = useQueryClient();
  const setActiveId = useAppStore((s) => s.setActiveId);
  const setActiveScreen = useAppStore((s) => s.setActiveScreen);
  const setMobileView = useAppStore((s) => s.setMobileView);
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe });

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: () => getUserProfile(userId),
    enabled: !!userId && open,
    retry: 1,
  });

  const dmMut = useMutation({
    mutationFn: () => createDm(userId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      const convId = res.dm_id || res.conversation_id;
      if (convId) {
        setActiveId(String(convId));
        setActiveScreen("chat");
        setMobileView("chat");
      }
      setSearchOpen(false);
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to start chat");
    },
  });

  const rawAvatar = profile?.avatar_url || profile?.avatar;
  const displayName = profile?.display_name || profile?.name || "User";
  const username = profile?.username;
  const bio = profile?.bio;
  const customStatus = profile?.custom_status || profile?.customStatus;
  const email = profile?.email;

  const isMe = String(userId) === String(me?.id) || String(userId) === String(getMyUserId());

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm p-0 overflow-hidden bg-background border-border/30 rounded-3xl shadow-2xl select-none">
          <DialogTitle className="sr-only">{displayName}'s Profile</DialogTitle>
          <DialogDescription className="sr-only">Profile modal showing info for {displayName}</DialogDescription>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-10 h-[280px]">
              <Loader2 className="size-7 animate-spin text-accent mb-3" />
              <p className="text-xs text-muted-foreground font-medium">Loading profile...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-8 h-[220px] text-center gap-3">
              <div className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                <X className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">User Profile Unavailable</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Could not load profile details for this account.
                </p>
              </div>
            </div>
          ) : profile ? (
            <div className="flex flex-col">
              {/* Premium Hero Banner */}
              <div className="relative h-28 bg-gradient-to-br from-accent/35 via-purple-600/20 to-emerald-500/20 shrink-0">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                
                {/* Close modal X button */}
                <button
                  type="button"
                  onClick={handleClose}
                  className="absolute top-3 right-3 z-20 grid size-7 place-items-center rounded-full bg-black/30 text-white/80 hover:text-white hover:bg-black/50 transition-colors backdrop-blur-xs"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Profile Card Content */}
              <div className="flex flex-col px-5 pb-5 -mt-12 relative z-10">
                {/* Header row: Avatar + Action Buttons */}
                <div className="flex items-end justify-between mb-3">
                  {/* Avatar — Specifically clicking ONLY the avatar opens full-screen image */}
                  <div className="relative w-fit">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (rawAvatar) setImageViewerOpen(true);
                      }}
                      className={cn(
                        "relative group block rounded-full transition-transform active:scale-95 shadow-xl",
                        rawAvatar ? "cursor-pointer" : "cursor-default"
                      )}
                      title={rawAvatar ? "Click to view full photo" : ""}
                    >
                      <Avatar
                        src={rawAvatar}
                        name={displayName}
                        size="xl"
                        className="size-20 border-2 border-background/80 shadow-md"
                      />
                      {rawAvatar && (
                        <span className="absolute inset-0 rounded-full flex items-center justify-center bg-black/45 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                          <ZoomIn className="size-5 text-white" />
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Actions: Start Chat Button */}
                  {!isMe && (
                    <Button
                      size="sm"
                      onClick={() => dmMut.mutate()}
                      disabled={dmMut.isPending}
                      className="gap-1.5 h-8 text-xs font-semibold px-4 rounded-xl shadow-md"
                    >
                      {dmMut.isPending ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <MessageSquare className="size-3.5" />
                      )}
                      <span>Chat</span>
                    </Button>
                  )}
                </div>

                {/* Display Name & Handle */}
                <div className="flex flex-col gap-0.5 mb-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-foreground leading-tight tracking-tight">
                      {displayName}
                    </h2>
                    {isMe && (
                      <span className="text-[10.5px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                        You
                      </span>
                    )}
                  </div>

                  {username && (
                    <div className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
                      <AtSign className="size-3 shrink-0 opacity-70" />
                      <span>{username}</span>
                    </div>
                  )}

                  {customStatus && (
                    <p className="text-[12px] font-semibold text-emerald-400 mt-1.5 flex items-center gap-1.5">
                      <span className="relative flex size-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
                      </span>
                      {customStatus}
                    </p>
                  )}
                </div>

                {/* Full Profile Information ('i' Info Section) */}
                <div className="space-y-2.5">
                  {/* Primary Email */}
                  {email && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface/40 border border-border/20 text-xs">
                      <Mail className="size-3.5 text-accent shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase font-semibold text-muted-foreground/70">Email</p>
                        <p className="text-foreground/90 font-medium truncate select-text">{email}</p>
                      </div>
                    </div>
                  )}

                  {/* Bio */}
                  <div className="flex flex-col gap-1 px-3 py-2.5 rounded-xl bg-surface/40 border border-border/20 text-xs">
                    <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-muted-foreground/70 uppercase">
                      <Info className="size-3 opacity-70 text-accent" />
                      <span>About / Bio</span>
                    </div>
                    <p className={cn(
                      "text-xs leading-relaxed mt-0.5 select-text",
                      bio ? "text-foreground/90 whitespace-pre-wrap" : "text-muted-foreground/50 italic"
                    )}>
                      {bio || "No bio available."}
                    </p>
                  </div>
                </div>

                {/* Footer security & account badge */}
                <div className="mt-4 pt-3 border-t border-border/20 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium">
                    <ShieldCheck className="size-3.5 text-emerald-400" /> Fieldchat Account
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-medium px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Active
                  </span>
                </div>

              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Full-screen photo lightbox — ONLY triggered by clicking on the avatar photo */}
      {imageViewerOpen && rawAvatar && (
        <ImageViewer
          src={rawAvatar}
          name={displayName}
          onClose={() => setImageViewerOpen(false)}
        />
      )}
    </>
  );
}
