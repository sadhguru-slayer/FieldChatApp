import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  LogOut,
  Moon,
  Sun,
  Bell,
  CheckCheck,
  PlaySquare,
  Keyboard,
  Volume2,
  ChevronRight,
  Shield,
  Laptop,
  Palette,
  MessageSquare,
  Sparkles,
  Pencil,
  User,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { getMe, getSettings, updateSettings } from "@/services/api";
import { cn } from "@/lib/utils";

export function SettingsScreen({ onClose }) {
  const qc = useQueryClient();
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const signOut = useAppStore((s) => s.signOut);
  const setActiveScreen = useAppStore((s) => s.setActiveScreen);
  const setMobileView = useAppStore((s) => s.setMobileView);
  const setMobileTab = useAppStore((s) => s.setMobileTab);

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: getSettings });

  // Settings State
  const [notifs, setNotifs] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [enterToSend, setEnterToSend] = useState(true);
  const [mediaAuto, setMediaAuto] = useState(true);

  useEffect(() => {
    if (settings) {
      setNotifs(settings.notifications_enabled ?? true);
      setSounds(settings.sound_enabled ?? true);
      setReadReceipts(settings.read_receipts_enabled ?? true);
      setEnterToSend(settings.enter_to_send ?? true);
      setMediaAuto(settings.media_auto_download ?? true);
    }
  }, [settings]);

  const updateSettingsMut = useMutation({
    mutationFn: (patch) => updateSettings(patch),
    onSuccess: (data, patch) => {
      qc.setQueryData(["settings"], (old) => ({ ...old, ...(data || {}), ...patch }));
      toast.success("Settings updated");
    },
    onError: () => toast.error("Failed to update setting"),
  });

  const handleSettingChange = (field, value) => {
    if (field === "notifications_enabled") setNotifs(value);
    if (field === "sound_enabled") setSounds(value);
    if (field === "read_receipts_enabled") setReadReceipts(value);
    if (field === "enter_to_send") setEnterToSend(value);
    if (field === "media_auto_download") setMediaAuto(value);

    updateSettingsMut.mutate({ [field]: value });
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      setActiveScreen("chat");
      setMobileView("list");
      setMobileTab("chats");
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground select-none overflow-hidden">
      {/* ── Top Header ──────────────────────────────────────────────── */}
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

        <h1 className="text-sm font-bold text-foreground tracking-tight">Settings</h1>

        <div className="w-12" />
      </header>

      {/* ── Scrollable Body ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto scroll-slim">
        <div className="max-w-xl mx-auto px-4 md:px-6 py-6 space-y-6 pb-32 md:pb-12">

          {/* ── Top Profile Overview Card ─────────────────────────────── */}
          <div className="rounded-2xl border border-border/40 bg-surface/60 p-4 shadow-2xs backdrop-blur-md">
            <div className="flex items-center gap-4">
              <Avatar src={me?.avatar} name={me?.name || "User"} size="xl" className="size-16 border border-border/40" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-foreground truncate">{me?.display_name || me?.name || "User"}</h2>
                  {me?.customStatus && (
                    <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 truncate max-w-[120px]">
                      {me.customStatus}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">@{me?.username}</p>
                <p className="text-[11.5px] text-muted-foreground/80 mt-1 line-clamp-1 italic font-normal">
                  {me?.bio || "No bio set yet."}
                </p>
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-border/30 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Account profile & avatar</span>
              <button
                type="button"
                onClick={() => setActiveScreen("profile")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent text-xs font-semibold transition-all cursor-pointer"
              >
                <Pencil className="size-3.5" />
                <span>Edit Profile</span>
                <ChevronRight className="size-3.5 opacity-70" />
              </button>
            </div>
          </div>

          {/* ── Section: Appearance ───────────────────────────────────── */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
              <Palette className="size-3.5 opacity-70 text-indigo-400" />
              <span>Appearance & Theme</span>
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={cn(
                  "flex items-center justify-center gap-2.5 rounded-2xl border p-3.5 text-xs font-semibold transition-all cursor-pointer select-none",
                  theme === "dark"
                    ? "border-accent/60 bg-accent/15 text-foreground shadow-sm ring-1 ring-accent/40"
                    : "border-border/40 bg-surface/50 text-muted-foreground hover:bg-elevated hover:text-foreground"
                )}
              >
                <Moon className="size-4 text-accent" />
                <span>Dark Mode</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("light")}
                className={cn(
                  "flex items-center justify-center gap-2.5 rounded-2xl border p-3.5 text-xs font-semibold transition-all cursor-pointer select-none",
                  theme === "light"
                    ? "border-accent/60 bg-accent/15 text-foreground shadow-sm ring-1 ring-accent/40"
                    : "border-border/40 bg-surface/50 text-muted-foreground hover:bg-elevated hover:text-foreground"
                )}
              >
                <Sun className="size-4 text-accent" />
                <span>Light Mode</span>
              </button>
            </div>
          </div>

          {/* ── Section: Notifications & Audio ────────────────────────── */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
              <Bell className="size-3.5 opacity-70 text-blue-400" />
              <span>Notifications & Sound</span>
            </p>

            <div className="rounded-2xl bg-surface/60 border border-border/40 overflow-hidden divide-y divide-border/30 backdrop-blur-md shadow-2xs">
              {/* Notifications Toggle */}
              <div className="flex items-center justify-between px-4 py-3.5 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid size-8 place-items-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                    <Bell className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">Push Notifications</p>
                    <p className="text-[11px] text-muted-foreground">Receive alerts for new incoming messages</p>
                  </div>
                </div>
                <Switch checked={notifs} onCheckedChange={(v) => handleSettingChange("notifications_enabled", v)} />
              </div>

              {/* In-app Sounds Toggle */}
              <div className="flex items-center justify-between px-4 py-3.5 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid size-8 place-items-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                    <Volume2 className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">In-App Sound Effects</p>
                    <p className="text-[11px] text-muted-foreground">Play sound cues when messages arrive</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const audio = new Audio("/pop.mp3");
                        audio.volume = 0.4;
                        audio.play().catch(() => {});
                      } catch (e) {}
                    }}
                    className="h-7 px-2.5 bg-elevated hover:bg-elevated/80 border border-border/60 rounded-lg text-[10px] text-muted-foreground hover:text-foreground font-semibold transition-all cursor-pointer"
                  >
                    Test
                  </button>
                  <Switch checked={sounds} onCheckedChange={(v) => handleSettingChange("sound_enabled", v)} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Section: Messaging Preferences ────────────────────────── */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
              <MessageSquare className="size-3.5 opacity-70 text-emerald-400" />
              <span>Chat & Messaging</span>
            </p>

            <div className="rounded-2xl bg-surface/60 border border-border/40 overflow-hidden divide-y divide-border/30 backdrop-blur-md shadow-2xs">
              {/* Read Receipts */}
              <div className="flex items-center justify-between px-4 py-3.5 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid size-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    <CheckCheck className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">Read Receipts</p>
                    <p className="text-[11px] text-muted-foreground">Show blue checkmarks when you've read messages</p>
                  </div>
                </div>
                <Switch checked={readReceipts} onCheckedChange={(v) => handleSettingChange("read_receipts_enabled", v)} />
              </div>

              {/* Enter to Send */}
              <div className="flex items-center justify-between px-4 py-3.5 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid size-8 place-items-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                    <Keyboard className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">Enter to Send</p>
                    <p className="text-[11px] text-muted-foreground">Press Enter to send (Shift+Enter for newline)</p>
                  </div>
                </div>
                <Switch checked={enterToSend} onCheckedChange={(v) => handleSettingChange("enter_to_send", v)} />
              </div>

              {/* Auto-download Media */}
              <div className="flex items-center justify-between px-4 py-3.5 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid size-8 place-items-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                    <PlaySquare className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">Auto-Download Media</p>
                    <p className="text-[11px] text-muted-foreground">Automatically download received photos and files</p>
                  </div>
                </div>
                <Switch checked={mediaAuto} onCheckedChange={(v) => handleSettingChange("media_auto_download", v)} />
              </div>
            </div>
          </div>

          {/* ── Section: Security & Devices ───────────────────────────── */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
              <Shield className="size-3.5 opacity-70 text-violet-400" />
              <span>Devices & Security</span>
            </p>

            <button
              type="button"
              onClick={() => setActiveScreen("devices")}
              className="flex w-full items-center justify-between rounded-2xl border border-border/40 bg-surface/60 p-4 transition-all hover:bg-elevated/70 text-left group shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="grid size-9 place-items-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 transition-transform group-hover:scale-105 shrink-0">
                  <Laptop className="size-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">Active Sessions & Devices</p>
                  <p className="text-[11px] text-muted-foreground">View or revoke active device login tokens</p>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 shrink-0" />
            </button>
          </div>

          {/* ── Section: Account Session ──────────────────────────────── */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
              Account Session
            </p>

            <Button
              variant="destructive"
              onClick={() => {
                signOut();
                toast.success("Signed out successfully");
              }}
              className="h-11 w-full gap-2 rounded-2xl text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 transition-all font-bold cursor-pointer"
            >
              <LogOut className="size-4" />
              <span>Sign Out of Fieldchat</span>
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
