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
  Trash2,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { getMe, updateMe } from "@/services/api";
import { uploadFileWithProgress } from "@/services/api/attachments";
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

// ── Editable field ────────────────────────────────────────────────────────────
function Field({ icon: Icon, label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        <Icon className="size-3 opacity-70" />
        {label}
      </label>
      {children}
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
      setName(me.name || "");
      setBio(me.bio || "");
      setStatus(me.customStatus || "");
      setAvatar(me.avatar || "");
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
      setAvatar(me?.avatar || ""); // revert on error
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
      toast.success("Profile saved");
    },
    onError: (err) => toast.error(err.message || "Failed to save profile"),
  });

  const handleBack = () => (onClose ? onClose() : setActiveScreen("chat"));

  const currentAvatar = avatar || me?.avatar || "";
  const displayName = name || me?.name || "Your Name";

  return (
    <>
      <div className="flex h-full w-full flex-col bg-background text-foreground overflow-hidden">

        {/* ── Sticky top bar ────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20 flex h-13 items-center justify-between border-b border-border/30 px-4 shrink-0 bg-background/90 backdrop-blur-md">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 text-accent hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4.5" />
            <span className="text-[13px] font-medium">Back</span>
          </button>
          <h1 className="text-[13.5px] font-semibold text-foreground tracking-tight">My Profile</h1>
          <Button
            onClick={() => updateMut.mutate()}
            disabled={updateMut.isPending || isUploading}
            size="sm"
            className="h-8 gap-1.5 text-xs font-semibold px-4 rounded-xl"
          >
            <Check className="size-3.5" />
            {updateMut.isPending ? "Saving…" : "Save"}
          </Button>
        </header>

        {/* ── Scrollable body ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto scroll-slim">

          {/* Hero banner */}
          <div className="relative">
            <div className="h-28 sm:h-36 bg-gradient-to-br from-accent/25 via-violet-500/15 to-emerald-500/15" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

            {/* Avatar section positioned at banner bottom */}
            <div className="absolute -bottom-12 left-6 flex items-end gap-4">
              <div className="relative group">
                {/* Avatar with click to focus/preview */}
                <button
                  type="button"
                  onClick={() => currentAvatar && setImageViewerOpen(true)}
                  className={cn(
                    "block rounded-full overflow-hidden transition-all duration-200 shadow-xl",
                    currentAvatar ? "cursor-pointer hover:opacity-95" : "cursor-default"
                  )}
                  aria-label="View profile photo"
                  title={currentAvatar ? "Click to view full photo" : ""}
                >
                  <Avatar
                    src={currentAvatar}
                    name={displayName}
                    size="xl"
                    className="size-24 border-2 border-background/80 shadow-md"
                  />
                  {currentAvatar && (
                    <span className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-2xs">
                      <ZoomIn className="size-5 text-white" />
                    </span>
                  )}
                </button>
              </div>

              {/* Photo Action Buttons */}
              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface/90 hover:bg-elevated text-foreground border border-border/40 text-xs font-medium shadow-sm transition-all hover:border-accent/40 active:scale-95 disabled:opacity-60"
                  aria-label="Change photo"
                >
                  {isUploading ? (
                    <Loader2 className="size-3.5 animate-spin text-accent" />
                  ) : (
                    <Camera className="size-3.5 text-accent" />
                  )}
                  <span>{currentAvatar ? "Change Photo" : "Upload Photo"}</span>
                </button>

                {currentAvatar && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={isUploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 text-xs font-medium shadow-sm transition-all active:scale-95 disabled:opacity-60"
                    aria-label="Remove photo"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Remove</span>
                  </button>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarFileChange}
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Name display below banner */}
          <div className="pt-16 px-6 pb-2">
            <h2 className="text-xl font-bold text-foreground leading-tight">{displayName}</h2>
            <div className="flex items-center gap-1.5 mt-0.5 text-muted-foreground">
              <AtSign className="size-3 shrink-0" />
              <p className="text-sm">{me?.username || "username"}</p>
            </div>
            {me?.email && (
              <div className="flex items-center gap-1.5 mt-1 text-muted-foreground/70">
                <Mail className="size-3 shrink-0" />
                <p className="text-xs">{me.email}</p>
              </div>
            )}
            {status && (
              <p className="text-xs font-medium text-emerald-400 mt-2 flex items-center gap-1.5">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
                </span>
                {status}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="mx-6 border-t border-border/30 mt-2 mb-5" />

          {/* Edit form */}
          <div className="px-6 pb-12 space-y-5 max-w-lg">

            {/* Email Address - Read Only Primary Field */}
            <Field icon={Mail} label="Email Address (Primary)">
              <div className="relative flex items-center">
                <Input
                  value={me?.email || ""}
                  readOnly
                  disabled
                  placeholder="user@example.com"
                  className="h-10 text-[13px] rounded-xl bg-surface/40 border-border/30 text-muted-foreground/90 cursor-not-allowed pr-20 select-text"
                />
                <span className="absolute right-2.5 text-[10px] font-semibold text-accent bg-accent/15 px-2 py-0.5 rounded-md border border-accent/25 select-none">
                  Primary
                </span>
              </div>
              <p className="text-[10.5px] text-muted-foreground/60 px-0.5">
                Your email is your primary login identifier and cannot be changed.
              </p>
            </Field>

            <Field icon={AtSign} label="Display Name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your display name"
                className="h-10 text-[13px] rounded-xl bg-surface/60 border-border/40"
              />
            </Field>

            <Field icon={Smile} label="Custom Status">
              <Input
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="e.g. Working remotely, In a meeting…"
                className="h-10 text-[13px] rounded-xl bg-surface/60 border-border/40"
              />
            </Field>

            <Field icon={FileText} label="Bio">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a few lines about yourself…"
                rows={4}
                className="w-full rounded-xl border border-border/40 bg-surface/60 px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none leading-relaxed"
              />
            </Field>

            {/* Save button (bottom for thumb reach on mobile) */}
            <Button
              onClick={() => updateMut.mutate()}
              disabled={updateMut.isPending || isUploading}
              className="w-full h-11 text-sm font-semibold rounded-xl"
            >
              {updateMut.isPending ? (
                <><Loader2 className="size-4 animate-spin mr-2" /> Saving…</>
              ) : (
                <><Check className="size-4 mr-2" /> Save Profile</>
              )}
            </Button>

            {/* Account info — no box, just subtle row */}
            <div className="pt-2 space-y-2.5">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                <ShieldCheck className="size-3 opacity-60" /> Account
              </p>
              <div className="flex items-center justify-between text-xs py-2 border-b border-border/20">
                <span className="text-muted-foreground">Status</span>
                <span className="font-semibold text-emerald-400">Active</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2">
                <span className="text-muted-foreground">Encryption</span>
                <span className="text-foreground/70 font-medium">Standard</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
