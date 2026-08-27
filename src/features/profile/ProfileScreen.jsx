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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
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
    if (!useAppStore.getState().activeId) {
      useAppStore.getState().setMobileView("list");
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#0e1621] text-foreground select-none overflow-hidden">
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <header
        className="flex h-14 items-center justify-between border-b px-4 md:px-6 shrink-0"
        style={{ background: "#17212b", borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="grid size-8 place-items-center rounded-lg text-[#5d8aa8] transition-colors hover:bg-white/5 hover:text-[#e3e3e3]"
          >
            <ArrowLeft className="size-4" />
          </button>
          <h1 className="text-sm font-semibold text-[#e3e3e3]">Profile & Account</h1>
        </div>

        <Button
          onClick={() => updateMut.mutate()}
          disabled={updateMut.isPending}
          className="h-8 gap-1.5 bg-[#2b5278] text-xs font-medium text-[#e3e3e3] hover:bg-[#39628d] px-3.5 rounded-lg"
        >
          <Check className="size-3.5" />
          {updateMut.isPending ? "Saving..." : "Save"}
        </Button>
      </header>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="scroll-slim flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="mx-auto w-full max-w-lg space-y-6">
          
          {/* Profile Header Hero */}
          <div
            className="relative flex flex-col items-center justify-center rounded-2xl border p-6 text-center shadow-xs"
            style={{ background: "#182533", borderColor: "rgba(255,255,255,0.06)" }}
          >
            <div className="relative mb-3">
              <Avatar src={avatar || me?.avatar} name={name || me?.name || "User"} size="xl" className="size-24 border-2 border-[#2b5278]/40" />
              <button
                type="button"
                onClick={() => {
                  const url = prompt("Enter Image URL for avatar:", avatar || me?.avatar);
                  if (url !== null) setAvatar(url);
                }}
                className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full bg-[#2b5278] text-white shadow-md transition-transform hover:scale-105"
                title="Change Avatar"
              >
                <Camera className="size-4" />
              </button>
            </div>

            <h2 className="text-base font-bold text-[#e3e3e3]">{name || "Your Name"}</h2>
            <p className="text-xs text-[#5d8aa8]">@{me?.username || "username"}</p>
            {me?.email && (
              <p className="text-[11px] text-[#5d8aa8]/70 mt-1 flex items-center gap-1">
                <Mail className="size-3 inline" /> {me.email}
              </p>
            )}
          </div>

          {/* Personal Details Form */}
          <div
            className="space-y-4 rounded-2xl border p-5"
            style={{ background: "#182533", borderColor: "rgba(255,255,255,0.06)" }}
          >
            <h3 className="text-[11px] font-semibold tracking-wider text-[#5d8aa8] uppercase flex items-center gap-2">
              <User className="size-3.5" /> General Details
            </h3>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#8ab4d0]">Display Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your display name"
                  className="h-9 border-white/10 bg-[#1c2633] text-xs text-[#e3e3e3] focus-visible:ring-1 focus-visible:ring-[#2b5278]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#8ab4d0]">Custom Status</label>
                <Input
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  placeholder="e.g. Working remotely, In a meeting"
                  className="h-9 border-white/10 bg-[#1c2633] text-xs text-[#e3e3e3] focus-visible:ring-1 focus-visible:ring-[#2b5278]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#8ab4d0]">About / Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write a few lines about yourself..."
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-[#1c2633] p-2.5 text-xs text-[#e3e3e3] placeholder:text-[#5d8aa8]/50 focus:outline-none focus:ring-1 focus:ring-[#2b5278] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Account Security Info */}
          <div
            className="space-y-3 rounded-2xl border p-5"
            style={{ background: "#182533", borderColor: "rgba(255,255,255,0.06)" }}
          >
            <h3 className="text-[11px] font-semibold tracking-wider text-[#5d8aa8] uppercase flex items-center gap-2">
              <ShieldCheck className="size-3.5" /> Account Verification
            </h3>
            <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
              <span className="text-[#8ab4d0]">Account Type</span>
              <span className="font-semibold text-emerald-400">Verified User</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-[#8ab4d0]">Encryption</span>
              <span className="text-[#e3e3e3]">Standard End-to-End</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
