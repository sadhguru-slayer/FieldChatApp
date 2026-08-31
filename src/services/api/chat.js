import { request } from "./request";

// ─── Normalizers ──────────────────────────────────────────────────────────────

function normalizeConversation(c, defaultType) {
  const latest = c.latest_message;
  const updatedAt = latest?.timestamp
    ? new Date(latest.timestamp).getTime()
    : c.created_at
    ? new Date(c.created_at).getTime()
    : 0;
  const isGroup = c.type === "group" || defaultType === "group";

  return {
    id: String(c.id),
    type: isGroup ? "group" : "dm",
    title: c.title || c.display_name || c.name || "Conversation",
    avatar:
      c.avatar_url ||
      `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
        c.title || c.name || c.id
      )}`,
    role: c.role || "MEMBER",
    unread: Number(c.unread_count ?? 0),
    updatedAt,
    // For DMs: the other participant's user ID (needed for presence lookup)
    otherUserId: isGroup ? null : (c.other_user_id ? String(c.other_user_id) : null),
    // Initial online snapshot from Redis (WS events override this reactively)
    isOnline: isGroup ? false : Boolean(c.is_online),
    // Last seen Unix timestamp in seconds (null if never seen offline)
    lastSeen: isGroup ? null : (c.last_seen ? Number(c.last_seen) : null),
    // Group member count from backend (null for DMs)
    memberCount: isGroup ? (c.member_count ?? null) : null,
    lastMessage: latest
      ? {
          id: String(latest.id || ""),
          senderId: latest.sender_id ? String(latest.sender_id) : null,
          senderName:
          latest.sender === "You"
            ? "You"
            : latest.display_name ||
              latest.sender ||
              latest.username ||
              null,
          text: latest.content || latest.message || "",
          createdAt: latest.timestamp,
          deletedForEveryone: !!latest.is_deleted_for_everyone,
          mediaUrl: latest.media_url || null,
          mediaName: latest.media_name || null,
        }
      : null,
  };

}

// ─── Fetch ────────────────────────────────────────────────────────────────────

/** GET /api/chat/get-user-groups + /api/chat/get-user-dms, merged and sorted */
export const getConversations = async () => {
  let groups = [];
  let dms = [];
  try {
    groups = await request("/api/chat/get-user-groups");
  } catch (e) {
    console.warn("Failed to fetch groups", e);
  }
  try {
    dms = await request("/api/chat/get-user-dms");
  } catch (e) {
    console.warn("Failed to fetch DMs", e);
  }
  return [
    ...(groups || []).map((c) => normalizeConversation(c, "group")),
    ...(dms || []).map((c) => normalizeConversation(c, "dm")),
  ].sort((a, b) => b.updatedAt - a.updatedAt);
};

export const getGroupMembers = async (groupId) => {
  try {
    const res = await request(`/api/chat/get-group-members?group_id=${groupId}`);
    return res.map((m) => ({
      id: String(m.id),
      name: m.display_name || m.username,
      username: m.username,
      email: m.email,
      role: m.role || "MEMBER",
      joinedAt: m.joined_at,
      avatar:
        m.avatar_url ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.username)}`,
    }));
  } catch (err) {
    console.error("Failed to fetch group members", err);
    return [];
  }
};

// ─── Mutations ────────────────────────────────────────────────────────────────

/** POST /api/chat/create-coversation */
export const createGroup = async ({ name, description, memberIds = [] }) => {
  const data = await request("/api/chat/create-coversation", {
    method: "POST",
    body: JSON.stringify({ conversation_name: name, participants: memberIds }),
  });
  const conversationId = String(data.conversation_id);
  if (description) {
    try {
      await updateGroup({ conversationId, patch: { description } });
    } catch {}
  }
  return { id: conversationId, type: "group", title: name };
};

/** POST /api/chat/create-dm */
export const createDm = async (targetId) => {
  try {
    return await request(`/api/chat/create-dm?target_id=${targetId}`, {
      method: "POST",
    });
  } catch {
    return await request(`/api/chatcreate-dm?target_id=${targetId}`, {
      method: "POST",
    });
  }
};

/** PATCH /api/chat/conversation/:id */
export const updateGroup = async ({ conversationId, patch }) =>
  request(`/api/chat/conversation/${conversationId}`, {
    method: "PATCH",
    body: JSON.stringify({
      name: patch.name,
      description: patch.description,
      avatar_url: patch.avatar_url,
    }),
  });

/** POST /api/chat/add-member */
export const addMembers = async ({ conversationId, userIds = [] }) =>
  request(`/api/chat/add-member?group_id=${conversationId}`, {
    method: "POST",
    body: JSON.stringify(userIds),
  });

/** POST /api/chat/remove-member */
export const removeMember = async ({ conversationId, userId }) =>
  request(
    `/api/chat/remove-member?group_id=${conversationId}&target_id=${userId}`,
    { method: "POST" }
  );

/** POST /api/chat/leave-group */
export const leaveGroup = async ({ conversationId }) =>
  request(`/api/chat/leave-group?group_id=${conversationId}`, {
    method: "POST",
  });

/** DELETE /api/chat/delete-group */
export const deleteGroup = async ({ conversationId }) =>
  request(`/api/chat/delete-group?group_id=${conversationId}`, {
    method: "DELETE",
  });
