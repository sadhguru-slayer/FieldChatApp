import { useEffect, useRef, useState, useMemo } from "react";
import { Paperclip, SendHorizonal, Smile, Loader2, X, Globe, FileText, Image as ImageIcon } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { uploadFileWithProgress } from "@/services/api/attachments";
import { getLinkPreview } from "@/services/api";
import { sendTyping } from "@/services/ws";
import { FilePreviewModal, getFileCategory } from "./FilePreviewModal";
import { extractFirstUrl } from "@/components/LinkPreview";

const EMOJIS = [
  "😀","😂","🙌","🔥","❤️","👍","🎉","😅","🤔","🙏","✅","👀","😎","🤝","💯","😊",
];

const MAX_FILE_COUNT = 10;
const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
};

// ─── Composer URL Preview Bar ───────────────────────────────────────────────
function ComposerUrlPreview({ url, onDismiss }) {
  const { data: preview, isLoading } = useQuery({
    queryKey: ["link-preview", url],
    queryFn: () => getLinkPreview(url),
    enabled: !!url,
    staleTime: 1000 * 60 * 60 * 24,
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (!url || isLoading || !preview || !preview.success) return null;
  if (!preview.title && !preview.description && !preview.image) return null;

  return (
    <div className="mb-2 relative flex items-center gap-2.5 rounded-xl border border-border/50 bg-elevated/80 p-2 shadow-xs fc-slide-up-sm select-none">
      {preview.image && (
        <img
          src={preview.image}
          alt=""
          className="size-12 rounded-lg object-cover border border-border/50 shrink-0 bg-black/40"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
      <div className="min-w-0 flex-1 pr-6">
        <p className="text-xs font-semibold text-foreground truncate leading-tight">
          {preview.title || url}
        </p>
        {preview.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 leading-snug">
            {preview.description}
          </p>
        )}
        <div className="mt-1 flex items-center gap-1 text-[10px] text-accent font-mono truncate">
          <Globe className="size-2.5 shrink-0" />
          <span className="truncate">{preview.domain || url}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss link preview"
        className="absolute top-2 right-2 grid size-5 place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

// ─── Composer Main Component ────────────────────────────────────────────────
export function Composer({ onSend, onEdit }) {
  const queryClient = useQueryClient();
  const activeId = useAppStore((s) => s.activeId);
  const reply = useAppStore((s) => s.reply);
  const setReply = useAppStore((s) => s.setReply);
  const editing = useAppStore((s) => s.editing);
  const setEditing = useAppStore((s) => s.setEditing);

  const [text, setText] = useState("");
  const [caption, setCaption] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [dismissedUrls, setDismissedUrls] = useState(new Set());
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const ref = useRef(null);
  const fileInputRef = useRef(null);
  const lastTypingTimeRef = useRef(0);
  const isSubmittingRef = useRef(false);

  const [selectedFiles, setSelectedFiles] = useState([]);

  // Detect first URL in input text
  const detectedUrl = useMemo(() => {
    const url = extractFirstUrl(text);
    if (!url || dismissedUrls.has(url)) return null;
    return url;
  }, [text, dismissedUrls]);

  const processIncomingFiles = (incomingFiles) => {
    if (!incomingFiles || !incomingFiles.length) return;

    if (selectedFiles.length + incomingFiles.length > MAX_FILE_COUNT) {
      toast.error(`You can select a maximum of ${MAX_FILE_COUNT} files at a time.`);
      return;
    }

    const newFiles = [];
    for (const file of incomingFiles) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File "${file.name}" exceeds the 200MB size limit.`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);

      newFiles.push({
        id: Math.random().toString(36).substring(7),
        file,
        previewUrl,
        name: file.name,
        size: file.size,
        progress: 0,
        status: "idle",
      });
    }

    if (newFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      setPreviewModalOpen(true);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;

    processIncomingFiles(files);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddFiles = (moreFiles) => {
    processIncomingFiles(moreFiles);
  };

  const removeSelectedFile = (id) => {
    const item = selectedFiles.find((f) => f.id === id);
    if (item && item.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }
    setSelectedFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (next.length === 0) {
        setPreviewModalOpen(false);
      }
      return next;
    });
  };

  const clearAllSelectedFiles = () => {
    selectedFiles.forEach((f) => {
      if (f.previewUrl) {
        URL.revokeObjectURL(f.previewUrl);
      }
    });
    setSelectedFiles([]);
    setPreviewModalOpen(false);
    setCaption("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    return () => {
      // Clean up previews ONLY on unmount
      selectedFiles.forEach((f) => {
        if (f.previewUrl) {
          URL.revokeObjectURL(f.previewUrl);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    setText(e.target.value);
    if (activeId) {
      const now = Date.now();
      if (now - lastTypingTimeRef.current > 1500) {
        lastTypingTimeRef.current = now;
        sendTyping(activeId);
      }
    }
  };

  // Pre-fill text when entering edit mode
  useEffect(() => {
    if (editing) {
      setText(editing.text || "");
      ref.current?.focus();
    }
  }, [editing]);

  // Focus when reply is set
  useEffect(() => {
    if (reply) ref.current?.focus();
  }, [reply]);

  // Auto-resize textarea smoothly without collapsing layout
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const newHeight = Math.min(el.scrollHeight, 140);
    el.style.height = `${newHeight}px`;
  }, [text]);

  const handleSendFiles = async (customFiles) => {
    const filesToUpload = customFiles && Array.isArray(customFiles) ? customFiles : selectedFiles;
    if (filesToUpload.length === 0 || isSubmittingRef.current || isUploading) return;

    isSubmittingRef.current = true;
    setIsUploading(true);
    const uploadedFiles = [];

    try {
      // Upload all selected files in parallel
      await Promise.all(
        filesToUpload.map(async (fileItem) => {
          const res = await uploadFileWithProgress(fileItem.file, (progress) => {
            setSelectedFiles((prev) =>
              prev.map((f) =>
                f.id === fileItem.id ? { ...f, progress } : f
              )
            );
          });
          uploadedFiles.push({
            url: res.url,
            name: fileItem.isGif ? `[GIF] ${fileItem.name}` : fileItem.name,
            isGif: Boolean(fileItem.isGif),
          });
        })
      );
    } catch (err) {
      toast.error(err.message || "Failed to upload file(s)");
      isSubmittingRef.current = false;
      setIsUploading(false);
      return;
    }

    const settings = queryClient.getQueryData(["settings"]);
    const soundEnabled = settings?.sound_enabled ?? true;

    if (soundEnabled) {
      try {
        const audio = new Audio("/pop.mp3");
        audio.volume = 0.4;
        audio.play().catch(() => {});
      } catch {}
    }

    const effectiveText = caption.trim() || text.trim();

    if (uploadedFiles.length > 0) {
      if (effectiveText) {
        // First file sent with caption / text + reply context
        const first = uploadedFiles[0];
        onSend(effectiveText, reply?.id ?? null, first.url, first.name, first.isGif);

        // Subsequent files sent as separate messages
        for (let i = 1; i < uploadedFiles.length; i++) {
          onSend("", null, uploadedFiles[i].url, uploadedFiles[i].name, uploadedFiles[i].isGif);
        }
      } else {
        // Each file sent as separate message
        uploadedFiles.forEach((item, idx) => {
          const replyId = idx === 0 ? (reply?.id ?? null) : null;
          onSend("", replyId, item.url, item.name, item.isGif);
        });
      }
    }

    setText("");
    setCaption("");
    clearAllSelectedFiles();
    setReply(null);
    setEditing(null);
    setEmojiOpen(false);
    setIsUploading(false);
    lastTypingTimeRef.current = 0;

    setTimeout(() => {
      isSubmittingRef.current = false;
    }, 100);

    requestAnimationFrame(() => {
      ref.current?.focus({ preventScroll: true });
    });
  };

  const submit = async () => {
    const value = text.trim();
    if (!value || isSubmittingRef.current) return;

    if (selectedFiles.length > 0) {
      handleSendFiles();
      return;
    }

    isSubmittingRef.current = true;

    if (editing) {
      onEdit(editing, value);
    } else {
      const settings = queryClient.getQueryData(["settings"]);
      const soundEnabled = settings?.sound_enabled ?? true;

      if (soundEnabled) {
        try {
          const audio = new Audio("/pop.mp3");
          audio.volume = 0.4;
          audio.play().catch(() => {});
        } catch {}
      }

      onSend(value, reply?.id ?? null, null, null);
    }

    // Clear composer state
    setText("");
    setCaption("");
    clearAllSelectedFiles();
    setReply(null);
    setEditing(null);
    setEmojiOpen(false);
    lastTypingTimeRef.current = 0;

    setTimeout(() => {
      isSubmittingRef.current = false;
    }, 100);

    requestAnimationFrame(() => {
      ref.current?.focus({ preventScroll: true });
    });
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      const isMobile = isMobileDevice();
      if (isMobile) return;
      if (!e.shiftKey) {
        e.preventDefault();
        submit();
      }
    }
    if (e.key === "Escape") {
      setReply(null);
      setEditing(null);
      setText("");
      clearAllSelectedFiles();
    }
  };

  const canSend = text.trim().length > 0 || selectedFiles.length > 0;

  const context = editing
    ? { label: "Editing", preview: editing.text, clear: () => { setEditing(null); setText(""); } }
    : reply
    ? { label: reply.senderName ? `Reply to ${reply.senderName}` : "Replying", preview: reply.text, clear: () => setReply(null) }
    : null;

  const preventFocusLoss = (e) => {
    e.preventDefault();
  };

  const handleSendPress = () => {
    if (canSend) {
      if (selectedFiles.length > 0) {
        handleSendFiles();
      } else {
        submit();
      }
    }
  };

  return (
    <div
      className="border-t border-border/40 bg-surface px-2.5 py-2 md:px-4 shrink-0 select-none"
      style={{
        paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {/* ── WhatsApp-style File Selection Preview Modal ────────────────────── */}
      <FilePreviewModal
        open={previewModalOpen && selectedFiles.length > 0}
        files={selectedFiles}
        caption={caption || text}
        onCaptionChange={(val) => {
          setCaption(val);
          setText(val);
        }}
        onAddFiles={handleAddFiles}
        onRemoveFile={removeSelectedFile}
        onClose={() => clearAllSelectedFiles()}
        onSend={handleSendFiles}
        isUploading={isUploading}
      />

      {/* ── URL Preview Above Input (WhatsApp/Telegram style) ──────────────── */}
      {detectedUrl && (
        <ComposerUrlPreview
          url={detectedUrl}
          onDismiss={() => setDismissedUrls((prev) => new Set(prev).add(detectedUrl))}
        />
      )}

      {/* Reply / Edit banner */}
      {context && (
        <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-elevated/80 px-3 py-2 shadow-xs fc-slide-up-sm">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="w-[3px] h-7 rounded-full bg-accent shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-accent leading-tight truncate">
                {context.label}
              </p>
              <p className="truncate text-xs text-muted-foreground mt-0.5 leading-tight">
                {context.preview}
              </p>
            </div>
          </div>
          <button
            type="button"
            onMouseDown={preventFocusLoss}
            onTouchStart={preventFocusLoss}
            onClick={context.clear}
            aria-label="Cancel"
            className="grid size-6 place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Emoji Picker */}
      {emojiOpen && (
        <div className="mb-2 flex flex-wrap gap-1 rounded-2xl border border-border/60 bg-surface/95 backdrop-blur-md p-2 shadow-xl fc-scale-in">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onMouseDown={preventFocusLoss}
              onTouchStart={preventFocusLoss}
              onClick={() => {
                setText((t) => t + e);
                ref.current?.focus();
              }}
              className="grid size-8 place-items-center rounded-xl text-base transition-all hover:bg-elevated hover:scale-110 active:scale-95"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-1.5 rounded-[22px] border border-border/40 bg-elevated/50 px-2 py-1 transition-all focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/20">
        {/* Emoji */}
        <button
          type="button"
          aria-label="Emoji"
          onMouseDown={preventFocusLoss}
          onTouchStart={preventFocusLoss}
          onClick={() => setEmojiOpen((v) => !v)}
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl transition-colors mb-0.5 no-tap-highlight",
            emojiOpen
              ? "text-accent bg-accent/15"
              : "text-muted-foreground hover:text-foreground hover:bg-surface/60"
          )}
        >
          <Smile className="size-5" />
        </button>

        {/* Attach (Label wrapper with overlayed invisible input supporting any format up to 10 files and 200MB) */}
        <label className="relative grid size-9 shrink-0 place-items-center rounded-xl transition-colors text-muted-foreground hover:text-foreground hover:bg-surface/60 mb-0.5 cursor-pointer no-tap-highlight">
          <Paperclip className="size-5" />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            multiple
          />
        </label>

        <textarea
          ref={ref}
          rows={1}
          value={text}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          enterKeyHint="send"
          autoCapitalize="sentences"
          autoCorrect="on"
          spellCheck="true"
          placeholder={editing ? "Edit message..." : reply ? `Reply...` : "Message..."}
          className="scroll-slim max-h-28 md:max-h-36 flex-1 resize-none bg-transparent py-2 text-[16px] md:text-[13px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60"
        />

        {/* Send */}
        <button
          type="button"
          onClick={handleSendPress}
          disabled={!canSend || isUploading}
          aria-label="Send"
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl text-accent-foreground transition-all disabled:opacity-30 active:scale-95 mb-0.5 shadow-xs no-tap-highlight cursor-pointer",
            canSend
              ? "bg-accent hover:opacity-90 shadow-accent/25"
              : "bg-muted/50 text-muted-foreground"
          )}
        >
          {isUploading ? (
            <Loader2 className="size-5 animate-spin text-accent-foreground" />
          ) : (
            <SendHorizonal className="size-5" />
          )}
        </button>
      </div>
    </div>
  );
}
