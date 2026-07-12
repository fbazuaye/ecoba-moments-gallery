import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Upload, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/upload")({ component: UploadPage });

type Row = { file: File; status: "pending" | "uploading" | "done" | "error"; progress: number; error?: string; id?: string };

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

  function addFiles(files: FileList | File[]) {
    const list = Array.from(files);
    setRows((r) => [...r, ...list.map((f) => ({ file: f, status: "pending" as const, progress: 0 }))]);
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

  async function uploadOne(i: number) {
    const row = rows[i];
    setRows((r) => r.map((x, j) => j === i ? { ...x, status: "uploading", progress: 5 } : x));
    try {
      const isVideo = row.file.type.startsWith("video/");
      const ext = row.file.name.split(".").pop() ?? "bin";
      const path = `${dayId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("media").upload(path, row.file, {
        cacheControl: "3600", upsert: false, contentType: row.file.type,
      });
      if (upErr) throw upErr;
      setRows((r) => r.map((x, j) => j === i ? { ...x, progress: 70 } : x));

      const { data: inserted, error: dbErr } = await supabase.from("media").insert({
        event_id: "00000000-0000-0000-0000-000000000001",
        event_day_id: dayId,
        album_id: albumId || null,
        media_type: isVideo ? "video" : "photo",
        original_url: path,
        thumbnail_url: path,
        optimised_url: path,
        title: row.file.name,
        photographer: photographer || null,
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        uploaded_by: user.id,
        file_size: row.file.size,
        status: "published",
      }).select("id").single();
      if (dbErr) throw dbErr;

      setRows((r) => r.map((x, j) => j === i ? { ...x, status: "done", progress: 100, id: inserted?.id } : x));
    } catch (e: unknown) {
      setRows((r) => r.map((x, j) => j === i ? { ...x, status: "error", error: e instanceof Error ? e.message : "Upload failed" } : x));
    }
  }

  const filteredAlbums = albums.filter((a) => !a.event_day_id || a.event_day_id === dayId);

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-gold">Admin</div>
        <h1 className="font-display text-3xl">Upload Media</h1>
        <p className="text-sm text-muted-foreground">Upload photos and videos. Assign event day and album.</p>
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
            <input type="file" multiple accept="image/*,video/*" className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)} />
          </label>

          {rows.length > 0 && (
            <div className="mt-4 space-y-2">
              {rows.map((r, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded bg-muted">
                    {r.status === "done" ? <CheckCircle2 className="h-5 w-5 text-primary" /> :
                      r.status === "error" ? <AlertCircle className="h-5 w-5 text-destructive" /> :
                      r.status === "uploading" ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> :
                      <Upload className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{r.file.name}</div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full transition-all ${r.status === "error" ? "bg-destructive" : "bg-primary"}`}
                        style={{ width: `${r.progress}%` }} />
                    </div>
                    {r.error && <div className="mt-1 text-[10px] text-destructive">{r.error}</div>}
                  </div>
                  <button onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                    className="rounded p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                </div>
              ))}
              <button onClick={uploadAll} disabled={busy}
                className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                {busy ? "Uploading…" : `Upload ${rows.filter(r => r.status !== "done").length} file(s)`}
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
