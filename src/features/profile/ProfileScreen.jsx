import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Camera, Check, Sparkles, User, Calendar, ShieldCheck, Mail } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { getMe, updateMe } from "@/services/api";

export function ProfileScreen({ onClose }) {
  const qc = useQueryClient();
  const setActiveScreen = useAppStore((s) => s.setActiveScreen);
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe });

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    if (me) {
      setName(me.name || "");
      setBio(me.bio || "");
      setStatus(me.customStatus || "");
      setAvatar(me.avatar || "");
    }
  }, [me]);

  const updateMut = useMutation({
    mutationFn: () =>
      updateMe({
        name,
        bio,
        customStatus: status,
        avatar,
      }),
    onSuccess: (data) => {
      qc.setQueryData(["me"], (old) => ({
        ...old,
        ...(data || {}),
        name,
        bio,
        customStatus: status,
        avatar,
      }));
      toast.success("Profile updated successfully");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update profile");
    },
  });

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      setActiveScreen("chat");
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground select-none overflow-hidden">
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <header className="flex h-13.5 items-center justify-between border-b border-border/40 px-4 md:px-6 shrink-0 bg-surface/50">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </button>
          <h1 className="text-xs font-semibold text-foreground tracking-tight">Profile & Account</h1>
        </div>

        <Button
          onClick={() => updateMut.mutate()}
          disabled={updateMut.isPending}
          className="h-8 gap-1.5 text-xs font-medium px-3.5 rounded-lg shadow-2xs"
        >
          <Check className="size-3.5" />
          {updateMut.isPending ? "Saving..." : "Save"}
        </Button>
      </header>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="scroll-slim flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="mx-auto w-full max-w-lg space-y-5">
          
          {/* Profile Header Hero */}
          <div className="relative flex flex-col items-center justify-center rounded-2xl border border-border/40 bg-surface/70 p-6 text-center shadow-2xs">
            <div className="relative mb-3">
              <Avatar src={avatar || me?.avatar} name={name || me?.name || "User"} size="xl" className="size-24 border-2 border-border/60" />
              <button
                type="button"
                onClick={() => {
                  const url = prompt("Enter Image URL for avatar:", avatar || me?.avatar);
                  if (url !== null) setAvatar(url);
                }}
                className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105"
                title="Change Avatar"
              >
                <Camera className="size-4" />
              </button>
            </div>

            <h2 className="text-base font-bold text-foreground">{name || "Your Name"}</h2>
            <p className="text-xs text-muted-foreground">@{me?.username || "username"}</p>
            {me?.email && (
              <p className="text-[11px] text-muted-foreground/80 mt-1 flex items-center gap-1">
                <Mail className="size-3 inline opacity-70" /> {me.email}
              </p>
            )}
          </div>

          {/* Personal Details Form */}
          <div className="space-y-4 rounded-2xl border border-border/40 bg-surface/70 p-5 shadow-2xs">
            <h3 className="text-[10.5px] font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
              <User className="size-3.5 opacity-70" /> General Details
            </h3>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-foreground/80">Display Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your display name"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-foreground/80">Custom Status</label>
                <Input
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  placeholder="e.g. Working remotely, In a meeting"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-foreground/80">About / Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write a few lines about yourself..."
                  rows={3}
                  className="w-full rounded-lg border border-input bg-surface p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>
            </div>
          </div>

          {/* Account Security Info */}
          <div className="space-y-2.5 rounded-2xl border border-border/40 bg-surface/70 p-5 shadow-2xs">
            <h3 className="text-[10.5px] font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
              <ShieldCheck className="size-3.5 opacity-70" /> Account Verification
            </h3>
            <div className="flex items-center justify-between text-xs py-1 border-b border-border/30">
              <span className="text-muted-foreground">Account Type</span>
              <span className="font-semibold text-emerald-400">Verified User</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-muted-foreground">Encryption</span>
              <span className="text-foreground font-medium">Standard End-to-End</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
