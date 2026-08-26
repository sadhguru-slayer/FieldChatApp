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
