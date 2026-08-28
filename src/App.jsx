import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import { useAppStore } from "@/store/useAppStore";
import { AuthScreen } from "@/features/auth/AuthScreen";
import { Sidebar } from "@/features/chat/Sidebar";
import { ChatPane } from "@/features/chat/ChatPane";
import { GroupPanel } from "@/features/groups/GroupPanel";
import { CreateGroupDialog } from "@/features/groups/CreateGroupDialog";
import { CreateDmDialog } from "@/features/groups/CreateDmDialog";
import { SearchDialog } from "@/features/search/SearchDialog";
import { SettingsScreen } from "@/features/settings/SettingsScreen";
import { ProfileScreen } from "@/features/profile/ProfileScreen";
import { DevicesScreen } from "@/features/devices/DevicesScreen";
import { cn } from "@/lib/utils";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5000,
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

    // 1. Initialize the root history state if not already set
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

    // 2. Listen to popstate event (e.g. back gesture or browser back button)
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

  // 3. React to state changes from store and push to history stack
  useEffect(() => {
    if (typeof window === "undefined" || !authed) return;

    const currentHistoryState = window.history.state;

    // Check if the current store state is different from what's in history
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

  if (!hydrated) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0e1621] text-[#5d8aa8] text-xs">
        Loading Fieldchat...
      </div>
    );
  }

  if (!authed) {
    return <AuthScreen />;
  }

  return (
    <div className="relative flex h-[100dvh] w-full overflow-hidden font-sans antialiased" style={{ background: "#0e1621" }}>
      {/* Sidebar View (Left) */}
      <div
        className={cn(
          "h-full w-full md:w-80 md:block shrink-0",
          mobileView === "list" ? "block" : "hidden md:block"
        )}
      >
        <Sidebar onOpenSettings={() => setActiveScreen("settings")} />
      </div>

      {/* Main Workspace Pane (Middle) */}
      <div
        className={cn(
          "flex h-full flex-1 flex-col md:flex min-w-0",
          mobileView === "chat" ? "flex" : "hidden md:flex"
        )}
      >
        {activeScreen === "chat" && <ChatPane />}
        {activeScreen === "profile" && <ProfileScreen onClose={() => setActiveScreen("chat")} />}
        {activeScreen === "settings" && <SettingsScreen onClose={() => setActiveScreen("chat")} />}
        {activeScreen === "devices" && <DevicesScreen onClose={() => setActiveScreen("chat")} />}
      </div>

      {/* Group Panel Details (Right) — sidebar on lg+, fullscreen overlay on mobile */}
      {panel === "details" && activeScreen === "chat" && (
        <>
          {/* Mobile: full-screen overlay */}
          <div className="lg:hidden absolute inset-0 z-40 flex flex-col" style={{ background: "#0e1621" }}>
            <GroupPanel />
          </div>
          {/* Desktop: sidebar panel */}
          <div className="hidden lg:block h-full border-l border-white/5">
            <GroupPanel />
          </div>
        </>
      )}

      {/* Dialog Modals */}
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
