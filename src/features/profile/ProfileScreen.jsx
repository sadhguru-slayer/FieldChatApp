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
  User,
  Sparkles,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { getMe, updateMe } from "@/services/api";
import { uploadFileWithProgress } from "@/services/api/attachments";
import { cn, getFullMediaUrl } from "@/lib/utils";

// ── Quick status suggestions ──────────────────────────────────────────────────
const STATUS_PRESETS = [
  "🎯 In Focus",
  "💼 In a meeting",
  "🏖️ On leave",
  "🚀 Coding",
  "☕ Grabbing coffee",
  "🏠 Working remotely",
];

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
  const setMobileView = useAppStore((s) => s.setMobileView);
  const setMobileTab = useAppStore((s) => s.setMobileTab);

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

    // Instant preview
    const objectUrl = URL.createObjectURL(file);
    setAvatar(objectUrl);

    setIsUploading(true);
    try {
      const res = await uploadFileWithProgress(file, () => {}, { entity_id: me?.id || me?.userId });
      if (res?.url) {
        setAvatar(res.url);
        toast.success("Photo uploaded successfully");
      }
    } catch (err) {
      toast.error(err.message || "Failed to upload photo");
      setAvatar(me?.avatar || me?.avatar_url || "");
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
      toast.success("Profile updated successfully");
    },
    onError: (err) => toast.error(err.message || "Failed to save profile"),
  });

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      setActiveScreen("chat");
      setMobileView("list");
      setMobileTab("chats");
    }
  };

  const currentAvatar = avatar || me?.avatar || me?.avatar_url || "";
  const displayName = name || me?.display_name || me?.name || "Your Name";

  const hasChanges =
    name !== (me?.name || me?.display_name || "") ||
    bio !== (me?.bio || "") ||
    status !== (me?.customStatus || me?.custom_status || "") ||
    avatar !== (me?.avatar || me?.avatar_url || "");

  return (
    <>
      <div className="flex h-full w-full flex-col bg-background text-foreground overflow-hidden select-none">
        {/* ── Top Header ─────────────────────────────────────────────── */}
        <header
          className="sticky top-0 z-20 flex h-14 items-center justify-between px-4 md:px-6 shrink-0 bg-surface/80 backdrop-blur-xl border-b border-border/40 shadow-xs"
          style={{
            paddingTop: "max(0.5rem, env(safe-area-inset-top, 0px))",
          }}
        >
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-elevated transition-colors -ml-1 text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            <span>Back</span>
          </button>

          <h1 className="text-sm font-bold text-foreground tracking-tight">Edit Profile</h1>

          <Button
            onClick={() => updateMut.mutate()}
            disabled={updateMut.isPending || isUploading}
            size="sm"
            className={cn(
              "h-8 gap-1.5 text-xs font-semibold px-3.5 rounded-xl shadow-xs transition-all",
              hasChanges ? "bg-accent text-accent-foreground shadow-accent/20" : "opacity-90"
            )}
          >
            {updateMut.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
            <span>Save</span>
          </Button>
        </header>

        {/* ── Scrollable Body ────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto scroll-slim">
          <div className="max-w-xl mx-auto px-4 md:px-6 py-6 space-y-6 pb-32 md:pb-12">

            {/* ── Avatar & Identity Hero ──────────────────────────────── */}
            <div className="flex flex-col items-center text-center pt-2 pb-1">
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
                    className="size-24 border-2 border-border/50 shadow-2xl ring-4 ring-white/5"
                  />
                  {currentAvatar && (
                    <span className="absolute inset-0 rounded-full flex items-center justify-center bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn className="size-5 text-white" />
                    </span>
                  )}
                </button>

                {/* Camera upload badge */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full bg-accent text-white border-2 border-background shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                  title="Change photo"
                  aria-label="Change photo"
                >
                  {isUploading ? (
                    <Loader2 className="size-3.5 animate-spin text-white" />
                  ) : (
                    <Camera className="size-3.5" />
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

              {/* Photo Actions */}
              <div className="mt-3 flex items-center gap-2.5">
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
                    <span className="text-muted-foreground/40 text-xs">•</span>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={isUploading}
                      className="text-xs font-medium text-destructive/90 hover:text-destructive hover:underline transition-all cursor-pointer"
                    >
                      Remove Photo
                    </button>
                  </>
                )}
              </div>

              {/* Display Name & Handle */}
              <h2 className="text-lg font-bold text-foreground mt-3 tracking-tight">
                {displayName}
              </h2>
              {me?.username && (
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                  <AtSign className="size-3 opacity-70 shrink-0" />
                  <span>{me.username}</span>
                </p>
              )}
            </div>

            {/* ── Section: Profile Details ────────────────────────────── */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
                <User className="size-3.5 opacity-70 text-accent" />
                <span>Profile Details</span>
              </p>

              <div className="rounded-2xl bg-surface/60 border border-border/40 overflow-hidden divide-y divide-border/30 backdrop-blur-md shadow-2xs">
                {/* Display Name */}
                <div className="flex items-center px-4 py-3.5 gap-3.5">
                  <div className="grid size-8 place-items-center rounded-xl bg-accent/10 text-accent border border-accent/20 shrink-0">
                    <AtSign className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name or display name"
                      className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none mt-0.5 font-medium"
                    />
                  </div>
                </div>

                {/* Custom Status */}
                <div className="px-4 py-3.5 space-y-2">
                  <div className="flex items-center gap-3.5">
                    <div className="grid size-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      <Smile className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                        Custom Status
                      </label>
                      <input
                        type="text"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        placeholder="What's your current status?"
                        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none mt-0.5 font-medium"
                      />
                    </div>
                    {status && (
                      <button
                        type="button"
                        onClick={() => setStatus("")}
                        className="text-[11px] text-muted-foreground hover:text-foreground font-medium px-2 py-1 rounded-md hover:bg-elevated transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Preset chips */}
                  <div className="pt-1 flex flex-wrap gap-1.5 pl-11">
                    {STATUS_PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setStatus(p)}
                        className={cn(
                          "text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer select-none",
                          status === p
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-medium"
                            : "bg-surface/80 text-muted-foreground border-border/40 hover:bg-elevated hover:text-foreground"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bio */}
                <div className="flex items-start px-4 py-3.5 gap-3.5">
                  <div className="grid size-8 place-items-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 shrink-0 mt-0.5">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      Bio / About
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Share a short bio or description with your contacts…"
                      rows={3}
                      className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none mt-0.5 resize-none leading-relaxed font-normal"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section: Account Information ─────────────────────────── */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 opacity-70 text-emerald-400" />
                <span>Account Information</span>
              </p>

              <div className="rounded-2xl bg-surface/60 border border-border/40 overflow-hidden divide-y divide-border/30 backdrop-blur-md shadow-2xs">
                {/* Email Row */}
                <div className="flex items-center justify-between px-4 py-3.5 gap-3">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="grid size-8 place-items-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                      <Mail className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                        Primary Email
                      </label>
                      <p className="text-sm font-medium text-foreground/90 truncate select-text mt-0.5">
                        {me?.email || "No email on record"}
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[10.5px] font-semibold text-muted-foreground bg-elevated px-2.5 py-1 rounded-full border border-border/40 shrink-0">
                    <Lock className="size-3 opacity-70" /> Primary
                  </span>
                </div>

                {/* Account Status */}
                <div className="flex items-center justify-between px-4 py-3 text-xs">
                  <span className="flex items-center gap-2 font-medium text-muted-foreground">
                    <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
                    <span>Security & Status</span>
                  </span>
                  <span className="text-[10.5px] font-semibold bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    Active & Verified
                  </span>
                </div>
              </div>
            </div>

            {/* ── Save Changes Bottom Button ───────────────────────────── */}
            <div className="pt-2">
              <Button
                onClick={() => updateMut.mutate()}
                disabled={updateMut.isPending || isUploading}
                className="w-full h-11 text-xs font-bold rounded-2xl shadow-lg gap-2 bg-accent text-accent-foreground hover:bg-accent/90 transition-all cursor-pointer"
              >
                {updateMut.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4 stroke-[2.5]" />
                )}
                <span>Save Profile Changes</span>
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
