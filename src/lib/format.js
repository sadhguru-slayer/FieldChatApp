import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

export function formatTime(ts) {
  if (!ts) return "";
  const date = new Date(ts);
  return format(date, "h:mm a");
}

export function formatListTime(ts) {
  if (!ts) return "";
  const date = new Date(ts);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
}

export function formatDayLabel(ts) {
  if (!ts) return "";
  const date = new Date(ts);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMMM d, yyyy");
}

export function formatRelative(ts) {
  if (!ts) return "recently";
  return formatDistanceToNow(new Date(ts), { addSuffix: true });
}

/**
 * Formats a Unix timestamp (seconds) into a "last seen X" string.
 * e.g. "last seen just now", "last seen 3 minutes ago",
 *      "last seen today at 9:41 AM", "last seen yesterday at 11:30 PM",
 *      "last seen Jan 15 at 2:00 PM"
 */
export function formatLastSeen(unixSeconds) {
  if (!unixSeconds) return null;
  const date = new Date(unixSeconds * 1000);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);

  if (diffSec < 60) return "last seen just now";
  if (diffMin < 60) return `last seen ${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  if (isToday(date)) return `last seen today at ${format(date, "h:mm a")}`;
  if (isYesterday(date)) return `last seen yesterday at ${format(date, "h:mm a")}`;
  return `last seen ${format(date, "MMM d")} at ${format(date, "h:mm a")}`;
}

export function passwordScore(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  return Math.min(s, 4);
}

export const SCORE_LABELS = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
