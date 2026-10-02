import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  Loader2,
} from "lucide-react";
import { getPdfJs } from "@/lib/pdfThumbnail";
import { cn, getFullMediaUrl } from "@/lib/utils";

export function PdfViewerModal({ open, pdfUrl, title = "Document.pdf", onClose }) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const canvasRef = useRef(null);
  const pdfDocRef = useRef(null);
  const renderTaskRef = useRef(null);

  const fullPdfUrl = getFullMediaUrl(pdfUrl);

  // Load PDF document on url change
  useEffect(() => {
    if (!open || !pdfUrl) return;

    let active = true;
    setLoading(true);
    setError(null);
    setCurrentPage(1);

    getPdfJs()
      .then((pdfjs) => {
        if (!pdfjs) throw new Error("PDF viewer engine unavailable");
        return pdfjs.getDocument({ url: fullPdfUrl, withCredentials: false }).promise;
      })
      .then((pdfDoc) => {
        if (!active) return;
        pdfDocRef.current = pdfDoc;
        setNumPages(pdfDoc.numPages);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.warn("[PdfViewer] Load failed:", err);
        setError("Could not load PDF document.");
        setLoading(false);
      });

    return () => {
      active = false;
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy?.();
        pdfDocRef.current = null;
      }
    };
  }, [open, pdfUrl, fullPdfUrl]);

  // Render current page onto canvas
  const renderPage = useCallback(
    async (pageNum, currentScale) => {
      const pdfDoc = pdfDocRef.current;
      const canvas = canvasRef.current;
      if (!pdfDoc || !canvas) return;

      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: currentScale });

        const ctx = canvas.getContext("2d");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        const renderContext = {
          canvasContext: ctx,
          viewport,
        };

        renderTaskRef.current = page.render(renderContext);
        await renderTaskRef.current.promise;
      } catch (err) {
        if (err?.name !== "RenderingCancelledException") {
          console.warn("[PdfViewer] Page render failed:", err);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!loading && pdfDocRef.current && numPages > 0) {
      renderPage(currentPage, scale);
    }
  }, [loading, currentPage, scale, numPages, renderPage]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        setCurrentPage((p) => Math.max(1, p - 1));
      }
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        setCurrentPage((p) => Math.min(numPages, p + 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, numPages, onClose]);

  if (!open || !pdfUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col bg-black/95 backdrop-blur-2xl text-white select-none animate-in fade-in duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header className="flex h-14 items-center justify-between px-4 border-b border-white/10 bg-zinc-950/80 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 pr-4">
          <div className="grid size-8.5 place-items-center rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 shrink-0">
            <FileText className="size-4.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-semibold text-white/90 truncate">{title}</h3>
            {numPages > 0 && (
              <p className="text-[10.5px] text-white/50 font-mono">
                {numPages} {numPages === 1 ? "page" : "pages"}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Zoom controls */}
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.6, s - 0.2))}
            title="Zoom out"
            className="grid size-8 place-items-center rounded-lg bg-white/10 hover:bg-white/20 text-white/80 transition-all active:scale-95"
          >
            <ZoomOut className="size-3.5" />
          </button>
          <span className="text-[11px] font-mono text-white/60 px-1 min-w-[40px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(3.0, s + 0.2))}
            title="Zoom in"
            className="grid size-8 place-items-center rounded-lg bg-white/10 hover:bg-white/20 text-white/80 transition-all active:scale-95"
          >
            <ZoomIn className="size-3.5" />
          </button>

          <div className="h-4 w-px bg-white/15 mx-1" />

          {/* Download Original */}
          <a
            href={fullPdfUrl}
            download={title}
            target="_blank"
            rel="noopener noreferrer"
            title="Download PDF"
            className="grid size-8 place-items-center rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all active:scale-95 cursor-pointer"
          >
            <Download className="size-4" />
          </a>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close PDF viewer"
            className="grid size-8 place-items-center rounded-lg bg-white/15 hover:bg-white/25 text-white transition-all active:scale-95 ml-1"
          >
            <X className="size-4.5" />
          </button>
        </div>
      </header>

      {/* ── Main Canvas Scroll Container ─────────────────────────────────────── */}
      <div className="relative flex-1 overflow-auto p-4 flex items-center justify-center min-h-0 bg-zinc-950/60 scroll-slim">
        {loading && (
          <div className="flex flex-col items-center gap-3 text-white/60">
            <Loader2 className="size-8 animate-spin text-accent" />
            <span className="text-xs font-medium font-mono">Loading PDF pages...</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-3 text-center max-w-sm">
            <div className="grid size-12 place-items-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <FileText className="size-6" />
            </div>
            <p className="text-xs text-rose-300 font-medium">{error}</p>
            <a
              href={fullPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all"
            >
              Open directly in browser tab
            </a>
          </div>
        )}

        <div
          className={cn(
            "relative max-w-full flex items-center justify-center transition-opacity duration-200",
            loading || error ? "hidden" : "block"
          )}
        >
          <canvas
            ref={canvasRef}
            className="max-w-[95vw] shadow-2xl rounded-sm bg-white ring-1 ring-white/15"
          />
        </div>
      </div>

      {/* ── Bottom Page Navigator Bar ────────────────────────────────────────── */}
      {numPages > 1 && !loading && !error && (
        <footer className="flex h-12 items-center justify-center gap-3 border-t border-white/10 bg-zinc-950/90 shrink-0">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className={cn(
              "grid size-8 place-items-center rounded-lg bg-white/10 hover:bg-white/20 text-white/80 transition-all active:scale-95",
              currentPage <= 1 && "opacity-30 cursor-not-allowed hover:bg-white/10"
            )}
            title="Previous page"
          >
            <ChevronLeft className="size-4" />
          </button>

          <span className="text-xs font-mono text-white/80">
            Page <span className="font-semibold text-white">{currentPage}</span> of {numPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            disabled={currentPage >= numPages}
            className={cn(
              "grid size-8 place-items-center rounded-lg bg-white/10 hover:bg-white/20 text-white/80 transition-all active:scale-95",
              currentPage >= numPages && "opacity-30 cursor-not-allowed hover:bg-white/10"
            )}
            title="Next page"
          >
            <ChevronRight className="size-4" />
          </button>
        </footer>
      )}
    </div>
  );
}
