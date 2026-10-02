// PDF Page 1 Thumbnail Renderer & Cache
// Uses PDF.js to render a static image of page 1 for any PDF File or URL.

const thumbnailCache = new Map();
let pdfjsLibPromise = null;

export async function getPdfJs() {
  if (typeof window === "undefined") return null;
  if (window.pdfjsLib) return window.pdfjsLib;

  if (!pdfjsLibPromise) {
    pdfjsLibPromise = new Promise((resolve) => {
      // 1. Check if script tag is already in DOM
      const existingScript = document.getElementById("pdfjs-cdn-script");
      if (existingScript && window.pdfjsLib) {
        return resolve(window.pdfjsLib);
      }

      // 2. Load PDF.js via script tag for maximum compatibility across browsers
      const script = document.createElement("script");
      script.id = "pdfjs-cdn-script";
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          resolve(window.pdfjsLib);
        } else {
          resolve(null);
        }
      };
      script.onerror = () => {
        console.warn("[PDF.js] Failed to load PDF.js from CDN script tag.");
        resolve(null);
      };
      document.head.appendChild(script);
    });
  }

  return pdfjsLibPromise;
}

export async function renderPdfPage1Thumbnail(source, targetWidth = 480) {
  if (!source) return null;

  // Check memory cache
  const cacheKey = typeof source === "string" ? source : `${source.name}-${source.size}-${source.lastModified}`;
  if (thumbnailCache.has(cacheKey)) {
    return thumbnailCache.get(cacheKey);
  }

  try {
    const pdfjs = await getPdfJs();
    if (!pdfjs) return null;

    let dataInput;
    if (source instanceof File || source instanceof Blob) {
      const buffer = await source.arrayBuffer();
      dataInput = { data: buffer };
    } else {
      dataInput = { url: source };
    }

    const loadingTask = pdfjs.getDocument(dataInput);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const unscaledViewport = page.getViewport({ scale: 1 });
    const scale = targetWidth / unscaledViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    thumbnailCache.set(cacheKey, dataUrl);
    return dataUrl;
  } catch (err) {
    console.warn("[PdfThumbnail] Could not generate page-1 thumbnail:", err);
    return null;
  }
}
