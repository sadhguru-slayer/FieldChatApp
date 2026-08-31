// Base request helper — shared across all API modules

function normalizeApiUrl(url) {
  if (!url) return "http://localhost:8000";
  // If no protocol prefix, assume http://
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `http://${url}`;
  }
  return url;
}

const API_URL = normalizeApiUrl(
  import.meta.env.BACKEND_API_URL || import.meta.env.VITE_API_URL
);

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

export function getDeviceId() {
  if (typeof window === "undefined") return "server";
  let deviceId = localStorage.getItem("fieldchat_device_id");
  if (!deviceId) {
    deviceId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "dev_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem("fieldchat_device_id", deviceId);
  }
  return deviceId;
}

export async function request(path, options = {}) {
  // Ensure WebSocket is connected on any API request
  if (typeof window !== "undefined" && localStorage.getItem("access_token")) {
    import("../ws/client")
      .then(({ wsClient }) => {
        if (wsClient) {
          wsClient.ensureConnected();
        }
      })
      .catch((err) => {
        console.warn("[Request] Failed to check/reconnect WS:", err);
      });
  }

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const isFormData =
    options.body instanceof URLSearchParams ||
    (typeof FormData !== "undefined" && options.body instanceof FormData);

  const headers = {
    ...(options.body && !isFormData ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "X-Device-ID": getDeviceId(),
    ...options.headers,
  };

  let response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized for access token expiration
  if (response.status === 401 && !options._retry) {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(
            `${API_URL}/api/tokens/refresh_token?token=${encodeURIComponent(
              refreshToken
            )}`,
            { method: "POST" }
          );

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            localStorage.setItem("access_token", data.access_token);
            onRefreshed(data.access_token);
          } else {
            throw new Error("Refresh failed");
          }
        } catch (err) {
          // If refresh fails, log out the user
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.reload();
          throw err;
        } finally {
          isRefreshing = false;
        }
      }

      // Wait for refresh to complete and retry the request
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${newToken}`,
          };
          options._retry = true;
          resolve(request(path, options));
        });
      });
    } else {
      // No refresh token, force logout
      localStorage.removeItem("access_token");
      window.location.reload();
    }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail =
      typeof body?.detail === "string"
        ? body.detail
        : Array.isArray(body?.detail)
          ? body.detail[0]?.msg
          : null;
    throw new Error(detail || `Request failed (${response.status})`);
  }

  return response.json();
}

export async function ensureValidAccessToken() {
  const token = localStorage.getItem("access_token");
  if (!token) return null;

  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return token;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const parsed = JSON.parse(atob(base64));
    const exp = parsed.exp;
    
    // If token is expired or expiring in less than 30 seconds, refresh it proactively
    if (exp && Date.now() / 1000 >= exp - 30) {
      console.log("[Auth] Token is expired or expiring soon. Refreshing proactively...");
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        const refreshRes = await fetch(
          `${API_URL}/api/tokens/refresh_token?token=${encodeURIComponent(refreshToken)}`,
          { method: "POST" }
        );
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          localStorage.setItem("access_token", data.access_token);
          console.log("[Auth] Token refreshed successfully before connection.");
          return data.access_token;
        } else {
          console.warn("[Auth] Proactive token refresh failed.");
        }
      }
    }
  } catch (e) {
    console.warn("[Auth] Error checking token expiration status:", e);
  }

  return token;
}
