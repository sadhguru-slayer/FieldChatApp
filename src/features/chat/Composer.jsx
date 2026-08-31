import { useEffect, useRef, useState } from "react";
import { Paperclip, SendHorizonal, Smile, Loader2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { uploadFileWithProgress } from "@/services/api/attachments";
import { sendTyping } from "@/services/ws";

const EMOJIS = [
  "😀","😂","🙌","🔥","❤️","👍","🎉","😅","🤔","🙏","✅","👀","😎","🤝","💯","😊",
];

const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
};

export function Composer({ onSend, onEdit }) {
  const queryClient = useQueryClient();
  const activeId = useAppStore((s) => s.activeId);
  const reply = useAppStore((s) => s.reply);
  const setReply = useAppStore((s) => s.setReply);
  const editing = useAppStore((s) => s.editing);
  const setEditing = useAppStore((s) => s.setEditing);

  const [text, setText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const ref = useRef(null);
  const fileInputRef = useRef(null);
  const lastTypingTimeRef = useRef(0);
  const isSubmittingRef = useRef(false);

  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileChange = (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;

    if (selectedFiles.length + files.length > 5) {
      toast.error("You can upload a maximum of 5 files at a time.");
      return;
    }

    const newFiles = [];
    for (const file of files) {
      // 100MB check
      if (file.size > 100 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds the 100MB size limit.`);
        continue;
      }

      const isImg = file.type.startsWith("image/");
      const previewUrl = isImg ? URL.createObjectURL(file) : null;
      
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

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeSelectedFile = (id) => {
    const item = selectedFiles.find((f) => f.id === id);
    if (item && item.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearAllSelectedFiles = () => {
    selectedFiles.forEach((f) => {
      if (f.previewUrl) {
        URL.revokeObjectURL(f.previewUrl);
      }
    });
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    return () => {
      // Clean up previews ONLY on component unmount
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

  const submit = async () => {
    const value = text.trim();
    if ((!value && selectedFiles.length === 0) || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    const uploadedFiles = [];

    if (selectedFiles.length > 0) {
      try {
        // Upload all selected files in parallel
        await Promise.all(
          selectedFiles.map(async (fileItem) => {
            if (fileItem.status === "done") {
              uploadedFiles.push({ url: fileItem.url, name: fileItem.name });
              return;
            }

            setSelectedFiles((prev) =>
              prev.map((f) =>
                f.id === fileItem.id ? { ...f, status: "uploading", progress: 0 } : f
              )
            );

            const res = await uploadFileWithProgress(fileItem.file, (progress) => {
              setSelectedFiles((prev) =>
                prev.map((f) =>
                  f.id === fileItem.id ? { ...f, progress } : f
                )
              );
            });

            setSelectedFiles((prev) =>
              prev.map((f) =>
                f.id === fileItem.id ? { ...f, status: "done", url: res.url } : f
              )
            );
            
            uploadedFiles.push({ url: res.url, name: fileItem.name });
          })
        );
      } catch (err) {
        toast.error(err.message || "Failed to upload file(s)");
        isSubmittingRef.current = false;
        // Reset uploading statuses back to idle
        setSelectedFiles((prev) =>
          prev.map((f) =>
            f.status === "uploading" ? { ...f, status: "idle", progress: 0 } : f
          )
        );
        return;
      }
    }

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

      if (uploadedFiles.length > 0) {
        if (value) {
          // If there is text, send the first file with the text and reply context
          const first = uploadedFiles[0];
          onSend(value, reply?.id ?? null, first.url, first.name);

          // Send subsequent files as separate empty messages
          for (let i = 1; i < uploadedFiles.length; i++) {
            onSend("", null, uploadedFiles[i].url, uploadedFiles[i].name);
          }
        } else {
          // If no text, send each file as a separate message
          uploadedFiles.forEach((item, idx) => {
            const replyId = idx === 0 ? (reply?.id ?? null) : null;
            onSend("", replyId, item.url, item.name);
          });
        }
      } else {
        // Normal text message
        onSend(value, reply?.id ?? null, null, null);
      }
    }

    // Clear the composer state
    setText("");
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
      if (isMobile) {
        return;
      }
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

  const isUploading = selectedFiles.some((f) => f.status === "uploading");
  const canSend = (text.trim().length > 0 || selectedFiles.length > 0) && !isUploading;

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
      submit();
    }
  };

  return (
    <div
      className="border-t border-border/40 bg-surface px-2.5 py-2 md:px-4 shrink-0 select-none"
      style={{
        paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {/* File attachments list */}
      {selectedFiles.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2 max-h-36 overflow-y-auto scroll-slim py-1">
          {selectedFiles.map((fileItem) => (
            <div 
              key={fileItem.id} 
              className="relative flex items-center gap-2 rounded-xl border border-border/50 bg-elevated/40 p-2 pr-8 shadow-xs min-w-[150px] max-w-[240px] flex-1 transition-all animate-in fade-in slide-in-from-bottom-2 duration-250"
            >
              {fileItem.previewUrl ? (
                <img src={fileItem.previewUrl} alt="Preview" className="size-10 rounded-lg object-cover border border-border/50 shrink-0" />
              ) : (
                <div className="grid size-10 place-items-center rounded-lg bg-surface border border-border/50 text-muted-foreground shrink-0">
                  <Paperclip className="size-4" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate text-foreground/90">
                  {fileItem.name}
                </p>
                {fileItem.status === "uploading" ? (
                  <div className="mt-1 w-full bg-border/40 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-accent h-1.5 rounded-full transition-all duration-200" 
                      style={{ width: `${fileItem.progress}%` }}
                    />
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {(fileItem.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                )}
              </div>
              
              {fileItem.status !== "uploading" && (
                <button
                  type="button"
                  onClick={() => removeSelectedFile(fileItem.id)}
                  className="absolute top-1/2 right-1.5 -translate-y-1/2 grid size-6 place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface/85 transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reply / Edit banner */}
      {context && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border-l-2 border-accent bg-elevated/70 px-3 py-1.5 shadow-2xs">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">
              {context.label}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {context.preview}
            </p>
          </div>
          <button
            type="button"
            onMouseDown={preventFocusLoss}
            onTouchStart={preventFocusLoss}
            onClick={context.clear}
            aria-label="Cancel"
            className="shrink-0 text-base leading-none text-muted-foreground transition-colors hover:text-foreground opacity-60 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}

      {/* Emoji Picker */}
      {emojiOpen && (
        <div className="mb-2 flex flex-wrap gap-1 rounded-xl border border-border/60 bg-surface p-2 shadow-xl fc-scale-in">
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
              className="grid size-8 place-items-center rounded-lg text-base transition-all hover:bg-elevated hover:scale-110 active:scale-95"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-1.5 rounded-2xl border border-border/50 bg-elevated/60 px-2 py-1 transition-all focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/30">
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

        {/* Attach (Label wrapper with overlayed invisible input for bulletproof mobile support) */}
        <label className="relative grid size-9 shrink-0 place-items-center rounded-xl transition-colors text-muted-foreground hover:text-foreground hover:bg-surface/60 mb-0.5 cursor-pointer no-tap-highlight">
          <Paperclip className="size-5" />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            multiple
          />
        </label>

        {/* Textarea — NEVER disabled so keyboard never collapses */}
        <textarea
          ref={ref}
          rows={1}
          value={text}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          onFocus={() => {
            // Keep focus/keyboard stable on mobile.
          }}
          placeholder={editing ? "Edit message..." : reply ? `Reply...` : "Message..."}
          className="scroll-slim max-h-28 md:max-h-36 flex-1 resize-none bg-transparent py-2 text-[15px] md:text-[13px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60"
        />

        {/* Send */}
        <button
          type="button"
          onClick={handleSendPress}
          disabled={!canSend}
          aria-label="Send"
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl text-accent-foreground transition-all disabled:opacity-30 active:scale-95 mb-0.5 shadow-xs no-tap-highlight",
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
