import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar } from "@/components/Avatar";
import { getUserProfile } from "@/services/api/users";
import { Loader2, X, ZoomIn, Mail, AtSign, Calendar, ShieldCheck, Sparkles } from "lucide-react";
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

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: () => getUserProfile(userId),
    enabled: !!userId && open,
    retry: 1,
  });

  const rawAvatar = profile?.avatar_url || profile?.avatar;
  const displayName = profile?.display_name || profile?.name || "User";
  const username = profile?.username;
  const bio = profile?.bio;
  const customStatus = profile?.custom_status || profile?.customStatus;
  const email = profile?.email;

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xs p-0 overflow-hidden bg-background border-border/30 rounded-3xl shadow-2xl select-none">
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
              <div className="relative h-24 bg-gradient-to-br from-accent/35 via-purple-600/20 to-emerald-500/20 shrink-0">
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
                {/* Avatar with Click to Focus/Preview */}
                <div className="relative w-fit mb-3">
                  <button
                    type="button"
                    onClick={() => rawAvatar && setImageViewerOpen(true)}
                    className={cn(
                      "relative group block rounded-full transition-transform active:scale-95",
                      rawAvatar ? "cursor-pointer" : "cursor-default"
                    )}
                    title={rawAvatar ? "Click to view full photo" : ""}
                  >
                    <Avatar
                      src={rawAvatar}
                      name={displayName}
                      size="xl"
                      className="size-20 ring-4 ring-background shadow-xl"
                    />
                    {rawAvatar && (
                      <span className="absolute inset-0 rounded-full flex items-center justify-center bg-black/45 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                        <ZoomIn className="size-5 text-white" />
                      </span>
                    )}
                  </button>
                </div>

                {/* Display Name & Handle */}
                <div className="flex flex-col gap-0.5 mb-3">
                  <h2 className="text-lg font-bold text-foreground leading-tight tracking-tight">
                    {displayName}
                  </h2>
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

                {/* Email (if available) */}
                {email && (
                  <div className="flex items-center gap-1.5 mb-3 text-muted-foreground/80 text-xs">
                    <Mail className="size-3.5 shrink-0 opacity-70" />
                    <span className="truncate">{email}</span>
                  </div>
                )}

                {/* Bio card */}
                <div
                  className={cn(
                    "text-xs leading-relaxed rounded-2xl border p-3 mt-1",
                    bio
                      ? "text-foreground/90 bg-surface/50 border-border/30 whitespace-pre-wrap"
                      : "text-muted-foreground/60 italic bg-surface/20 border-border/10"
                  )}
                >
                  {bio || "No bio available."}
                </div>

                {/* Footer security badge */}
                <div className="mt-4 pt-3 border-t border-border/20 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium">
                    <ShieldCheck className="size-3.5 text-emerald-400" /> Verified User
                  </span>
                  <span className="text-[10px] bg-accent/10 text-accent font-medium px-2 py-0.5 rounded-full border border-accent/20">
                    Fieldchat
                  </span>
                </div>

              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Full-screen photo lightbox */}
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
