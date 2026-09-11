import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Camera,
  Check,
  Loader2,
  AtSign,
  Mail,
  Smile,
  FileText,
  ShieldCheck,
  ZoomIn,
  X,
  Lock,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { getMe, updateMe } from "@/services/api";
import { uploadFileWithProgress } from "@/services/api/attachments";
import { cn, getFullMediaUrl } from "@/lib/utils";

// ── Full-screen image viewer ──────────────────────────────────────────────────
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

export function ProfileScreen({ onClose }) {
  const qc = useQueryClient();
  const setActiveScreen = useAppStore((s) => s.setActiveScreen);
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe });

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (me) {
      setName(me.name || me.display_name || "");
      setBio(me.bio || "");
      setStatus(me.customStatus || me.custom_status || "");
      setAvatar(me.avatar || me.avatar_url || "");
    }
  }, [me]);

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file only (PNG, JPG, WEBP, GIF).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10 MB.");
      return;
    }

    // Instant optimistic preview
    const objectUrl = URL.createObjectURL(file);
    setAvatar(objectUrl);

    setIsUploading(true);
    try {
      const res = await uploadFileWithProgress(file, () => {}, { entity_id: me?.id || me?.userId });
      if (res?.url) {
        setAvatar(res.url);
        toast.success("Photo uploaded");
      }
    } catch (err) {
      toast.error(err.message || "Failed to upload photo");
      setAvatar(me?.avatar || me?.avatar_url || ""); // revert on error
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = () => {
    setAvatar("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.info("Photo removed. Click Save to apply changes.");
  };

  const updateMut = useMutation({
    mutationFn: () => updateMe({ name, bio, customStatus: status, avatar: avatar || null }),
    onSuccess: (data) => {
      qc.setQueryData(["me"], (old) => ({
        ...old,
        ...(data || {}),
        name,
        bio,
        customStatus: status,
        avatar: data?.avatar_url || (avatar ? avatar : ""),
      }));
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Profile saved successfully");
    },
    onError: (err) => toast.error(err.message || "Failed to save profile"),
  });

  const handleBack = () => (onClose ? onClose() : setActiveScreen("chat"));

  const currentAvatar = avatar || me?.avatar || me?.avatar_url || "";
  const displayName = name || me?.display_name || me?.name || "Your Name";

  return (
    <>
      <div className="flex h-full w-full flex-col bg-background text-foreground overflow-hidden select-none">

        {/* ── Sleek translucent header ──────────────────────────────────── */}
        <header
          className="sticky top-0 z-20 flex h-14 items-center justify-between px-4 shrink-0 bg-background/80 backdrop-blur-xl border-b border-border/20"
          style={{
            paddingTop: "max(0.5rem, env(safe-area-inset-top, 0px))",
          }}
        >
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 py-1.5 px-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-elevated/40 transition-colors -ml-1 text-[13px] font-medium"
          >
            <ArrowLeft className="size-4" />
            <span>Back</span>
          </button>
          
          <h1 className="text-[14px] font-semibold text-foreground tracking-tight">Edit Profile</h1>

          <Button
            onClick={() => updateMut.mutate()}
            disabled={updateMut.isPending || isUploading}
            size="sm"
            className="h-8 gap-1.5 text-xs font-semibold px-3.5 rounded-xl shadow-xs"
          >
            {updateMut.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
            <span>Save</span>
          </Button>
        </header>

        {/* ── Scrollable content ────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto scroll-slim">
          <div className="max-w-md mx-auto px-4 py-6 space-y-6">

            {/* ── Avatar & Identity Section ──────────────────────────────── */}
            <div className="flex flex-col items-center text-center pt-2 pb-1">
              {/* Avatar with click-to-preview & subtle camera overlay */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => currentAvatar && setImageViewerOpen(true)}
                  className={cn(
                    "relative block rounded-full transition-transform active:scale-95",
                    currentAvatar ? "cursor-pointer" : "cursor-default"
                  )}
                  title={currentAvatar ? "Click to view full photo" : ""}
                >
                  <Avatar
                    src={currentAvatar}
                    name={displayName}
                    size="xl"
                    className="size-24 border-2 border-border/30 shadow-xl"
                  />
                  {currentAvatar && (
                    <span className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn className="size-5 text-white" />
                    </span>
                  )}
                </button>

                {/* Subtle camera upload button badge */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full bg-elevated text-foreground border border-border/50 shadow-md transition-transform hover:scale-105 active:scale-90 cursor-pointer"
                  title="Change photo"
                  aria-label="Change photo"
                >
                  {isUploading ? (
                    <Loader2 className="size-3.5 animate-spin text-accent" />
                  ) : (
                    <Camera className="size-3.5 text-foreground/80" />
                  )}
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarFileChange}
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                />
              </div>

              {/* Photo action text / remove link */}
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="text-xs font-semibold text-accent hover:underline transition-all cursor-pointer"
                >
                  {currentAvatar ? "Change Photo" : "Upload Photo"}
                </button>
                {currentAvatar && (
                  <>
                    <span className="text-muted-foreground/30 text-xs">·</span>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={isUploading}
                      className="text-xs font-medium text-destructive/80 hover:text-destructive hover:underline transition-all cursor-pointer"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>

              {/* Name & Handle */}
              <h2 className="text-lg font-bold text-foreground mt-3 tracking-tight">
                {displayName}
              </h2>
              {me?.username && (
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                  <AtSign className="size-3 opacity-60 shrink-0" />
                  <span>{me.username}</span>
                </p>
              )}
              {status && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="truncate max-w-[200px]">{status}</span>
                </div>
              )}
            </div>

            {/* ── Grouped Profile Info Card (Sleek, bezel-less, iOS style) ─ */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-1">
                Profile Details
              </p>

              <div className="rounded-2xl bg-surface/30 border border-border/30 overflow-hidden divide-y divide-border/20 backdrop-blur-xs">
                {/* Display Name Row */}
                <div className="flex items-center px-4 py-3 gap-3">
                  <AtSign className="size-4 text-muted-foreground/60 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10.5px] uppercase font-semibold text-muted-foreground/60">Display Name</p>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your display name"
                      className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none mt-0.5 font-medium"
                    />
                  </div>
                </div>

                {/* Custom Status Row */}
                <div className="flex items-center px-4 py-3 gap-3">
                  <Smile className="size-4 text-muted-foreground/60 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10.5px] uppercase font-semibold text-muted-foreground/60">Custom Status</p>
                    <input
                      type="text"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      placeholder="What's your status?"
                      className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none mt-0.5 font-medium"
                    />
                  </div>
                </div>

                {/* Bio Row */}
                <div className="flex items-start px-4 py-3 gap-3">
                  <FileText className="size-4 text-muted-foreground/60 shrink-0 mt-1" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10.5px] uppercase font-semibold text-muted-foreground/60">Bio / About</p>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Add a few words about yourself…"
                      rows={3}
                      className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none mt-0.5 resize-none leading-relaxed font-normal"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Account & Security Card ────────────────────────────────── */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-1">
                Account Information
              </p>

              <div className="rounded-2xl bg-surface/30 border border-border/30 overflow-hidden divide-y divide-border/20 backdrop-blur-xs">
                {/* Email Row (Read-only) */}
                <div className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Mail className="size-4 text-muted-foreground/60 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10.5px] uppercase font-semibold text-muted-foreground/60">Email</p>
                      <p className="text-sm font-medium text-foreground/90 truncate select-text mt-0.5">
                        {me?.email || "No email"}
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-elevated px-2 py-0.5 rounded-full border border-border/40 shrink-0">
                    <Lock className="size-2.5 opacity-70" /> Primary
                  </span>
                </div>

                {/* Account Status Row */}
                <div className="flex items-center justify-between px-4 py-3 text-xs">
                  <span className="flex items-center gap-2 font-medium text-muted-foreground">
                    <ShieldCheck className="size-3.5 text-emerald-400 shrink-0" />
                    <span>Account Status</span>
                  </span>
                  <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Active & Verified
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground/50 px-1 pt-0.5">
                Your email is used for account authentication and notifications.
              </p>
            </div>

            {/* Save Button */}
            <div className="pt-2 pb-8">
              <Button
                onClick={() => updateMut.mutate()}
                disabled={updateMut.isPending || isUploading}
                className="w-full h-10 text-xs font-semibold rounded-xl shadow-md gap-2"
              >
                {updateMut.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                <span>Save Changes</span>
              </Button>
            </div>

          </div>
        </div>
      </div>

      {/* Full-screen photo lightbox */}
      {imageViewerOpen && currentAvatar && (
        <ImageViewer
          src={currentAvatar}
          name={displayName}
          onClose={() => setImageViewerOpen(false)}
        />
      )}
    </>
  );
}
