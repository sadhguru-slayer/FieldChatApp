import { useState, useRef, useEffect } from "react";
import {
  X,
  Trash2,
  Plus,
  Send,
  FileText,
  FileArchive,
  Music,
  Film,
  Image as ImageIcon,
  File,
  Smile,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { renderPdfPage1Thumbnail } from "@/lib/pdfThumbnail";
import { convertVideoToGifBlob } from "@/lib/videoToGif";

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
  const [gifModes, setGifModes] = useState({}); // { [fileId]: boolean }
  const [convertingGif, setConvertingGif] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);

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

  // Generate Page 1 static thumbnail for any PDF in files
  useEffect(() => {
    if (!open || !files.length) return;

    files.forEach((item) => {
      if (getFileCategory(item.file) === "pdf" && !pdfThumbnails[item.id]) {
        renderPdfPage1Thumbnail(item.file).then((thumb) => {
          if (thumb) {
            setPdfThumbnails((prev) => ({ ...prev, [item.id]: thumb }));
          }
        });
      }
    });
  }, [open, files, pdfThumbnails]);

  if (!open || files.length === 0) return null;

  const currentFile = files[activeIndex] || files[0];
  const fileCategory = currentFile ? getFileCategory(currentFile.file) : "doc";
  const isCurrentGifMode = currentFile ? Boolean(gifModes[currentFile.id]) : false;

  const handleKeyDown = (e) => {
    if (e.key === "Escape" && !isUploading && !convertingGif) {
      onClose();
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isUploading && !convertingGif) handleTriggerSend();
    } else if (e.key === "ArrowLeft") {
      setActiveIndex((prev) => Math.max(0, prev - 1));
    } else if (e.key === "ArrowRight") {
      setActiveIndex((prev) => Math.min(files.length - 1, prev + 1));
    }
  };

  const handleAddMoreClick = () => {
    if (addFileInputRef.current) {
      addFileInputRef.current.click();
    }
  };

  const handleAddFileChange = (e) => {
    const newPicked = e.target.files ? Array.from(e.target.files) : [];
    if (newPicked.length && onAddFiles) {
      onAddFiles(newPicked);
    }
    if (addFileInputRef.current) {
      addFileInputRef.current.value = "";
    }
  };

  const toggleGifMode = (fileId) => {
    setGifModes((prev) => ({ ...prev, [fileId]: !prev[fileId] }));
  };

  const handleTriggerSend = async () => {
    // Check if any video is set to GIF mode and needs conversion
    const processedFiles = [];
    setConvertingGif(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        if (getFileCategory(item.file) === "video" && gifModes[item.id]) {
          setConversionProgress(10);
          const gifFile = await convertVideoToGifBlob(item.file, {
            onProgress: (p) => setConversionProgress(p),
          });
          processedFiles.push({
            ...item,
            file: gifFile,
            name: gifFile.name,
            size: gifFile.size,
            isGif: true,
          });
        } else {
          processedFiles.push(item);
        }
      }
    } catch (err) {
      console.warn("[GIF Conversion] Fallback to original video:", err);
      processedFiles.length = 0;
      processedFiles.push(...files);
    } finally {
      setConvertingGif(false);
      setConversionProgress(0);
    }

    onSend(processedFiles);
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col bg-black/95 backdrop-blur-xl text-white select-none animate-in fade-in duration-200"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Hidden input for adding more files */}
      <input
        ref={addFileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleAddFileChange}
      />

      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-white/10 shrink-0 bg-black/40">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading || convertingGif}
            className="grid size-9 place-items-center rounded-full text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            aria-label="Close preview"
          >
            <X className="size-5" />
          </button>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-white/95">
              {files.length === 1 ? "Preview" : `${activeIndex + 1} of ${files.length}`}
            </span>
            <span className="text-[10.5px] text-white/50 truncate max-w-xs sm:max-w-md font-mono">
              {currentFile?.name} ({formatFileSize(currentFile?.size)})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Delete current file button */}
          <button
            type="button"
            onClick={() => onRemoveFile(currentFile?.id)}
            disabled={isUploading || convertingGif}
            className="grid size-9 place-items-center rounded-full text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 active:scale-95 transition-all cursor-pointer"
            title="Remove this item"
          >
            <Trash2 className="size-4.5" />
          </button>
        </div>
      </div>

      {/* ── Main Viewport Area ───────────────────────────────────────────────── */}
      <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden min-h-0">
        {/* Navigation Arrows for desktop carousel */}
        {files.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
              disabled={activeIndex === 0 || isUploading || convertingGif}
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 z-20 grid size-10 place-items-center rounded-full bg-black/60 text-white/90 border border-white/10 shadow-xl backdrop-blur-md transition-all hover:bg-black/80 hover:scale-105 active:scale-95",
                activeIndex === 0 && "opacity-30 cursor-not-allowed hover:scale-100"
              )}
              aria-label="Previous file"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => Math.min(files.length - 1, prev + 1))}
              disabled={activeIndex === files.length - 1 || isUploading || convertingGif}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 z-20 grid size-10 place-items-center rounded-full bg-black/60 text-white/90 border border-white/10 shadow-xl backdrop-blur-md transition-all hover:bg-black/80 hover:scale-105 active:scale-95",
                activeIndex === files.length - 1 && "opacity-30 cursor-not-allowed hover:scale-100"
              )}
              aria-label="Next file"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}

        {/* 1. Image Preview */}
        {fileCategory === "image" && (
          <div className="relative flex items-center justify-center size-full max-h-full">
            <img
              src={currentFile.previewUrl}
              alt={currentFile.name}
              className="max-h-[62vh] sm:max-h-[68vh] max-w-[90vw] object-contain rounded-xl shadow-2xl ring-1 ring-white/10"
            />
          </div>
        )}

        {/* 2. Video Preview with WhatsApp-style Video/GIF Mode Toggle */}
        {fileCategory === "video" && (
          <div className="relative flex flex-col items-center justify-center size-full max-h-full">
            {/* WhatsApp-style Video / GIF Mode Toggle Pill */}
            <div className="mb-3 flex items-center rounded-full bg-zinc-900/90 border border-white/15 p-0.5 shadow-xl backdrop-blur-md z-10">
              <button
                type="button"
                onClick={() => isCurrentGifMode && toggleGifMode(currentFile.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
                  !isCurrentGifMode
                    ? "bg-accent text-white shadow-xs"
                    : "text-white/60 hover:text-white"
                )}
              >
                <Film className="size-3.5" />
                <span>Video</span>
              </button>
              <button
                type="button"
                onClick={() => !isCurrentGifMode && toggleGifMode(currentFile.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
                  isCurrentGifMode
                    ? "bg-accent text-white shadow-xs font-mono font-bold"
                    : "text-white/60 hover:text-white"
                )}
                title="Send as muted, auto-looping GIF"
              >
                <Sparkles className="size-3 text-amber-300" />
                <span>GIF</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center max-h-[56vh] sm:max-h-[62vh] max-w-[90vw] overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10 bg-black">
              <video
                src={currentFile.previewUrl}
                controls={!isCurrentGifMode}
                autoPlay
                loop={isCurrentGifMode}
                muted={isCurrentGifMode}
                className="max-h-[56vh] sm:max-h-[62vh] max-w-[90vw] object-contain"
              />
              {isCurrentGifMode && (
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white font-mono font-extrabold text-[10px] tracking-wider border border-white/10 select-none">
                  GIF MODE
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. Audio Preview */}
        {fileCategory === "audio" && (
          <div className="flex flex-col items-center justify-center max-w-md w-full p-6 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-2xl">
            <div className="grid size-16 place-items-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 mb-4 shadow-inner">
              <Music className="size-8" />
            </div>
            <h3 className="text-sm font-semibold text-white/95 text-center truncate max-w-full px-2">
              {currentFile.name}
            </h3>
            <p className="text-xs text-zinc-400 mt-1 font-mono">{formatFileSize(currentFile.size)}</p>
            <div className="w-full mt-5">
              <audio src={currentFile.previewUrl} controls className="w-full" />
            </div>
          </div>
        )}

        {/* 4. PDF Preview (Static Page 1 Thumbnail — Non-editable & lightweight) */}
        {fileCategory === "pdf" && (
          <div className="flex flex-col items-center justify-center max-w-md w-full p-4 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-2xl">
            <div className="relative w-full max-h-[52vh] aspect-[3/4] bg-zinc-950 rounded-xl overflow-hidden border border-white/10 shadow-xl flex items-center justify-center">
              {pdfThumbnails[currentFile.id] ? (
                <img
                  src={pdfThumbnails[currentFile.id]}
                  alt="PDF Page 1 Thumbnail"
                  className="size-full object-contain bg-white rounded-xl"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-white/50 animate-pulse">
                  <FileText className="size-10 text-red-400" />
                  <span className="text-xs font-mono">Generating Page 1 preview...</span>
                </div>
              )}

              {/* Overlay Page 1 Badge */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-white font-mono font-bold text-[10px] border border-white/10">
                PAGE 1 PREVIEW
              </div>
            </div>

            {/* Document Details Footer */}
            <div className="w-full flex items-center justify-between mt-3 px-1">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <span className="px-1.5 py-0.5 rounded bg-red-600 text-white font-bold text-[9.5px] font-mono leading-none">
                  PDF
                </span>
                <span className="text-xs font-medium text-white/90 truncate">{currentFile.name}</span>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono shrink-0">
                {formatFileSize(currentFile.size)}
              </span>
            </div>
          </div>
        )}

        {/* 5. Document / Other files Preview */}
        {fileCategory === "doc" && (
          <div className="flex flex-col items-center justify-center max-w-sm w-full p-8 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-2xl text-center">
            <div className="relative grid size-20 place-items-center rounded-2xl bg-blue-500/15 text-blue-400 border border-blue-500/30 mb-4 shadow-inner">
              <FileText className="size-10" />
              <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-blue-600 text-white font-bold text-[9px] font-mono leading-none">
                {getFileExtension(currentFile.name)}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-white/95 truncate max-w-full px-2">
              {currentFile.name}
            </h3>
            <p className="text-xs text-zinc-400 mt-1 font-mono">{formatFileSize(currentFile.size)}</p>
            <div className="mt-4 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-zinc-400 font-mono">
              Ready to send
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Filmstrip Thumbnail Carousel ─────────────────────────────── */}
      <div className="border-t border-white/10 bg-black/60 px-4 py-2 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto scroll-slim py-1">
          {files.map((fileItem, idx) => {
            const isSelected = idx === activeIndex;
            const cat = getFileCategory(fileItem.file);
            const isGif = Boolean(gifModes[fileItem.id]);

            return (
              <div
                key={fileItem.id}
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "relative group shrink-0 size-13 rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-150 flex items-center justify-center bg-zinc-900",
                  isSelected
                    ? "border-accent ring-2 ring-accent/30 scale-105"
                    : "border-white/15 opacity-70 hover:opacity-100 hover:border-white/40"
                )}
              >
                {cat === "image" && fileItem.previewUrl ? (
                  <img src={fileItem.previewUrl} alt="" className="size-full object-cover" />
                ) : cat === "video" ? (
                  <div className="size-full grid place-items-center bg-zinc-900 text-purple-400 relative">
                    <Film className="size-5" />
                    {isGif && (
                      <span className="absolute bottom-0.5 left-0.5 text-[7px] bg-accent px-1 py-0.2 rounded font-mono font-bold text-white">
                        GIF
                      </span>
                    )}
                  </div>
                ) : cat === "audio" ? (
                  <div className="size-full grid place-items-center bg-zinc-900 text-indigo-400">
                    <Music className="size-5" />
                  </div>
                ) : cat === "pdf" ? (
                  pdfThumbnails[fileItem.id] ? (
                    <img src={pdfThumbnails[fileItem.id]} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="size-full flex flex-col items-center justify-center bg-zinc-900 text-red-400">
                      <FileText className="size-4" />
                      <span className="text-[8px] font-bold font-mono">PDF</span>
                    </div>
                  )
                ) : (
                  <div className="size-full flex flex-col items-center justify-center bg-zinc-900 text-blue-400">
                    <File className="size-4" />
                    <span className="text-[7.5px] font-bold font-mono truncate max-w-[42px] px-0.5">
                      {getFileExtension(fileItem.name)}
                    </span>
                  </div>
                )}

                {/* Remove button on thumbnail */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFile(fileItem.id);
                  }}
                  disabled={isUploading || convertingGif}
                  className="absolute top-0.5 right-0.5 grid size-4.5 place-items-center rounded-full bg-black/80 text-white/80 opacity-0 group-hover:opacity-100 hover:text-rose-400 hover:bg-black transition-all"
                  title="Remove"
                >
                  <X className="size-3" />
                </button>
              </div>
            );
          })}

          {/* Add more files (+) button (up to 10 files) */}
          {files.length < 10 && (
            <button
              type="button"
              onClick={handleAddMoreClick}
              disabled={isUploading || convertingGif}
              className="shrink-0 size-13 rounded-xl border-2 border-dashed border-white/20 hover:border-accent hover:text-accent hover:bg-accent/10 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 text-white/60 cursor-pointer"
              title="Add more files (up to 10)"
            >
              <Plus className="size-4.5" />
              <span className="text-[8.5px] font-semibold">{files.length}/10</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Caption Input & Send Action Bar ──────────────────────────────────── */}
      <div className="relative border-t border-white/10 bg-zinc-950/90 px-3 py-2.5 sm:px-4 shrink-0">
        {/* Emoji Quick Bar */}
        {emojiOpen && (
          <div className="absolute bottom-full left-4 mb-2 flex items-center gap-1 rounded-2xl bg-zinc-900/95 p-1.5 border border-white/15 shadow-2xl backdrop-blur-md">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onCaptionChange((caption || "") + emoji);
                  setEmojiOpen(false);
                }}
                className="grid size-8 place-items-center rounded-xl text-lg hover:bg-white/10 active:scale-95 transition-all"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <button
            type="button"
            onClick={() => setEmojiOpen((prev) => !prev)}
            className="grid size-9 place-items-center rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Add emoji"
          >
            <Smile className="size-5" />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            placeholder="Add a caption..."
            disabled={isUploading || convertingGif}
            className="flex-1 h-10 rounded-xl bg-zinc-900/80 border border-white/10 px-3.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-accent/60"
          />

          <Button
            onClick={handleTriggerSend}
            disabled={isUploading || convertingGif || files.length === 0}
            className="h-10 px-4 rounded-xl font-semibold text-xs flex items-center gap-2 bg-accent text-white hover:bg-accent/90 shrink-0 shadow-lg shadow-accent/20 cursor-pointer"
          >
            {convertingGif ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Converting GIF {conversionProgress > 0 ? `${conversionProgress}%` : ""}...</span>
              </>
            ) : isUploading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <span>Send</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                  {files.length}
                </span>
                <Send className="size-3.5 ml-0.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
