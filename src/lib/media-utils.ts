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
