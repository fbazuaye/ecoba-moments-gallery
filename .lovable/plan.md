## Goal
Give admins control over which media appears on the Home page, so items can live in an album/gallery without showing on Home.

## Approach
Reuse the existing `featured` flag as the "Show on Home" signal (it's already on every media row, already toggleable at upload, and already surfaced in the admin media library). No schema change needed.

### Changes

1. **`src/routes/index.tsx` — Home "Fresh moments"**
   - Change the `home-latest` query to filter `.eq("featured", true)` (still ordered by `uploaded_at desc`, limit 12).
   - Result: only items explicitly marked "Show on Home" appear on the homepage. All other published media remain visible in `/gallery`, `/albums/*`, and `/videos`.

2. **`src/routes/admin.upload.tsx` — Uploader UI copy**
   - Rename the per-file star tooltip from "Feature on home / Unfeature" to "Show on Home / Hide from Home".
   - Add a one-line hint under the dropzone: "Tap the star on a file to show it on the Home page. Unstarred files appear only in the gallery/album."
   - No logic change — the star already writes `featured` on insert.

3. **`src/routes/admin.media.tsx` — Media library**
   - Ensure each row has a "Show on Home" toggle (star) that flips `featured` on the media row, with clear label. If the toggle already exists, just relabel; if not, add it next to the existing hide/delete actions.

4. **`src/routes/featured.tsx` — Rename for clarity (optional, small)**
   - Keep the route/path unchanged. Update the on-page heading from "Editors' picks" to "On the Home page" so admins understand Featured = Home. Skip if you'd rather keep Featured as a separate concept.

### What stays the same
- Gallery, Albums, Videos pages continue to list every `published` item regardless of `featured`.
- Album pages already scope by `album_id`, so unfeatured items in an album still show inside that album.
- AI assistant grounding continues to see all published media.

### Migration note
Existing rows currently have `featured = false` by default, so after this change the Home "Fresh moments" strip will be empty until admins star the items they want featured. I'll add a short empty-state on Home ("No featured moments yet — admins can star items in Upload or Media Library to show them here.") so it doesn't look broken.

## Question before I build
Do you want Option A (recommended) — reuse `featured` as "Show on Home" (one flag, simplest) — or Option B — add a separate `show_on_home` boolean so `featured` and Home visibility stay independent (two flags, more granular)?
