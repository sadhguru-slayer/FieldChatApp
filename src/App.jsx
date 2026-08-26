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
  const setActiveScreen = useAppStore((s) => s.setActiveScreen);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

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
    <div className="flex h-screen w-screen overflow-hidden font-sans antialiased" style={{ background: "#0e1621" }}>
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

      {/* Group Panel Details (Right) */}
      {panel === "details" && activeScreen === "chat" && (
        <div className="hidden lg:block h-full border-l border-white/5">
          <GroupPanel />
        </div>
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
        position="top-center"
        richColors
        toastOptions={{
          style: { background: "#1c2633", border: "1px solid rgba(255,255,255,0.08)", color: "#e3e3e3" },
        }}
      />
    </QueryClientProvider>
  );
}
