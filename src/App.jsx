import { useEffect, useState } from "react";
import { LandingPage } from "@/features/landing/LandingPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import { useAppStore } from "@/store/useAppStore";
import { AuthScreen } from "@/features/auth/AuthScreen";
import { Sidebar, DesktopMenuDrawer } from "@/features/chat/Sidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ChatPane } from "@/features/chat/ChatPane";
import { GroupPanel } from "@/features/groups/GroupPanel";
import { CreateGroupDialog } from "@/features/groups/CreateGroupDialog";
import { CreateDmDialog } from "@/features/groups/CreateDmDialog";
import { SearchDialog } from "@/features/search/SearchDialog";
import { SettingsScreen } from "@/features/settings/SettingsScreen";
import { ProfileScreen } from "@/features/profile/ProfileScreen";
import { DevicesScreen } from "@/features/devices/DevicesScreen";
import { cn } from "@/lib/utils";
import { getMe } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

import { useAnimatePresence } from "@/hooks/useAnimatePresence";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
  },
});

import { wsClient } from "@/services/ws";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

function ChatApp() {
  const authed = useAppStore((s) => s.authed);
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const panel = useAppStore((s) => s.panel);
  const mobileView = useAppStore((s) => s.mobileView);
  const activeScreen = useAppStore((s) => s.activeScreen);
  const activeId = useAppStore((s) => s.activeId);
  const setActiveScreen = useAppStore((s) => s.setActiveScreen);
  const menuOpen = useAppStore((s) => s.menuOpen);
  const setMenuOpen = useAppStore((s) => s.setMenuOpen);
  const [showLanding, setShowLanding] = useState(true);
  const [authMode, setAuthMode] = useState("login");

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe, enabled: authed });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Unlock browser audio engine on very first user click, keydown, or touch
  useEffect(() => {
    if (typeof window === "undefined") return;

    const unlockAudio = () => {
      try {
        const audio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAAD");
        audio.volume = 0.01;
        audio.play()
          .then(() => {
            window.removeEventListener("click", unlockAudio);
            window.removeEventListener("keydown", unlockAudio);
            window.removeEventListener("touchstart", unlockAudio);
          })
          .catch(() => {});
      } catch (e) {}
    };

    window.addEventListener("click", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
    window.addEventListener("touchstart", unlockAudio);

    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  // Mobile browser navigation stack/back-button integration
  useEffect(() => {
    if (typeof window === "undefined" || !authed) return;

    if (!window.history.state || !window.history.state.fieldchat) {
      window.history.replaceState(
        {
          fieldchat: true,
          activeScreen: "chat",
          activeId: null,
          mobileView: "list",
          panel: null,
        },
        ""
      );
    }

    const handlePopState = (event) => {
      const state = event.state;
      if (state && state.fieldchat) {
        useAppStore.setState({
          activeScreen: state.activeScreen,
          activeId: state.activeId,
          mobileView: state.mobileView,
          panel: state.panel,
        });
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [authed]);

  useEffect(() => {
    if (typeof window === "undefined" || !authed) return;

    const currentHistoryState = window.history.state;

    const isDifferent =
      !currentHistoryState ||
      currentHistoryState.activeScreen !== activeScreen ||
      currentHistoryState.activeId !== activeId ||
      currentHistoryState.mobileView !== mobileView ||
      currentHistoryState.panel !== panel;

    if (isDifferent) {
      window.history.pushState(
        {
          fieldchat: true,
          activeScreen,
          activeId,
          mobileView,
          panel,
        },
        ""
      );
    }
  }, [activeScreen, activeId, mobileView, panel, authed]);

  useRealtimeSync(authed);

  const isDetailsOpen = panel === "details" && activeScreen === "chat";
  const { shouldRender: showDetails, isClosing: isClosingDetails } = useAnimatePresence(isDetailsOpen, 180);

  if (!hydrated) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#09090b] text-muted-foreground text-xs gap-3">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full overflow-hidden border border-border/20 animate-pulse">
            <img src="/Logo.svg" alt="Logo" className="size-full object-contain scale-[1.2] origin-center" />
          </div>
          <span className="text-[11px] text-muted-foreground/60">Loading Fieldchat...</span>
        </div>
      </div>
    );
  }

  if (!authed) {
    return showLanding ? (
      <LandingPage
        onLogin={() => {
          setAuthMode("login");
          setShowLanding(false);
        }}
        onGetStarted={() => {
          setAuthMode("register");
          setShowLanding(false);
        }}
      />
    ) : (
      <AuthScreen key={authMode} initialMode={authMode} />
    );
  }

  return (
    <div className="relative flex h-[100dvh] w-full overflow-hidden font-sans antialiased bg-[#09090b]">
      {/* ── Desktop Drawer (Hamburger triggered) ───────────────────────── */}
      <DesktopMenuDrawer isOpen={menuOpen} me={me} onClose={() => setMenuOpen(false)} />

      {/* ── Sidebar — On Mobile: shown in list view. On Desktop: compact sidebar panel ── */}
      <div
        className={cn(
          "h-full shrink-0 border-r border-border/30",
          "md:w-[320px] md:block",
          mobileView === "list" ? "w-full block" : "hidden md:block"
        )}
      >
        <Sidebar onOpenSettings={() => setActiveScreen("settings")} />
      </div>

      {/* ── Main Workspace ─────────────────────────────────────────────── */}
      <div
        className={cn(
          "relative flex h-full flex-1 flex-col min-w-0 bg-[#09090b] overflow-hidden",
          mobileView === "chat" || panel === "details" ? "flex" : "hidden md:flex"
        )}
      >
        {/* Base Screens */}
        <div className="flex h-full flex-1 flex-col min-w-0">
          {activeScreen === "chat" && <ChatPane />}
          {activeScreen === "profile" && <ProfileScreen onClose={() => setActiveScreen("chat")} />}
          {activeScreen === "settings" && <SettingsScreen onClose={() => setActiveScreen("chat")} />}
          {activeScreen === "devices" && <DevicesScreen onClose={() => setActiveScreen("chat")} />}
        </div>

        {/* ── Group/DM Details Panel (Slides over the conversation area) ── */}
        {showDetails && (
          <div
            className={cn(
              "absolute inset-0 z-50 md:left-auto md:right-0 md:w-[340px] md:border-l md:border-border/30 bg-background shadow-2xl",
              isClosingDetails ? "fc-slide-out-right" : "fc-slide-in-right"
            )}
          >
            <GroupPanel />
          </div>
        )}
      </div>

      {/* ── Persistent Floating Mobile Bottom Navigation ──────────────── */}
      <MobileBottomNav />

      {/* ── Dialog Modals ──────────────────────────────────────────────── */}
      <CreateGroupDialog />
      <CreateDmDialog />
      <SearchDialog />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChatApp />
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          classNames: {
            toast: "bg-zinc-900 border border-zinc-800 text-zinc-100 font-sans shadow-xl rounded-2xl",
            title: "text-xs font-semibold text-zinc-100",
            description: "text-xs text-zinc-400",
          },
        }}
      />
    </QueryClientProvider>
  );
}
