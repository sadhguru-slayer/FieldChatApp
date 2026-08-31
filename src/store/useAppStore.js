import { create } from "zustand";

const readTheme = () => {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem("chat.theme") || "dark";
};

export const useAppStore = create((set, get) => ({
  // auth session
  authed: false,
  hydrated: false,
  
  hydrate: () => {
    if (typeof window === "undefined") return;
    const theme = readTheme();
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme !== "light");
    const token = localStorage.getItem("access_token");
    set({
      authed: !!token,
      theme,
      hydrated: true,
    });
  },

  signIn: (tokens) => {
    if (tokens?.access_token) {
      localStorage.setItem("access_token", tokens.access_token);
    }
    if (tokens?.refresh_token) {
      localStorage.setItem("refresh_token", tokens.refresh_token);
    }
    set({ authed: true });
  },

  signOut: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ authed: false, activeId: null, panel: null });
  },

  // theme
  theme: "dark",
  setTheme: (theme) => {
    localStorage.setItem("chat.theme", theme);
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme !== "light");
    set({ theme });
  },

  // chat ui state
  activeId: null,
  setActiveId: (activeId) => set({ activeId, reply: null, editing: null, panel: null }),

  filter: "all",
  setFilter: (filter) => set({ filter }),

  reply: null,
  setReply: (reply) => set({ reply, editing: null }),

  editing: null,
  setEditing: (editing) => set({ editing, reply: null }),

  // right panel: null | 'details' | 'profile'
  panel: null,
  togglePanel: (panel) => set({ panel: get().panel === panel ? null : panel }),
  closePanel: () => set({ panel: null }),

  // mobile pane navigation
  mobileView: "list",
  setMobileView: (mobileView) => set({ mobileView }),

  // navigation screens: 'chat' | 'profile' | 'settings' | 'devices'
  activeScreen: "chat",
  setActiveScreen: (activeScreen) =>
    set((state) => ({
      activeScreen,
      // Going to a secondary screen → show the screen (chat pane area)
      // Going back to "chat" → always return to the conversation list on mobile
      mobileView: activeScreen !== "chat" ? "chat" : "list",
    })),

  // dialogs & sheets
  searchOpen: false,
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  createGroupOpen: false,
  setCreateGroupOpen: (createGroupOpen) => set({ createGroupOpen }),
  createDmOpen: false,
  setCreateDmOpen: (createDmOpen) => set({ createDmOpen }),
  forwardFor: null,
  setForwardFor: (forwardFor) => set({ forwardFor }),

  // hamburger menu drawer (desktop)
  menuOpen: false,
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  toggleMenu: () => set((s) => ({ menuOpen: !s.menuOpen })),

  // global user profile modal
  profileModalUserId: null,
  setProfileModalUserId: (userId) => set({ profileModalUserId: userId }),

  // mobile bottom tab: 'chats' | 'settings' | 'profile'
  mobileTab: "chats",
  setMobileTab: (mobileTab) => set({ mobileTab }),

  // add member modal trigger
  groupAddMemberOpen: false,
  setGroupAddMemberOpen: (groupAddMemberOpen) => set({ groupAddMemberOpen }),

  // real-time presence { [userId]: { online: boolean, lastSeen: number|null } }
  presence: {},
  setPresence: (userId, online, lastSeen = null) =>
    set((state) => ({
      presence: {
        ...state.presence,
        [String(userId)]: {
          online: Boolean(online),
          lastSeen: online ? null : (lastSeen ?? state.presence[String(userId)]?.lastSeen ?? null),
        },
      },
    })),

  // real-time typing indicators { [convId]: { [userId]: { username, timestamp } } }
  typingUsers: {},
  setTypingUser: (conversationId, userId, username) => {
    const now = Date.now();
    set((state) => {
      const convTyping = state.typingUsers[conversationId] || {};
      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: {
            ...convTyping,
            [userId]: { username, timestamp: now },
          },
        },
      };
    });
  },
  clearExpiredTypingUsers: () => {
    const now = Date.now();
    const current = get().typingUsers;
    let changed = false;
    const next = {};

    for (const [convId, users] of Object.entries(current)) {
      const validUsers = {};
      for (const [uid, info] of Object.entries(users)) {
        if (now - info.timestamp < 3000) {
          validUsers[uid] = info;
        } else {
          changed = true;
        }
      }
      if (Object.keys(validUsers).length > 0) {
        next[convId] = validUsers;
      } else if (Object.keys(users).length > 0) {
        changed = true;
      }
    }

    if (changed) {
      set({ typingUsers: next });
    }
  },
}));

