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
    // Optimistic update locally
    if (field === "notifications_enabled") setNotifs(value);
    if (field === "sound_enabled") setSounds(value);
    if (field === "read_receipts_enabled") setReadReceipts(value);
    if (field === "enter_to_send") setEnterToSend(value);
    if (field === "media_auto_download") setMediaAuto(value);

    // Persist
    updateSettingsMut.mutate({ [field]: value });
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#0e1621] text-foreground">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header
        className="flex h-14 items-center gap-3 border-b px-4 select-none"
        style={{ background: "#17212b", borderColor: "rgba(255,255,255,0.07)" }}
      >
        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
            else useAppStore.getState().setActiveScreen("chat");
            if (!useAppStore.getState().activeId) {
              useAppStore.getState().setMobileView("list");
            }
          }}
          className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-[#e3e3e3]"
        >
          <ArrowLeft className="size-4" />
        </button>
        <h1 className="text-sm font-semibold text-[#e3e3e3]">Settings</h1>
      </header>

      {/* ── Scrollable Content ─────────────────────────────────────────── */}
      <div className="scroll-slim flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="mx-auto w-full max-w-xl space-y-6">
          
          {/* ── User Header Overview ──────────────────────────────────── */}
          <div className="flex items-center gap-4 rounded-2xl border bg-[#182533] p-5 shadow-sm" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <Avatar src={me?.avatar} name={me?.name || "User"} size="xl" />
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-[#e3e3e3]">{me?.name}</h2>
              <p className="text-xs text-[#5d8aa8]">@{me?.username}</p>
              <p className="text-[11px] text-[#5d8aa8]/70 mt-1 italic">{me?.bio || "No bio set."}</p>
            </div>
          </div>


          {/* ── Appearance ─────────────────────────────────────────────── */}
          <div className="space-y-3 rounded-2xl border bg-[#182533] p-5 shadow-sm" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#5d8aa8]">
              Appearance
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all ${
                  theme === "dark"
                    ? "border-[#5d8aa8] bg-[#2b5278]/20 text-[#e3e3e3]"
                    : "border-white/5 text-muted-foreground hover:bg-white/5 hover:text-[#e3e3e3]"
                }`}
              >
                <Moon className="size-4" /> Dark Mode
              </button>
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all ${
                  theme === "light"
                    ? "border-[#5d8aa8] bg-[#2b5278]/20 text-[#e3e3e3]"
                    : "border-white/5 text-muted-foreground hover:bg-white/5 hover:text-[#e3e3e3]"
                }`}
              >
                <Sun className="size-4" /> Light Mode
              </button>
            </div>
          </div>

          {/* ── Preferences ────────────────────────────────────────────── */}
          <div className="space-y-4 rounded-2xl border bg-[#182533] p-5 shadow-sm" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#5d8aa8]">
              Preferences
            </h3>
            
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid size-8 place-items-center rounded-lg bg-[#2b5278]/20">
                    <Bell className="size-4 text-[#5d8aa8]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#e3e3e3]">Notifications</p>
                    <p className="text-[10px] text-muted-foreground">Receive push notifications</p>
                  </div>
                </div>
                <Switch checked={notifs} onCheckedChange={(v) => handleSettingChange("notifications_enabled", v)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid size-8 place-items-center rounded-lg bg-[#2b5278]/20">
                    <Volume2 className="size-4 text-[#5d8aa8]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#e3e3e3]">Sounds</p>
                    <p className="text-[10px] text-muted-foreground">Play in-app sounds</p>
                  </div>
                </div>
                <Switch checked={sounds} onCheckedChange={(v) => handleSettingChange("sound_enabled", v)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid size-8 place-items-center rounded-lg bg-[#2b5278]/20">
                    <CheckCheck className="size-4 text-[#5d8aa8]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#e3e3e3]">Read Receipts</p>
                    <p className="text-[10px] text-muted-foreground">Let others know you've read messages</p>
                  </div>
                </div>
                <Switch checked={readReceipts} onCheckedChange={(v) => handleSettingChange("read_receipts_enabled", v)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid size-8 place-items-center rounded-lg bg-[#2b5278]/20">
                    <Keyboard className="size-4 text-[#5d8aa8]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#e3e3e3]">Enter to Send</p>
                    <p className="text-[10px] text-muted-foreground">Send messages by pressing Enter</p>
                  </div>
                </div>
                <Switch checked={enterToSend} onCheckedChange={(v) => handleSettingChange("enter_to_send", v)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid size-8 place-items-center rounded-lg bg-[#2b5278]/20">
                    <PlaySquare className="size-4 text-[#5d8aa8]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#e3e3e3]">Auto-download Media</p>
                    <p className="text-[10px] text-muted-foreground">Automatically download photos & videos</p>
                  </div>
                </div>
                <Switch checked={mediaAuto} onCheckedChange={(v) => handleSettingChange("media_auto_download", v)} />
              </div>
            </div>
          </div>

          {/* ── Danger Zone ────────────────────────────────────────────── */}
          <div className="space-y-3 rounded-2xl border bg-[#182533] p-5 shadow-sm" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#5d8aa8]">
              Account Session
            </h3>
            <Button
              variant="destructive"
              onClick={() => {
                signOut();
                toast.success("Signed out successfully");
              }}
              className="h-10 w-full gap-2 rounded-xl text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/10"
            >
              <LogOut className="size-4" />
              Sign Out
            </Button>
          </div>
          
        </div>
      </div>
    </div>
  );
}
