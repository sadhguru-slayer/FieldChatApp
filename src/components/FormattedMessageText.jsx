import { memo, useMemo } from "react";

// ─── Regex Definitions ────────────────────────────────────────────────────────
// 1. URLs: http://, https://, or www.
const URL_REGEX = /(?:https?:\/\/|www\.)[^\s<>()]+(?:\([^\s<>()]+\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’])/gi;

// 2. IPv4 addresses with optional port: e.g. 192.168.1.1 or 127.0.0.1:8080
const IP_REGEX = /\b(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])(?::\d{1,5})?\b/g;

// 3. Phone numbers: international/national formats (+1 555-123-4567, +91 9876543210, (123) 456-7890, 123-456-7890, etc.)
// Minimum 7 digits, maximum 15 digits
const PHONE_REGEX = /(?:(?:\+?\d{1,4}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}(?:[-.\s]?\d{1,5})?|\+\d{9,15})\b/g;

/**
 * Tokenizes plain text into structured tokens: text, url, ip, phone.
 */
function tokenizeText(text) {
  if (!text) return [];

  // Match all potential entities with their start and end indices
  const entities = [];

  // 1. Find URLs
  let match;
  URL_REGEX.lastIndex = 0;
  while ((match = URL_REGEX.exec(text)) !== null) {
    const rawUrl = match[0];
    const index = match.index;
    entities.push({
      type: "url",
      start: index,
      end: index + rawUrl.length,
      text: rawUrl,
      href: rawUrl.startsWith("http://") || rawUrl.startsWith("https://") ? rawUrl : `https://${rawUrl}`,
    });
  }

  // 2. Find IPs (ignore if overlap with already matched URL)
  IP_REGEX.lastIndex = 0;
  while ((match = IP_REGEX.exec(text)) !== null) {
    const rawIp = match[0];
    const index = match.index;
    const end = index + rawIp.length;
    const overlaps = entities.some((e) => index < e.end && end > e.start);
    if (!overlaps) {
      entities.push({
        type: "ip",
        start: index,
        end: end,
        text: rawIp,
        href: `http://${rawIp}`,
      });
    }
  }

  // 3. Find Phone Numbers (ignore if overlaps or if it looks like a pure short number like year 2026 or small digit)
  PHONE_REGEX.lastIndex = 0;
  while ((match = PHONE_REGEX.exec(text)) !== null) {
    const rawPhone = match[0];
    const digitsOnly = rawPhone.replace(/\D/g, "");
    // Must be between 7 and 15 digits, and not just repeated identical single digits or pure years
    if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
      const index = match.index;
      const end = index + rawPhone.length;
      const overlaps = entities.some((e) => index < e.end && end > e.start);
      if (!overlaps) {
        entities.push({
          type: "phone",
          start: index,
          end: end,
          text: rawPhone,
          href: `tel:${rawPhone.replace(/\s+/g, "")}`,
        });
      }
    }
  }

  // Sort entities by start index
  entities.sort((a, b) => a.start - b.start);

  // Build token stream
  const tokens = [];
  let lastIndex = 0;

  for (const entity of entities) {
    if (entity.start > lastIndex) {
      tokens.push({
        type: "text",
        text: text.slice(lastIndex, entity.start),
      });
    }
    tokens.push(entity);
    lastIndex = entity.end;
  }

  if (lastIndex < text.length) {
    tokens.push({
      type: "text",
      text: text.slice(lastIndex),
    });
  }

  return tokens;
}

function FormattedMessageTextBase({ text, mine }) {
  const tokens = useMemo(() => tokenizeText(text), [text]);

  if (!text) return null;

  return (
    <span className="break-words whitespace-pre-wrap select-text">
      {tokens.map((token, i) => {
        if (token.type === "url") {
          return (
            <a
              key={i}
              href={token.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={
                mine
                  ? "font-medium underline underline-offset-3 decoration-white/60 hover:decoration-white hover:text-white/90 transition-all cursor-pointer"
                  : "font-medium text-accent hover:text-accent/80 underline underline-offset-3 decoration-accent/60 hover:decoration-accent transition-all cursor-pointer"
              }
              title={token.href}
            >
              {token.text}
            </a>
          );
        }

        if (token.type === "ip") {
          return (
            <a
              key={i}
              href={token.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={
                mine
                  ? "inline-block px-1.5 py-0.5 rounded-md bg-black/25 font-mono text-[11.5px] font-medium tracking-tight underline underline-offset-2 decoration-white/40 hover:bg-black/40 transition-all cursor-pointer"
                  : "inline-block px-1.5 py-0.5 rounded-md bg-accent/15 text-accent font-mono text-[11.5px] font-medium tracking-tight underline underline-offset-2 decoration-accent/40 hover:bg-accent/25 transition-all cursor-pointer"
              }
              title={`Open IP: ${token.href}`}
            >
              {token.text}
            </a>
          );
        }

        if (token.type === "phone") {
          return (
            <a
              key={i}
              href={token.href}
              onClick={(e) => e.stopPropagation()}
              className={
                mine
                  ? "font-medium underline underline-offset-3 decoration-white/60 hover:decoration-white hover:text-white/90 transition-all cursor-pointer tabular-nums"
                  : "font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-3 decoration-emerald-500/60 hover:decoration-emerald-400 transition-all cursor-pointer tabular-nums"
              }
              title={`Call: ${token.text}`}
            >
              {token.text}
            </a>
          );
        }

        return <span key={i}>{token.text}</span>;
      })}
    </span>
  );
}

export const FormattedMessageText = memo(FormattedMessageTextBase);
