import { supabase } from "@/integrations/supabase/client";

const urlCache = new Map<string, { url: string; expires: number }>();

export async function signedUrl(path: string, expiresIn = 3600): Promise<string> {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const cached = urlCache.get(path);
  if (cached && cached.expires > Date.now()) return cached.url;
  const { data } = await supabase.storage.from("media").createSignedUrl(path, expiresIn);
  const url = data?.signedUrl ?? "";
  if (url) urlCache.set(path, { url, expires: Date.now() + (expiresIn - 60) * 1000 });
  return url;
}

export async function signedUrls(paths: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  await Promise.all(paths.map(async (p) => { out[p] = await signedUrl(p); }));
  return out;
}

// ---------- Media processing helpers (browser) ----------

async function canvasToBlob(canvas: HTMLCanvasElement, type = "image/jpeg", quality = 0.85): Promise<Blob> {
  return await new Promise((resolve, reject) => {
    canvas.toBlob((b) => b ? resolve(b) : reject(new Error("toBlob failed")), type, quality);
  });
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawContain(img: HTMLImageElement | HTMLVideoElement, maxW: number, maxH: number): HTMLCanvasElement {
  const iw = (img as HTMLImageElement).naturalWidth || (img as HTMLVideoElement).videoWidth;
  const ih = (img as HTMLImageElement).naturalHeight || (img as HTMLVideoElement).videoHeight;
  const scale = Math.min(1, maxW / iw, maxH / ih);
  const w = Math.max(1, Math.round(iw * scale));
  const h = Math.max(1, Math.round(ih * scale));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  c.getContext("2d")!.drawImage(img, 0, 0, w, h);
  return c;
}

function drawSquareCover(img: HTMLImageElement | HTMLVideoElement, size: number): HTMLCanvasElement {
  const iw = (img as HTMLImageElement).naturalWidth || (img as HTMLVideoElement).videoWidth;
  const ih = (img as HTMLImageElement).naturalHeight || (img as HTMLVideoElement).videoHeight;
  const s = Math.min(iw, ih);
  const sx = (iw - s) / 2;
  const sy = (ih - s) / 2;
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  c.getContext("2d")!.drawImage(img, sx, sy, s, s, 0, 0, size, size);
  return c;
}

export type ImageVariants = { optimised: Blob; thumbnail: Blob; ext: string; contentType: string };

export async function makeImageVariants(file: File): Promise<ImageVariants> {
  let source: Blob = file;
  const type = (file.type || "").toLowerCase();
  const name = file.name.toLowerCase();
  if (type.includes("heic") || type.includes("heif") || name.endsWith(".heic") || name.endsWith(".heif")) {
    const heic2any = (await import("heic2any")).default;
    const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
    source = Array.isArray(converted) ? converted[0] : converted;
  }
  const url = URL.createObjectURL(source);
  try {
    const img = await loadImage(url);
    const optimised = await canvasToBlob(drawContain(img, 1920, 1920), "image/jpeg", 0.85);
    const thumbnail = await canvasToBlob(drawSquareCover(img, 640), "image/jpeg", 0.8);
    return { optimised, thumbnail, ext: "jpg", contentType: "image/jpeg" };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function captureVideoPoster(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = url;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => {
        const t = Math.min(0.5, (video.duration || 1) / 2);
        video.currentTime = isFinite(t) && t > 0 ? t : 0;
      };
      video.onseeked = () => resolve();
      video.onerror = () => reject(new Error("video load failed"));
      setTimeout(() => reject(new Error("video poster timeout")), 15000);
    });
    return await canvasToBlob(drawSquareCover(video, 640), "image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}
