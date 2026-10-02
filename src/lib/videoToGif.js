// Client-side Video to GIF conversion utility
// Samples frames from an HTML5 video and encodes them into an animated GIF Blob/File.

function createGifHeader(width, height) {
  const header = [
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, // "GIF89a"
    width & 0xff, (width >> 8) & 0xff,
    height & 0xff, (height >> 8) & 0xff,
    0xf7, // Global color table flag (256 colors)
    0x00, // Background color index
    0x00  // Pixel aspect ratio
  ];
  return header;
}

// Generate simple 256-color palette (RGB 3:3:2)
function generateColorPalette() {
  const palette = new Uint8Array(256 * 3);
  let idx = 0;
  for (let r = 0; r < 8; r++) {
    for (let g = 0; g < 8; g++) {
      for (let b = 0; b < 4; b++) {
        palette[idx++] = Math.round((r / 7) * 255);
        palette[idx++] = Math.round((g / 7) * 255);
        palette[idx++] = Math.round((b / 3) * 255);
      }
    }
  }
  return palette;
}

function quantizePixel(r, g, b) {
  const rIdx = Math.round((r / 255) * 7);
  const gIdx = Math.round((g / 255) * 7);
  const bIdx = Math.round((b / 255) * 3);
  return (rIdx << 5) | (gIdx << 2) | bIdx;
}

// Simple LZW encoder for GIF image data
function lzwEncode(minCodeSize, indexedPixels) {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;

  const output = [];
  let curAccum = 0;
  let curBits = 0;

  function writeBits(code, length) {
    curAccum |= code << curBits;
    curBits += length;
    while (curBits >= 8) {
      output.push(curAccum & 0xff);
      curAccum >>= 8;
      curBits -= 8;
    }
  }

  writeBits(clearCode, codeSize);

  let prefix = "";
  const codeTable = new Map();

  for (let i = 0; i < indexedPixels.length; i++) {
    const k = indexedPixels[i];
    const key = prefix === "" ? `${k}` : `${prefix},${k}`;

    if (codeTable.has(key)) {
      prefix = key;
    } else {
      const code = prefix === "" ? k : codeTable.get(prefix);
      writeBits(code, codeSize);

      if (nextCode < 4096) {
        codeTable.set(key, nextCode++);
        if (nextCode > (1 << codeSize) && codeSize < 12) {
          codeSize++;
        }
      } else {
        writeBits(clearCode, codeSize);
        codeTable.clear();
        codeSize = minCodeSize + 1;
        nextCode = eoiCode + 1;
      }
      prefix = `${k}`;
    }
  }

  if (prefix !== "") {
    const code = prefix.includes(",") ? codeTable.get(prefix) : parseInt(prefix, 10);
    writeBits(code, codeSize);
  }

  writeBits(eoiCode, codeSize);

  if (curBits > 0) {
    output.push(curAccum & 0xff);
  }

  // Pack into GIF blocks of max 255 bytes
  const blocks = [minCodeSize];
  let p = 0;
  while (p < output.length) {
    const chunkSize = Math.min(255, output.length - p);
    blocks.push(chunkSize);
    for (let j = 0; j < chunkSize; j++) {
      blocks.push(output[p + j]);
    }
    p += chunkSize;
  }
  blocks.push(0x00); // Block terminator

  return new Uint8Array(blocks);
}

export async function convertVideoToGifBlob(videoFile, { maxWidth = 320, fps = 10, maxDurationSec = 10, onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    const objectUrl = URL.createObjectURL(videoFile);
    video.src = objectUrl;

    video.onloadedmetadata = async () => {
      try {
        const duration = Math.min(video.duration || 3, maxDurationSec);
        const aspect = (video.videoHeight || 240) / (video.videoWidth || 320);
        const width = Math.min(maxWidth, video.videoWidth || 320);
        const height = Math.round(width * aspect);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        const totalFrames = Math.max(1, Math.floor(duration * fps));
        const frameInterval = duration / totalFrames;
        const delayHundredths = Math.round((100 / fps));

        const palette = generateColorPalette();
        const gifParts = [];

        // Header & Logical Screen Descriptor
        gifParts.push(new Uint8Array(createGifHeader(width, height)));
        gifParts.push(palette);

        // Netscape Application Extension for infinite looping
        const netscapeExt = new Uint8Array([
          0x21, 0xff, 0x0b,
          0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30, // "NETSCAPE2.0"
          0x03, 0x01, 0x00, 0x00, 0x00
        ]);
        gifParts.push(netscapeExt);

        for (let i = 0; i < totalFrames; i++) {
          const targetTime = i * frameInterval;
          await new Promise((res) => {
            const onSeeked = () => {
              video.removeEventListener("seeked", onSeeked);
              res();
            };
            video.addEventListener("seeked", onSeeked);
            video.currentTime = targetTime;
          });

          ctx.drawImage(video, 0, 0, width, height);
          const imgData = ctx.getImageData(0, 0, width, height).data;

          const indexed = new Uint8Array(width * height);
          let pIdx = 0;
          for (let p = 0; p < imgData.length; p += 4) {
            indexed[pIdx++] = quantizePixel(imgData[p], imgData[p + 1], imgData[p + 2]);
          }

          // Graphics Control Extension
          const gce = new Uint8Array([
            0x21, 0xf9, 0x04,
            0x00, // No transparency
            delayHundredths & 0xff, (delayHundredths >> 8) & 0xff, // Delay
            0x00, 0x00
          ]);
          gifParts.push(gce);

          // Image Descriptor
          const imgDesc = new Uint8Array([
            0x2c,
            0x00, 0x00, 0x00, 0x00, // Left, Top
            width & 0xff, (width >> 8) & 0xff,
            height & 0xff, (height >> 8) & 0xff,
            0x00 // Local color table flag: none
          ]);
          gifParts.push(imgDesc);

          // LZW Encoded Image Data
          const encoded = lzwEncode(8, indexed);
          gifParts.push(encoded);

          if (onProgress) {
            onProgress(Math.round(((i + 1) / totalFrames) * 100));
          }
        }

        // GIF Trailer
        gifParts.push(new Uint8Array([0x3b]));

        URL.revokeObjectURL(objectUrl);

        const gifBlob = new Blob(gifParts, { type: "image/gif" });
        const baseName = videoFile.name.replace(/\.[^/.]+$/, "");
        const gifFile = new File([gifBlob], `${baseName}.gif`, { type: "image/gif", lastModified: Date.now() });

        resolve(gifFile);
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    video.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
  });
}
