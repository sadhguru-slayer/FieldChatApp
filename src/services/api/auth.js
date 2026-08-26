import { request } from "./request";

// POST /api/auth/login  (OAuth2 form body)
export const loginWithPassword = async ({ email, password }) => {
  const body = new URLSearchParams({ username: email, password });
  const data = await request("/api/auth/login", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  if (data.access_token) localStorage.setItem("access_token", data.access_token);
  if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
  return data;
};

// POST /api/auth/register
export const registerUser = async ({ email, password }) =>
  request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
