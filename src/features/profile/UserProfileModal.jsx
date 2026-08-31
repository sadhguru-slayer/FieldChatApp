import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar } from "@/components/Avatar";
import { getUserProfile } from "@/services/api/users";
import { Loader2 } from "lucide-react";

export function UserProfileModal({ userId, open, onOpenChange }) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: () => getUserProfile(userId),
    enabled: !!userId && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs p-0 overflow-hidden bg-background border-border/30 rounded-2xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-10 h-[280px]">
            <Loader2 className="size-6 animate-spin text-muted-foreground mb-4" />
            <p className="text-xs text-muted-foreground">Loading profile...</p>
          </div>
        ) : profile ? (
          <div className="flex flex-col">
            <div className="relative h-24 bg-gradient-to-r from-accent/20 to-emerald-500/20" />
            
            <div className="flex flex-col px-6 pb-6 -mt-12 relative z-10">
              <Avatar 
                src={profile.avatar} 
                name={profile.name} 
                size="xl" 
                className="ring-4 ring-background shadow-lg mb-4" 
              />
              
              <div className="flex flex-col gap-1 mb-4">
                <h3 className="text-xl font-bold text-foreground leading-none">{profile.name}</h3>
                <p className="text-sm font-medium text-muted-foreground">@{profile.username}</p>
                {profile.customStatus && (
                  <p className="text-xs font-medium text-emerald-400 mt-1 flex items-center gap-1.5">
                    <span className="relative flex size-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                    </span>
                    {profile.customStatus}
                  </p>
                )}
              </div>
              
              {profile.bio ? (
                <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed mt-2 bg-surface/40 p-3 rounded-xl border border-border/20">
                  {profile.bio}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic mt-2 bg-surface/40 p-3 rounded-xl border border-border/20">
                  This user hasn't added a bio yet.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-10 h-[200px]">
            <p className="text-sm text-destructive">Failed to load profile.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
