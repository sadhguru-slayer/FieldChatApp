import { MessageCircle, Settings, User } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const authed = useAppStore((s) => s.authed);
  const activeScreen = useAppStore((s) => s.activeScreen);
  const setActiveScreen = useAppStore((s) => s.setActiveScreen);
  const mobileTab = useAppStore((s) => s.mobileTab);
  const setMobileTab = useAppStore((s) => s.setMobileTab);
  const setMobileView = useAppStore((s) => s.setMobileView);

  const mobileView = useAppStore((s) => s.mobileView);
  const panel = useAppStore((s) => s.panel);

  if (!authed || panel === "details" || (activeScreen === "chat" && mobileView === "chat")) return null;

  const tabs = [
    { id: "chats", label: "Chats", Icon: MessageCircle },
    { id: "settings", label: "Settings", Icon: Settings },
    { id: "profile", label: "Profile", Icon: User },
  ];

  const handleTab = (id) => {
    setMobileTab(id);
    if (id === "chats") {
      setActiveScreen("chat");
      setMobileView("list");
    } else {
      setActiveScreen(id);
    }
  };

  // Determine active tab dynamically from activeScreen or mobileTab
  const currentTab = activeScreen === "chat" ? "chats" : activeScreen;

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-5 mb-4 pointer-events-auto flex items-center justify-around rounded-full border border-border/50 bg-sidebar/95 backdrop-blur-xl shadow-2xl px-1.5 py-1 ring-1 ring-white/5">
        {tabs.map(({ id, label, Icon }) => {
          const active = currentTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleTab(id)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-[3px] py-1 px-1 rounded-xl transition-all duration-200 no-tap-highlight select-none",
                active ? "text-accent" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "grid size-7 place-items-center rounded-[10px] transition-all duration-200",
                  active ? "bg-accent/15 border border-accent/20 shadow-xs scale-105" : "bg-transparent"
                )}
              >
                <Icon className={cn("size-[16px] transition-all duration-200", active ? "scale-110" : "scale-100")} />
              </div>
              <span
                className={cn(
                  "text-[9.5px] font-semibold transition-all duration-200 tracking-tight",
                  active ? "text-accent font-bold" : "text-muted-foreground/70"
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
