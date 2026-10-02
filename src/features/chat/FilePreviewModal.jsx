import { useState, useRef, useEffect } from "react";
import {
  X,
  Trash2,
  Plus,
  Send,
  FileText,
  Music,
  Film,
  File,
  Smile,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { renderPdfPage1Thumbnail } from "@/lib/pdfThumbnail";

const EMOJIS = ["😀", "😂", "🔥", "❤️", "👍", "🎉", "🙏", "✅", "😎", "💯"];

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getFileCategory(file) {
  const type = (file?.type || "").toLowerCase();
  const name = (file?.name || "").toLowerCase();
  if (type.startsWith("image/") || /\.(jpeg|jpg|png|gif|webp|svg|bmp|ico)$/i.test(name)) return "image";
  if (type.startsWith("video/") || /\.(mp4|webm|ogg|mov|m4v|mkv)$/i.test(name)) return "video";
  if (type.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(name)) return "audio";
  if (type === "application/pdf" || /\.pdf$/i.test(name)) return "pdf";
  return "doc";
}

function getFileExtension(filename) {
  if (!filename || !filename.includes(".")) return "FILE";
  return filename.split(".").pop().toUpperCase().slice(0, 5);
}

export function FilePreviewModal({
  open,
  files = [],
  caption = "",
  onCaptionChange,
  onAddFiles,
  onRemoveFile,
  onClose,
  onSend,
  isUploading = false,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [pdfThumbnails, setPdfThumbnails] = useState({});
  // gifModes: { [fileId]: boolean } — when true the video is uploaded as-is but flagged isGif
  const [gifModes, setGifModes] = useState({});
  // videoDurations: { [fileId]: number (seconds) } — probed asynchronously
  const [videoDurations, setVideoDurations] = useState({});

  const addFileInputRef = useRef(null);
  const inputRef = useRef(null);

  // Clamp active index when files change
  useEffect(() => {
    if (activeIndex >= files.length) {
      setActiveIndex(Math.max(0, files.length - 1));
    }
  }, [files.length, activeIndex]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  // Generate Page-1 thumbnail for PDFs
  useEffect(() => {
    if (!open || !files.length) return;
    files.forEach((item) => {
      if (getFileCategory(item.file) === "pdf" && !pdfThumbnails[item.id]) {
        renderPdfPage1Thumbnail(item.file).then((thumb) => {
          if (thumb) setPdfThumbnails((prev) => ({ ...prev, [item.id]: thumb }));
        });
      }
    });
  }, [open, files, pdfThumbnails]);

  // Probe video duration for GIF eligibility (≤ 30 s)
  useEffect(() => {
    if (!open || !files.length) return;
    files.forEach((item) => {
      if (
        getFileCategory(item.file) === "video" &&
        videoDurations[item.id] === undefined &&
        item.previewUrl
      ) {
        const vid = document.createElement("video");
        vid.preload = "metadata";
        vid.src = item.previewUrl;
        vid.onloadedmetadata = () =>
          setVideoDurations((prev) => ({ ...prev, [item.id]: vid.duration }));
        vid.onerror = () =>
          setVideoDurations((prev) => ({ ...prev, [item.id]: Infinity }));
      }
    });
  }, [open, files, videoDurations]);

  if (!open || files.length === 0) return null;

  const currentFile = files[activeIndex] || files[0];
  const fileCategory = currentFile ? getFileCategory(currentFile.file) : "doc";
  const isCurrentGifMode = currentFile ? Boolean(gifModes[currentFile.id]) : false;
  const currentDuration = currentFile ? (videoDurations[currentFile.id] ?? null) : null;
  // GIF toggle only shown for videos ≤ 30 s
  const isGifEligible = fileCategory === "video" && currentDuration !== null && currentDuration <= 30;

  const handleKeyDown = (e) => {
    if (e.key === "Escape" && !isUploading) onClose();
    else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isUploading) handleTriggerSend();
    } else if (e.key === "ArrowLeft") setActiveIndex((p) => Math.max(0, p - 1));
    else if (e.key === "ArrowRight") setActiveIndex((p) => Math.min(files.length - 1, p + 1));
  };

  const handleAddFileChange = (e) => {
    const picked = e.target.files ? Array.from(e.target.files) : [];
    if (picked.length && onAddFiles) onAddFiles(picked);
    if (addFileInputRef.current) addFileInputRef.current.value = "";
  };

  const toggleGifMode = (fileId) =>
    setGifModes((prev) => ({ ...prev, [fileId]: !prev[fileId] }));

  /**
   * No heavy client-side GIF conversion.
   * Instead, the original video is uploaded as-is, but with isGif: true.
   * On the receiver's (and sender's) side, LazyGif renders it as a muted looping <video>.
   */
  const handleTriggerSend = () => {
    const processedFiles = files.map((item) =>
      getFileCategory(item.file) === "video" && gifModes[item.id]
        ? { ...item, isGif: true }
        : item
    );
    onSend(processedFiles);
  };

  return (
    <div
      className={cn(
        // Mobile (< md): fixed full-screen. Desktop (md+): absolute within ChatPane column.
        "inset-0 z-[99999] flex flex-col bg-black/96 text-white select-none",
        "fixed md:absolute",
        "animate-in fade-in duration-150"
      )}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Hidden add-more input */}
      <input
        ref={addFileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleAddFileChange}
      />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex h-11 items-center justify-between px-3 border-b border-white/[0.07] shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="grid size-7 place-items-center rounded-lg text-white/40 hover:text-white hover:bg-white/8 active:scale-95 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="size-3.5" />
          </button>
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] font-medium text-white/80 truncate max-w-[180px] sm:max-w-xs">
              {currentFile?.name}
            </span>
            <span className="text-[9.5px] text-white/30 font-mono">
              {files.length > 1 ? `${activeIndex + 1} / ${files.length} · ` : ""}
              {formatFileSize(currentFile?.size)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onRemoveFile(currentFile?.id)}
          disabled={isUploading}
          className="grid size-7 place-items-center rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/8 active:scale-95 transition-all cursor-pointer"
          title="Remove"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {/* ── Main Preview ─────────────────────────────────────────────────────── */}
      <div className="relative flex-1 flex items-center justify-center p-3 overflow-hidden min-h-0">
        {/* Prev / Next */}
        {files.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActiveIndex((p) => Math.max(0, p - 1))}
              disabled={activeIndex === 0 || isUploading}
              className={cn(
                "absolute left-2 top-1/2 -translate-y-1/2 z-20 grid size-7 place-items-center rounded-full bg-white/5 border border-white/8 text-white/50 transition-all hover:bg-white/10 hover:text-white active:scale-95",
                activeIndex === 0 && "opacity-20 pointer-events-none"
              )}
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveIndex((p) => Math.min(files.length - 1, p + 1))}
              disabled={activeIndex === files.length - 1 || isUploading}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 z-20 grid size-7 place-items-center rounded-full bg-white/5 border border-white/8 text-white/50 transition-all hover:bg-white/10 hover:text-white active:scale-95",
                activeIndex === files.length - 1 && "opacity-20 pointer-events-none"
              )}
            >
              <ChevronRight className="size-3.5" />
            </button>
          </>
        )}

        {/* Image */}
        {fileCategory === "image" && (
          <img
            src={currentFile.previewUrl}
            alt={currentFile.name}
            className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-2xl"
          />
        )}

        {/* Video */}
        {fileCategory === "video" && (
          <div className="flex flex-col items-center gap-2.5 w-full max-h-full">
            {/* GIF / Video toggle — only for ≤ 30 s clips */}
            {isGifEligible && (
              <div className="flex items-center rounded-full bg-white/[0.05] border border-white/[0.08] p-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => isCurrentGifMode && toggleGifMode(currentFile.id)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer",
                    !isCurrentGifMode ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"
                  )}
                >
                  <Film className="size-2.5 opacity-60" />
                  <span>Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => !isCurrentGifMode && toggleGifMode(currentFile.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider transition-all cursor-pointer",
                    isCurrentGifMode ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"
                  )}
                  title="Send as silent looping clip (GIF style)"
                >
                  GIF
                </button>
              </div>
            )}
            {currentDuration !== null && !isGifEligible && (
              <span className="text-[9.5px] text-white/20 font-mono">
                &gt; 30 s — GIF not available
              </span>
            )}

            <div className="relative flex items-center justify-center max-h-[55vh] max-w-full overflow-hidden rounded-xl bg-black ring-1 ring-white/[0.06]">
              <video
                src={currentFile.previewUrl}
                controls={!isCurrentGifMode}
                autoPlay
                loop={isCurrentGifMode}
                muted={isCurrentGifMode}
                playsInline
                className="max-h-[55vh] max-w-full object-contain"
              />
              {isCurrentGifMode && (
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-white font-mono font-bold text-[8px] tracking-widest border border-white/10 select-none">
                  GIF
                </div>
              )}
            </div>
          </div>
        )}

        {/* Audio */}
        {fileCategory === "audio" && (
          <div className="flex flex-col items-center max-w-sm w-full p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
            <div className="grid size-12 place-items-center rounded-xl bg-white/[0.05] text-white/35 border border-white/[0.07] mb-4">
              <Music className="size-6" />
            </div>
            <h3 className="text-[12px] font-medium text-white/80 text-center truncate max-w-full">
              {currentFile.name}
            </h3>
            <p className="text-[10px] text-white/30 mt-1 font-mono">{formatFileSize(currentFile.size)}</p>
            <audio src={currentFile.previewUrl} controls className="w-full mt-4" />
          </div>
        )}

        {/* PDF — static Page 1 */}
        {fileCategory === "pdf" && (
          <div className="flex flex-col items-center max-w-sm w-full p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
            <div className="relative w-full max-h-[50vh] aspect-[3/4] bg-black/60 rounded-xl overflow-hidden border border-white/[0.07] flex items-center justify-center">
              {pdfThumbnails[currentFile.id] ? (
                <img
                  src={pdfThumbnails[currentFile.id]}
                  alt="Page 1"
                  className="size-full object-contain bg-white rounded-xl"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-white/20 animate-pulse">
                  <FileText className="size-7 text-red-400/40" />
                  <span className="text-[10px] font-mono">Loading…</span>
                </div>
              )}
              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-white font-mono text-[8px] border border-white/10">
                PAGE 1
              </div>
            </div>
            <div className="w-full flex items-center justify-between mt-2.5 px-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="px-1 py-0.5 rounded bg-red-600/70 text-white font-bold text-[8px] font-mono">PDF</span>
                <span className="text-[11px] text-white/65 truncate">{currentFile.name}</span>
              </div>
              <span className="text-[10px] text-white/30 font-mono shrink-0 ml-2">
                {formatFileSize(currentFile.size)}
              </span>
            </div>
          </div>
        )}

        {/* Other doc */}
        {fileCategory === "doc" && (
          <div className="flex flex-col items-center max-w-xs w-full p-8 rounded-2xl bg-white/[0.03] border border-white/[0.07] text-center">
            <div className="relative grid size-14 place-items-center rounded-xl bg-white/[0.05] text-white/35 border border-white/[0.07] mb-4">
              <FileText className="size-7" />
              <span className="absolute bottom-0.5 right-0.5 px-1 py-0.5 rounded bg-white/10 text-white font-bold text-[7px] font-mono leading-none">
                {getFileExtension(currentFile.name)}
              </span>
            </div>
            <h3 className="text-[12px] font-medium text-white/80 truncate max-w-full">{currentFile.name}</h3>
            <p className="text-[10px] text-white/30 mt-1 font-mono">{formatFileSize(currentFile.size)}</p>
          </div>
        )}
      </div>

      {/* ── Filmstrip ───────────────────────────────────────────────────────── */}
      <div className="border-t border-white/[0.07] px-3 py-2 shrink-0 flex justify-center overflow-hidden">
        <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 max-w-full scroll-slim mx-auto">
          {files.map((fileItem, idx) => {
            const isSelected = idx === activeIndex;
            const cat = getFileCategory(fileItem.file);
            const isGif = Boolean(gifModes[fileItem.id]);

            return (
              <div
                key={fileItem.id}
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "relative group shrink-0 size-13.5 sm:size-14 md:size-12 rounded-xl overflow-hidden border cursor-pointer transition-all flex items-center justify-center bg-white/[0.03]",
                  isSelected
                    ? "border-white/35 ring-2 ring-white/15 scale-105"
                    : "border-white/[0.08] opacity-55 hover:opacity-85"
                )}
              >
                {cat === "image" && fileItem.previewUrl ? (
                  <img src={fileItem.previewUrl} alt="" className="size-full object-cover" />
                ) : cat === "video" ? (
                  <div className="size-full grid place-items-center bg-white/[0.03] text-white/35 relative">
                    <Film className="size-4" />
                    {isGif && (
                      <span className="absolute bottom-0.5 left-0.5 text-[7px] bg-white/10 px-0.5 rounded font-mono font-bold text-white">
                        GIF
                      </span>
                    )}
                  </div>
                ) : cat === "audio" ? (
                  <div className="size-full grid place-items-center text-white/35">
                    <Music className="size-4" />
                  </div>
                ) : cat === "pdf" ? (
                  pdfThumbnails[fileItem.id] ? (
                    <img src={pdfThumbnails[fileItem.id]} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="size-full grid place-items-center text-red-400/35">
                      <FileText className="size-4" />
                    </div>
                  )
                ) : (
                  <div className="size-full flex flex-col items-center justify-center text-white/35">
                    <File className="size-4" />
                    <span className="text-[7px] font-bold font-mono truncate max-w-[40px]">
                      {getFileExtension(fileItem.name)}
                    </span>
                  </div>
                )}

                {/* Desktop-only hover-reveal remove (Mobile uses header delete/trash icon) */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemoveFile(fileItem.id); }}
                  disabled={isUploading}
                  className="hidden md:grid absolute top-0.5 right-0.5 size-4 place-items-center rounded-full bg-black/80 text-white/40 opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-all cursor-pointer"
                  title="Remove"
                >
                  <X className="size-2.5" />
                </button>
              </div>
            );
          })}

          {files.length < 10 && (
            <button
              type="button"
              onClick={() => addFileInputRef.current?.click()}
              disabled={isUploading}
              className="shrink-0 size-13.5 sm:size-14 md:size-12 rounded-xl border border-dashed border-white/[0.12] hover:border-white/25 hover:bg-white/4 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer text-white/30 hover:text-white/60"
              title="Add more (up to 10)"
            >
              <Plus className="size-4" />
              <span className="text-[8px] font-mono">{files.length}/10</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Caption & Send ──────────────────────────────────────────────────── */}
      <div className="relative border-t border-white/[0.07] px-3 py-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-2 shrink-0">
        {emojiOpen && (
          <div className="absolute bottom-full left-3 mb-1.5 flex items-center gap-1 rounded-xl bg-zinc-900/95 p-1 border border-white/10 shadow-xl backdrop-blur-md">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onCaptionChange((caption || "") + emoji);
                  setEmojiOpen(false);
                }}
                className="grid size-7 place-items-center rounded-lg text-base hover:bg-white/10 active:scale-95 transition-all"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEmojiOpen((p) => !p)}
            className="grid size-7 place-items-center rounded-lg text-white/30 hover:text-white/55 hover:bg-white/6 transition-colors shrink-0"
            aria-label="Emoji"
          >
            <Smile className="size-3.5" />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            placeholder="Add a caption…"
            disabled={isUploading}
            className="flex-1 min-w-0 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] px-3 text-[12px] text-white placeholder:text-white/22 focus:outline-none focus:border-white/15"
          />

          <Button
            onClick={handleTriggerSend}
            disabled={isUploading || files.length === 0}
            className="h-8 px-3 rounded-lg text-[11px] font-medium flex items-center gap-1.5 bg-white/[0.07] hover:bg-white/[0.11] text-white/75 border border-white/[0.08] shrink-0 cursor-pointer shadow-none"
          >
            {isUploading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <>
                <Send className="size-3.5" />
                {files.length > 1 && (
                  <span className="text-white/40 font-mono text-[9px]">{files.length}</span>
                )}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
