import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { makeImageVariants, captureVideoPoster } from "@/lib/media-utils";
import { Upload, X, CheckCircle2, AlertCircle, Loader2, Star } from "lucide-react";

export const Route = createFileRoute("/admin/upload")({ component: UploadPage });

type Row = {
  file: File;
  preview: string;
  status: "pending" | "processing" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
  id?: string;
  featured: boolean;
};

const DAYS = [
  { id: "10000000-0000-0000-0000-000000000001", label: "Friday, 17 July" },
  { id: "10000000-0000-0000-0000-000000000002", label: "Saturday, 18 July" },
  { id: "10000000-0000-0000-0000-000000000003", label: "Sunday, 19 July" },
];

function UploadPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [dayId, setDayId] = useState(DAYS[0].id);
  const [albumId, setAlbumId] = useState<string>("");
  const [photographer, setPhotographer] = useState("");
  const [tags, setTags] = useState("");
  const [albums, setAlbums] = useState<{ id: string; title: string; event_day_id: string | null }[]>([]);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    supabase.from("albums").select("id,title,event_day_id").order("display_order")
      .then(({ data }) => setAlbums(data ?? []));
  }, []);

  useEffect(() => () => { rows.forEach((r) => r.preview && URL.revokeObjectURL(r.preview)); }, [rows]);

  function addFiles(files: FileList | File[]) {
    const list = Array.from(files);
    setRows((r) => [...r, ...list.map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
      status: "pending" as const,
      progress: 0,
      featured: false,
    }))]);
  }

  async function uploadAll() {
    if (!user || rows.length === 0) return;
    setBusy(true);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].status === "done") continue;
      await uploadOne(i);
    }
    setBusy(false);
  }

  function patch(i: number, p: Partial<Row>) {
    setRows((r) => r.map((x, j) => j === i ? { ...x, ...p } : x));
  }

  async function uploadOne(i: number) {
    if (!user) return;
    const row = rows[i];
    patch(i, { status: "processing", progress: 5, error: undefined });
    try {
      const isVideo = row.file.type.startsWith("video/");
      const uid = crypto.randomUUID();
      let originalPath = "";
      let optimisedPath = "";
      let thumbnailPath = "";

      if (isVideo) {
        // Upload original video
        const ext = (row.file.name.split(".").pop() || "mp4").toLowerCase();
        originalPath = `${dayId}/${uid}.${ext}`;
        patch(i, { status: "uploading", progress: 15 });
        const up1 = await supabase.storage.from("media").upload(originalPath, row.file, {
          cacheControl: "3600", upsert: false, contentType: row.file.type || "video/mp4",
        });
        if (up1.error) throw up1.error;
        optimisedPath = originalPath;

        // Try poster; if it fails, continue without thumbnail
        try {
          patch(i, { progress: 60 });
          const poster = await captureVideoPoster(row.file);
          thumbnailPath = `${dayId}/${uid}.poster.jpg`;
          const up2 = await supabase.storage.from("media").upload(thumbnailPath, poster, {
            cacheControl: "3600", upsert: false, contentType: "image/jpeg",
          });
          if (up2.error) throw up2.error;
        } catch {
          thumbnailPath = "";
        }
      } else {
        patch(i, { progress: 20 });
        const variants = await makeImageVariants(row.file);
        patch(i, { status: "uploading", progress: 40 });

        originalPath = `${dayId}/${uid}.original.${variants.ext}`;
        optimisedPath = `${dayId}/${uid}.${variants.ext}`;
        thumbnailPath = `${dayId}/${uid}.thumb.${variants.ext}`;

        // Store the (converted) optimised as "original" too when source is HEIC — saves cost.
        const isHeic = /heic|heif$/i.test(row.file.name) || /heic|heif/i.test(row.file.type);
        const originalBlob: Blob = isHeic ? variants.optimised : row.file;
        const originalCT = isHeic ? "image/jpeg" : (row.file.type || variants.contentType);

        const [u1, u2, u3] = await Promise.all([
          supabase.storage.from("media").upload(originalPath, originalBlob, { cacheControl: "3600", contentType: originalCT }),
          supabase.storage.from("media").upload(optimisedPath, variants.optimised, { cacheControl: "3600", contentType: variants.contentType }),
          supabase.storage.from("media").upload(thumbnailPath, variants.thumbnail, { cacheControl: "3600", contentType: variants.contentType }),
        ]);
        if (u1.error) throw u1.error;
        if (u2.error) throw u2.error;
        if (u3.error) throw u3.error;
      }

      patch(i, { progress: 85 });
      const { data: inserted, error: dbErr } = await supabase.from("media").insert({
        event_id: "00000000-0000-0000-0000-000000000001",
        event_day_id: dayId,
        album_id: albumId || null,
        media_type: isVideo ? "video" : "photo",
        original_url: originalPath,
        thumbnail_url: thumbnailPath || null,
        optimised_url: optimisedPath,
        title: row.file.name,
        photographer: photographer || null,
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        uploaded_by: user.id,
        file_size: row.file.size,
        status: "published",
        featured: row.featured,
      }).select("id").single();
      if (dbErr) throw dbErr;

      patch(i, { status: "done", progress: 100, id: inserted?.id });
    } catch (e: unknown) {
      patch(i, { status: "error", error: e instanceof Error ? e.message : "Upload failed" });
    }
  }

  const filteredAlbums = albums.filter((a) => !a.event_day_id || a.event_day_id === dayId);
  const pendingCount = rows.filter((r) => r.status !== "done").length;

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-gold">Admin</div>
        <h1 className="font-display text-3xl">Upload Media</h1>
        <p className="text-sm text-muted-foreground">Photos are auto-optimised. Videos get an auto-generated cover. iPhone HEIC files are converted to JPEG.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <label
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files) addFiles(e.dataTransfer.files); }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition ${
              drag ? "border-gold bg-gold/10" : "border-border bg-card hover:border-gold/50"
            }`}>
            <Upload className="mb-3 h-10 w-10 text-primary" />
            <div className="font-semibold">Drop files or click to select</div>
            <div className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP, HEIC · MP4, MOV, WebM · multiple files supported</div>
            <div className="mt-2 text-[11px] text-gold">Tap the ★ on a file to show it on the Home page. Unstarred files appear only in the gallery/album.</div>
            <input type="file" multiple accept="image/*,video/*,.heic,.heif" className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)} />
          </label>

          {rows.length > 0 && (
            <div className="mt-4 space-y-2">
              {rows.map((r, i) => {
                const isVideo = r.file.type.startsWith("video/");
                return (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                    <div className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded bg-muted">
                      {isVideo
                        ? <video src={r.preview} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                        : <img src={r.preview} alt="" className="h-full w-full object-cover" />}
                      <div className="absolute inset-0 grid place-items-center bg-black/20">
                        {r.status === "done" ? <CheckCircle2 className="h-5 w-5 text-white drop-shadow" /> :
                          r.status === "error" ? <AlertCircle className="h-5 w-5 text-white drop-shadow" /> :
                          r.status === "uploading" || r.status === "processing" ? <Loader2 className="h-5 w-5 animate-spin text-white drop-shadow" /> :
                          null}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">{r.file.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {(r.file.size / (1024 * 1024)).toFixed(1)} MB · {isVideo ? "video" : "photo"}
                        {r.status === "processing" && " · optimising"}
                        {r.status === "uploading" && " · uploading"}
                      </div>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full transition-all ${r.status === "error" ? "bg-destructive" : "bg-primary"}`}
                          style={{ width: `${r.progress}%` }} />
                      </div>
                      {r.error && <div className="mt-1 text-[10px] text-destructive">{r.error}</div>}
                    </div>
                    <button
                      onClick={() => patch(i, { featured: !r.featured })}
                      title={r.featured ? "Hide from Home" : "Show on Home"}
                      className={`rounded-full p-1.5 ${r.featured ? "bg-gold text-forest" : "text-muted-foreground hover:text-gold"}`}>
                      <Star className="h-4 w-4" fill={r.featured ? "currentColor" : "none"} />
                    </button>
                    <button onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                      className="rounded p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                  </div>
                );
              })}
              <button onClick={uploadAll} disabled={busy || pendingCount === 0}
                className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                {busy ? "Uploading…" : `Upload ${pendingCount} file(s)`}
              </button>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Metadata</div>
            <div className="mt-3 space-y-3">
              <label className="block">
                <div className="mb-1 text-xs font-medium">Event Day</div>
                <select value={dayId} onChange={(e) => { setDayId(e.target.value); setAlbumId(""); }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  {DAYS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
              </label>
              <label className="block">
                <div className="mb-1 text-xs font-medium">Album</div>
                <select value={albumId} onChange={(e) => setAlbumId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <option value="">— No album —</option>
                  {filteredAlbums.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
                </select>
              </label>
              <label className="block">
                <div className="mb-1 text-xs font-medium">Photographer</div>
                <input value={photographer} onChange={(e) => setPhotographer(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <div className="mb-1 text-xs font-medium">Tags (comma separated)</div>
                <input value={tags} onChange={(e) => setTags(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </label>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
