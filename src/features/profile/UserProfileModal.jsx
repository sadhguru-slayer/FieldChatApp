import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar } from "@/components/Avatar";
import { getUserProfile } from "@/services/api/users";
import { Loader2, X, ZoomIn, Mail, AtSign, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Full-screen image viewer ──────────────────────────────────────────────────
function ImageViewer({ src, name, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/10"
        aria-label="Close image viewer"
      >
        <X className="size-5" />
      </button>
      <img
        src={src}
        alt={name || "Profile photo"}
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function getAvatarUrl(profile) {
  if (profile?.avatar_url) return profile.avatar_url;
  const seed = profile?.display_name || profile?.username || "User";
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`;
}

export function UserProfileModal({ userId, open, onOpenChange }) {
  const [imageViewerOpen, setImageViewerOpen] = useState(false);

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: () => getUserProfile(userId),
    enabled: !!userId && open,
    retry: 1,
  });

  const avatarSrc = getAvatarUrl(profile);
  const displayName = profile?.name || profile?.display_name || "User";
  const username = profile?.username;
  const bio = profile?.bio;
  const customStatus = profile?.customStatus || profile?.custom_status;
  const email = profile?.email;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xs p-0 overflow-hidden bg-background border-border/30 rounded-2xl">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-10 h-[300px]">
              <Loader2 className="size-6 animate-spin text-muted-foreground mb-4" />
              <p className="text-xs text-muted-foreground">Loading profile...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-10 h-[200px] gap-3">
              <div className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                <X className="size-5" />
              </div>
              <p className="text-sm text-destructive font-medium">Failed to load profile</p>
              <p className="text-xs text-muted-foreground text-center">
                This user may not have a profile set up yet.
              </p>
            </div>
          ) : profile ? (
            <div className="flex flex-col">
              {/* Gradient hero banner */}
              <div className="relative h-20 bg-gradient-to-br from-accent/30 via-violet-500/20 to-emerald-500/20 shrink-0">
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
              </div>

              <div className="flex flex-col px-5 pb-5 -mt-10 relative z-10">
                {/* Avatar — clickable to view full image */}
                <div className="relative w-fit mb-3">
                  <button
                    type="button"
                    onClick={() => setImageViewerOpen(true)}
                    className="relative group block"
                    aria-label="View full profile photo"
                  >
                    <Avatar
                      src={avatarSrc}
                      name={displayName}
                      size="xl"
                      className="ring-4 ring-background shadow-xl"
                    />
                    <span className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                      <ZoomIn className="size-5 text-white" />
                    </span>
                  </button>
                </div>

                {/* Name + username */}
                <div className="flex flex-col gap-0.5 mb-3">
                  <h3 className="text-lg font-bold text-foreground leading-tight">
                    {displayName}
                  </h3>
                  {username && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <AtSign className="size-3 shrink-0" />
                      <p className="text-sm font-medium">{username}</p>
                    </div>
                  )}
                  {customStatus && (
                    <p className="text-xs font-medium text-emerald-400 mt-1 flex items-center gap-1.5">
                      <span className="relative flex size-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
                      </span>
                      {customStatus}
                    </p>
                  )}
                </div>

                {/* Email (subtle) */}
                {email && (
                  <div className="flex items-center gap-1.5 mb-3 text-muted-foreground/70">
                    <Mail className="size-3 shrink-0" />
                    <p className="text-[11px] truncate">{email}</p>
                  </div>
                )}

                {/* Bio */}
                <div
                  className={cn(
                    "text-[12.5px] leading-relaxed rounded-xl border px-3 py-2.5",
                    bio
                      ? "text-foreground/90 whitespace-pre-wrap bg-surface/40 border-border/20"
                      : "text-muted-foreground italic bg-surface/20 border-border/10"
                  )}
                >
                  {bio || "No bio added yet."}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Full-screen image viewer — outside Dialog to avoid z-index conflicts */}
      {imageViewerOpen && (
        <ImageViewer
          src={avatarSrc}
          name={displayName}
          onClose={() => setImageViewerOpen(false)}
        />
      )}
    </>
  );
}
