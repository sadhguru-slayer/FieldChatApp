import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getFullMediaUrl(url) {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  const cleanPath = url.startsWith("/") ? url : `/${url}`;

  // 1. Storage URL override (e.g. MinIO / S3 / CDN endpoint)
  const storageUrl = import.meta.env.VITE_STORAGE_URL;
  if (storageUrl) {
    return `${storageUrl.replace(/\/$/, "")}${cleanPath}`;
  }

  // 2. Backend API URL
  const apiUrl = import.meta.env.BACKEND_API_URL || import.meta.env.VITE_API_URL;
  if (apiUrl) {
    const cleanApi = apiUrl.replace(/\/$/, "");
    // If backend is on host like fieldchat-backend.sadguruchenu.in or http://localhost:8000
    return `${cleanApi}${cleanPath}`;
  }

  // 3. Fallback for local dev browser environment
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    // Local Docker MinIO runs on port 9000
    return `${protocol}//${hostname}:9000${cleanPath}`;
  }

  return `http://localhost:9000${cleanPath}`;
}
