import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  ArrowLeft, LogOut, Moon, Sun, 
  Bell, Eye, EyeOff, CheckCheck, PlaySquare, Keyboard, Volume2 
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/store/useAppStore";
import { getMe, updateMe, getSettings, updateSettings } from "@/services/api";

export function SettingsScreen({ onClose }) {
  const qc = useQueryClient();
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const signOut = useAppStore((s) => s.signOut);

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: getSettings });

  // Profile State
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  // Settings State
  const [notifs, setNotifs] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [enterToSend, setEnterToSend] = useState(true);
  const [mediaAuto, setMediaAuto] = useState(true);

  useEffect(() => {
    if (me) {
      setName(me.name || "");
      setBio(me.bio || "");
    }
  }, [me]);

  useEffect(() => {
    if (settings) {
      setNotifs(settings.notifications_enabled ?? true);
      setSounds(settings.sound_enabled ?? true);
      setReadReceipts(settings.read_receipts_enabled ?? true);
      setEnterToSend(settings.enter_to_send ?? true);
      setMediaAuto(settings.media_auto_download ?? true);
    }
  }, [settings]);

  const updateProfileMut = useMutation({
    mutationFn: () => updateMe({ name, bio }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Profile updated");
    },
  });

  const updateSettingsMut = useMutation({
    mutationFn: (patch) => updateSettings(patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
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

  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground select-none overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="flex h-13.5 items-center gap-3 border-b border-border/40 px-4 md:px-6 shrink-0 bg-surface/50">
        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
            else useAppStore.getState().setActiveScreen("chat");
          }}
          className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </button>
        <h1 className="text-xs font-semibold text-foreground tracking-tight">Settings</h1>
      </header>

      {/* ── Scrollable Content ─────────────────────────────────────────── */}
      <div className="scroll-slim flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="mx-auto w-full max-w-xl space-y-5">
          
          {/* ── User Header Overview ──────────────────────────────────── */}
          <div className="flex items-center gap-4 rounded-2xl border border-border/40 bg-surface/70 p-5 shadow-2xs">
            <Avatar src={me?.avatar} name={me?.name || "User"} size="xl" />
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-foreground">{me?.name}</h2>
              <p className="text-xs text-muted-foreground">@{me?.username}</p>
              <p className="text-[11px] text-muted-foreground/80 mt-1 italic">{me?.bio || "No bio set."}</p>
            </div>
          </div>

          {/* ── Appearance ─────────────────────────────────────────────── */}
          <div className="space-y-3 rounded-2xl border border-border/40 bg-surface/70 p-5 shadow-2xs">
            <h3 className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              Appearance Mode
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all ${
                  theme === "dark"
                    ? "border-accent/40 bg-elevated text-foreground shadow-2xs"
                    : "border-border/40 text-muted-foreground hover:bg-elevated/50 hover:text-foreground"
                }`}
              >
                <Moon className="size-4" /> Dark Mode
              </button>
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all ${
                  theme === "light"
                    ? "border-accent/40 bg-elevated text-foreground shadow-2xs"
                    : "border-border/40 text-muted-foreground hover:bg-elevated/50 hover:text-foreground"
                }`}
              >
                <Sun className="size-4" /> Light Mode
              </button>
            </div>
          </div>

          {/* ── Preferences ────────────────────────────────────────────── */}
          <div className="space-y-4 rounded-2xl border border-border/40 bg-surface/70 p-5 shadow-2xs">
            <h3 className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              Messaging Preferences
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid size-8 place-items-center rounded-lg bg-elevated border border-border/40">
                    <Bell className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Notifications</p>
                    <p className="text-[10.5px] text-muted-foreground">Receive real-time push alerts</p>
                  </div>
                </div>
                <Switch checked={notifs} onCheckedChange={(v) => handleSettingChange("notifications_enabled", v)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid size-8 place-items-center rounded-lg bg-elevated border border-border/40">
                    <Volume2 className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">In-App Sounds</p>
                    <p className="text-[10.5px] text-muted-foreground">Play sound cues for incoming messages</p>
                  </div>
                </div>
                <Switch checked={sounds} onCheckedChange={(v) => handleSettingChange("sound_enabled", v)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid size-8 place-items-center rounded-lg bg-elevated border border-border/40">
                    <CheckCheck className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Read Receipts</p>
                    <p className="text-[10.5px] text-muted-foreground">Let contacts know when you've seen their messages</p>
                  </div>
                </div>
                <Switch checked={readReceipts} onCheckedChange={(v) => handleSettingChange("read_receipts_enabled", v)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid size-8 place-items-center rounded-lg bg-elevated border border-border/40">
                    <Keyboard className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Enter to Send</p>
                    <p className="text-[10.5px] text-muted-foreground">Press Enter key to send messages</p>
                  </div>
                </div>
                <Switch checked={enterToSend} onCheckedChange={(v) => handleSettingChange("enter_to_send", v)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid size-8 place-items-center rounded-lg bg-elevated border border-border/40">
                    <PlaySquare className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Auto-download Media</p>
                    <p className="text-[10.5px] text-muted-foreground">Automatically download media files</p>
                  </div>
                </div>
                <Switch checked={mediaAuto} onCheckedChange={(v) => handleSettingChange("media_auto_download", v)} />
              </div>
            </div>
          </div>

          {/* ── Danger Zone ────────────────────────────────────────────── */}
          <div className="space-y-3 rounded-2xl border border-border/40 bg-surface/70 p-5 shadow-2xs">
            <h3 className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              Account Session
            </h3>
            <Button
              variant="destructive"
              onClick={() => {
                signOut();
                toast.success("Signed out successfully");
              }}
              className="h-9 w-full gap-2 rounded-xl text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
            >
              <LogOut className="size-3.5" />
              Sign Out
            </Button>
          </div>
          
        </div>
      </div>
    </div>
  );
}
