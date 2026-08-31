import { request } from "./request";

export const getMyUserId = () => {

  try {
    const token = localStorage.getItem("access_token");
    if (!token) return null;
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const parsed = JSON.parse(jsonPayload);
    return parsed.sub || null;
  } catch {
    return null;
  }
};

// GET /api/users/me/profile
export const getMe = async () => {
  const userId = getMyUserId();
  try {
    const profile = await request("/api/users/me/profile");
    return {
      id: userId || profile.user_id || "me",
      userId: userId || profile.user_id,
      name: profile.display_name || "You",
      username:
        profile.display_name?.toLowerCase().replace(/\s+/g, "") || "user",
      email: profile.email || "",
      bio: profile.bio || "",
      avatar:
        profile.avatar_url ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
          profile.display_name || "User"
        )}`,
      customStatus: profile.custom_status || "",
    };
  } catch {
    return {
      id: userId || "me",
      userId: userId,
      name: "Current User",
      username: "user",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=User",
      bio: "",
    };
  }
};

// GET /api/users/{user_id}/profile
export const getUserProfile = async (userId) => {
  try {
    const profile = await request(`/api/users/${userId}/profile`);
    return {
      id: profile.user_id,
      userId: profile.user_id,
      name: profile.display_name || "User",
      username: profile.username || profile.display_name?.toLowerCase().replace(/\s+/g, "") || "user",
      email: profile.email || "",
      bio: profile.bio || "",
      avatar:
        profile.avatar_url ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
          profile.display_name || "User"
        )}`,
      customStatus: profile.custom_status || "",
    };
  } catch (err) {
    throw err;
  }
};


// PATCH /api/users/me/profile
export const updateMe = async (patch) =>
  request("/api/users/me/profile", {
    method: "PATCH",
    body: JSON.stringify({
      display_name: patch.name || patch.display_name,
      bio: patch.bio,
      avatar_url: patch.avatar,
      custom_status: patch.customStatus,
      date_of_birth: patch.dateOfBirth,
    }),
  });

// GET /api/users/me/settings
export const getSettings = async () => {
  try {
    return await request("/api/users/me/settings");
  } catch {
    return {
      theme: "dark",
      language: "en",
      notifications_enabled: true,
      message_notifications: true,
      mention_notifications: true,
      sound_enabled: true,
      profile_visibility: "public",
      avatar_visibility: "public",
      last_seen_visibility: "public",
      read_receipts_enabled: true,
      enter_to_send: true,
      media_auto_download: true,
    };
  }
};

// PATCH /api/users/me/settings
export const updateSettings = async (patch) =>
  request("/api/users/me/settings", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });

// GET /api/tokens/user_refresh_tokens/{user_id}
// GET /api/tokens/me (uses Bearer access_token)
export const getUserTokens = async (userId) => {
  try {
    return await request("/api/tokens/me");
  } catch {
    if (userId) {
      return await request(`/api/tokens/user_refresh_tokens/${userId}`);
    }
    return [];
  }
};

// POST /api/tokens/revoke_refresh_token/{token}
export const revokeToken = async (token) => {
  return request(`/api/tokens/revoke_refresh_token/${token}`, {
    method: "POST",
  });
};

// DELETE /api/tokens/me/{token_id}
export const deleteToken = async (tokenId) => {
  try {
    return await request(`/api/tokens/me/${tokenId}`, { method: "DELETE" });
  } catch {
    return request(`/api/tokens/delete_refresh_token/${tokenId}`, { method: "DELETE" });
  }
};

// POST /api/tokens/me/revoke-all
export const revokeAllUserTokens = async (userId) => {
  try {
    return await request("/api/tokens/me/revoke-all", { method: "POST" });
  } catch {
    if (userId) {
      return request(`/api/tokens/revoke_user_refresh_tokens/${userId}`, { method: "POST" });
    }
  }
};


// GET /api/auth/users/get_users
export const getUsers = async (q = "", limit = 20, offset = 0) => {
  try {
    const params = new URLSearchParams();
    if (q) params.set("q", q.trim());
    if (limit) params.set("limit", limit);
    if (offset) params.set("offset", offset);
    const queryString = params.toString();

    const users = await request(`/api/auth/users/get_users${queryString ? `?${queryString}` : ""}`);
    return users.map((u) => ({
      id: String(u.id),
      name: u.username,
      username: u.username,
      email: u.email,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
        u.username
      )}`,
      online: u.is_active,
    }));
  } catch {
    return [];
  }
};

// GET /api/chat/search?q=
export const search = async (query) => {
  const q = (query || "").trim();
  if (!q) return { people: [], groups: [], messages: [] };
  
  try {
    const res = await request(`/api/chat/search?q=${encodeURIComponent(q)}`);
    return {
      people: (res.users || []).map((u) => ({
        id: String(u.id),
        name: u.username,
        username: u.username,
        email: u.email,
        avatar: u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.username)}`,
      })),
      groups: (res.groups || []).map((g) => ({
        id: String(g.id),
        name: g.name,
        description: g.description,
        avatar: g.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(g.name || g.id)}`,
        type: "group",
      })),
      messages: [],
    };
  } catch (err) {
    console.error("Search failed:", err);
    return { people: [], groups: [], messages: [] };
  }
};

