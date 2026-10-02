import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  File,
  Film,
  Globe,
  Image as ImageIcon,
  Paperclip,
  Play,
  Search,
  X,
} from "lucide-react";
import { getMessages } from "@/services/api";
import { cn, getFullMediaUrl } from "@/lib/utils";
import { formatListTime } from "@/lib/format";

// Extract all URLs from a text string
const URL_REGEX = /(?:https?:\/\/|www\.)[^\s<>()]+(?:\([^\s<>()]+\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’])/gi;

function extractUrlsFromText(text) {
  if (!text) return [];
  const urls = [];
  let match;
  URL_REGEX.lastIndex = 0;
  while ((match = URL_REGEX.exec(text)) !== null) {
    const raw = match[0];
    const href = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
    let domain = "";
    try {
      domain = new URL(href).hostname.replace(/^www\./, "");
    } catch {
      domain = raw;
    }
    urls.push({ raw, href, domain });
  }
  return urls;
}

export function MediaLinksDocsView({
  conversationId,
  title = "Media, Links & Docs",
  initialTab = "media",
  onClose,
  onMediaClick,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: msgData, isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => getMessages({ conversationId }),
    enabled: !!conversationId,
  });

  const allMessages = useMemo(() => {
    return msgData?.items || [];
  }, [msgData]);

  // 1. Media (Images and Videos)
  const mediaItems = useMemo(() => {
    return allMessages
      .filter((m) => {
        if (!m.mediaUrl || m.deletedForEveryone) return false;
        const name = (m.mediaName || m.mediaUrl || "").toLowerCase();
        return /\.(jpeg|jpg|gif|png|webp|svg|mp4|webm|ogg|mov|m4v)$/i.test(name);
      })
      .map((m) => {
        const isVideo = /\.(mp4|webm|ogg|mov|m4v)$/i.test(m.mediaName || m.mediaUrl || "");
        return {
          id: m.id,
          url: getFullMediaUrl(m.mediaUrl),
          rawUrl: m.mediaUrl,
          name: m.mediaName || (isVideo ? "Video" : "Image"),
          isVideo,
          createdAt: m.createdAt,
          senderName: m.senderName || "User",
          message: m,
        };
      });
  }, [allMessages]);

  // 2. Docs (PDFs, ZIPs, DOCX, TXT, etc.)
  const docItems = useMemo(() => {
    return allMessages
      .filter((m) => {
        if (!m.mediaUrl || m.deletedForEveryone) return false;
        const name = (m.mediaName || m.mediaUrl || "").toLowerCase();
        return !/\.(jpeg|jpg|gif|png|webp|svg|mp4|webm|ogg|mov|m4v)$/i.test(name);
      })
      .map((m) => {
        const isPdf = /\.pdf$/i.test(m.mediaName || m.mediaUrl || "");
        return {
          id: m.id,
          url: getFullMediaUrl(m.mediaUrl),
          rawUrl: m.mediaUrl,
          name: m.mediaName || "Document",
          isPdf,
          createdAt: m.createdAt,
          senderName: m.senderName || "User",
        };
      });
  }, [allMessages]);

  // 3. Links
  const linkItems = useMemo(() => {
    const items = [];
    for (const m of allMessages) {
      if (!m.text || m.deletedForEveryone) continue;
      const urls = extractUrlsFromText(m.text);
      for (const u of urls) {
        items.push({
          id: `${m.id}-${u.raw}`,
          messageId: m.id,
          url: u.href,
          rawUrl: u.raw,
          domain: u.domain,
          fullText: m.text,
          createdAt: m.createdAt,
          senderName: m.senderName || "User",
        });
      }
    }
    return items;
  }, [allMessages]);

  // Filtered lists based on search
  const filteredMedia = useMemo(() => {
    if (!searchQuery.trim()) return mediaItems;
    const q = searchQuery.toLowerCase();
    return mediaItems.filter((item) => item.name.toLowerCase().includes(q));
  }, [mediaItems, searchQuery]);

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return docItems;
    const q = searchQuery.toLowerCase();
    return docItems.filter((item) => item.name.toLowerCase().includes(q));
  }, [docItems, searchQuery]);

  const filteredLinks = useMemo(() => {
    if (!searchQuery.trim()) return linkItems;
    const q = searchQuery.toLowerCase();
    return linkItems.filter(
      (item) => item.url.toLowerCase().includes(q) || item.domain.toLowerCase().includes(q) || item.fullText.toLowerCase().includes(q)
    );
  }, [linkItems, searchQuery]);

  const tabs = [
    { id: "media", label: "Media", count: mediaItems.length, icon: ImageIcon },
    { id: "docs", label: "Docs", count: docItems.length, icon: FileText },
    { id: "links", label: "Links", count: linkItems.length, icon: Globe },
  ];

  const handleDownload = (e, url, name) => {
    e.stopPropagation();
    const a = document.createElement("a");
    a.href = url;
    a.download = name || "download";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground select-none overflow-hidden">
      {/* ── Top Header ──────────────────────────────────────────────── */}
      <div className="flex h-14 items-center justify-between border-b border-border/30 px-3 bg-surface/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="grid size-9 place-items-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-elevated transition-colors mr-0.5 shrink-0 no-tap-highlight cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="size-4.5" />
            </button>
          )}
          <h2 className="truncate text-sm font-semibold text-foreground tracking-tight">
            {title}
          </h2>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-elevated hover:text-foreground transition-colors no-tap-highlight cursor-pointer"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* ── Tabs Selector ────────────────────────────────────────────── */}
      <div className="px-3 pt-2.5 pb-2 shrink-0 border-b border-border/20 bg-surface/40">
        <div className="flex gap-1 rounded-xl bg-surface/80 p-1 border border-border/40">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer no-tap-highlight",
                  isActive
                    ? "bg-elevated text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-elevated/40"
                )}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                      isActive ? "bg-accent/20 text-accent font-bold" : "bg-elevated/70 text-muted-foreground"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search input (if there are items) */}
        {(activeTab === "media" ? mediaItems.length > 4 : activeTab === "docs" ? docItems.length > 2 : linkItems.length > 2) && (
          <div className="mt-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="h-8 w-full rounded-xl bg-surface/80 border border-border/40 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50"
            />
          </div>
        )}
      </div>

      {/* ── Scrollable Tab Content ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto scroll-slim p-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-xs text-muted-foreground">
            Loading shared items...
          </div>
        ) : (
          <>
            {/* ── TAB 1: MEDIA (Grid of Photos & Videos) ── */}
            {activeTab === "media" && (
              <>
                {filteredMedia.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center gap-2 text-muted-foreground">
                    <div className="grid size-12 place-items-center rounded-2xl bg-surface/50 border border-border/30 text-muted-foreground/60">
                      <ImageIcon className="size-6" />
                    </div>
                    <p className="text-xs font-semibold text-foreground/80">No shared media</p>
                    <p className="text-[11px]">Photos and videos shared in this chat will appear here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {filteredMedia.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (onMediaClick) onMediaClick(item.message);
                          else window.open(item.url, "_blank");
                        }}
                        className="group relative aspect-square overflow-hidden rounded-xl bg-surface border border-border/30 cursor-pointer transition-transform hover:scale-[1.02] active:scale-98"
                      >
                        {item.isVideo ? (
                          <div className="relative size-full bg-black/40 flex items-center justify-center">
                            <video
                              src={item.url}
                              className="size-full object-cover"
                              muted
                              preload="metadata"
                            />
                            <div className="absolute inset-0 grid place-items-center bg-black/30 group-hover:bg-black/40 transition-colors">
                              <span className="grid size-8 place-items-center rounded-full bg-black/60 text-white border border-white/20 shadow-md">
                                <Play className="size-3.5 fill-white ml-0.5" />
                              </span>
                            </div>
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white/90">
                              Video
                            </span>
                          </div>
                        ) : (
                          <img
                            src={item.url}
                            alt={item.name}
                            loading="lazy"
                            className="size-full object-cover transition-opacity group-hover:opacity-90"
                          />
                        )}
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                          <p className="text-[10px] text-white font-medium truncate">
                            {formatListTime(item.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── TAB 2: DOCS (PDFs and Document Files) ── */}
            {activeTab === "docs" && (
              <>
                {filteredDocs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center gap-2 text-muted-foreground">
                    <div className="grid size-12 place-items-center rounded-2xl bg-surface/50 border border-border/30 text-muted-foreground/60">
                      <FileText className="size-6" />
                    </div>
                    <p className="text-xs font-semibold text-foreground/80">No shared documents</p>
                    <p className="text-[11px]">PDFs, files, and documents sent in this chat will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filteredDocs.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={(e) => handleDownload(e, doc.url, doc.name)}
                        className="group flex items-center justify-between p-2.5 rounded-2xl border border-border/40 bg-surface/50 hover:bg-elevated/70 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                          {doc.isPdf ? (
                            <div className="relative grid size-10 place-items-center rounded-xl bg-red-500/15 border border-red-500/25 shrink-0 text-red-500">
                              <FileText className="size-5" />
                              <span className="absolute -bottom-1 -right-1 px-1 py-[1px] rounded bg-red-600 text-[8px] font-extrabold uppercase text-white tracking-tighter leading-none shadow-xs">
                                PDF
                              </span>
                            </div>
                          ) : (
                            <div className="grid size-10 place-items-center rounded-xl bg-accent/10 border border-accent/20 shrink-0 text-accent">
                              <Paperclip className="size-4.5" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                              {doc.name}
                            </p>
                            <p className="text-[10.5px] text-muted-foreground mt-0.5 flex items-center gap-1.5 font-medium">
                              <span>{doc.senderName}</span>
                              <span>•</span>
                              <span>{formatListTime(doc.createdAt)}</span>
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleDownload(e, doc.url, doc.name)}
                          className="grid size-8 place-items-center rounded-xl bg-elevated hover:bg-accent hover:text-white border border-border/40 text-muted-foreground transition-all shrink-0 cursor-pointer"
                          title="Download document"
                        >
                          <Download className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── TAB 3: LINKS (Shared URLs) ── */}
            {activeTab === "links" && (
              <>
                {filteredLinks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center gap-2 text-muted-foreground">
                    <div className="grid size-12 place-items-center rounded-2xl bg-surface/50 border border-border/30 text-muted-foreground/60">
                      <Globe className="size-6" />
                    </div>
                    <p className="text-xs font-semibold text-foreground/80">No shared links</p>
                    <p className="text-[11px]">Links and URLs shared in this chat will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filteredLinks.map((item) => (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between p-3 rounded-2xl border border-border/40 bg-surface/50 hover:bg-elevated/70 transition-all cursor-pointer select-text"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                          <div className="grid size-10 place-items-center rounded-xl bg-blue-500/10 border border-blue-500/20 shrink-0 text-blue-400 group-hover:scale-105 transition-transform">
                            <Globe className="size-4.5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-foreground truncate group-hover:text-accent transition-colors">
                              {item.domain}
                            </p>
                            <p className="text-[11px] text-accent/90 truncate font-mono mt-0.5 underline underline-offset-2 decoration-accent/40">
                              {item.url}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1.5">
                              <span>{item.senderName}</span>
                              <span>•</span>
                              <span>{formatListTime(item.createdAt)}</span>
                            </p>
                          </div>
                        </div>

                        <div className="grid size-8 place-items-center rounded-xl bg-elevated text-muted-foreground group-hover:text-foreground border border-border/40 shrink-0">
                          <ExternalLink className="size-3.5" />
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
