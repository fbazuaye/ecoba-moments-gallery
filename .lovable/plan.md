## Focus: Admin uploads & media pipeline + gallery playback polish

You didn't specify, so I'm picking the area with the highest user-visible impact right now: making uploads reliable and making photos/videos look and play great in the grid and lightbox.

### What I'll change

1. **Real video posters (server-side, one-time)**
   - On upload of a video, capture the first frame in the browser via a hidden `<video>` + `<canvas>`, upload it as a JPEG to the `media` bucket, and save its path in `media.thumbnail_url`.
   - Gallery/home/lightbox will then show a real cover image instead of the `#t=0.5` hack.

2. **Image thumbnails**
   - Generate a max-1600px WebP "optimised" and a 480px square-cover "thumbnail" client-side during upload (Canvas API), store both, and save paths in `optimised_url` / `thumbnail_url`.
   - Grid uses the small thumbnail (fast scroll), lightbox uses the optimised full image.

3. **Upload UX**
   - Real progress % (XHR-based upload wrapper around Supabase Storage signed uploads).
   - Per-file preview tile before upload.
   - Better error surfacing (size, mime, storage errors).
   - "Feature on home" toggle per file.

4. **Grid & lightbox alignment/playback**
   - Uniform aspect (`aspect-square` on grid, `object-cover`) already there — verify photos and videos share identical framing.
   - Lightbox video: keep autoplay+inline, add poster from `thumbnail_url`, add loading spinner until `canplay`, add tap-to-pause and keyboard `Space`/`←`/`→` nav.
   - Preload next/prev media for smoother swiping.

5. **HEIC handling**
   - Detect `image/heic|heif` and convert to JPEG in the browser (`heic2any`) before upload so iPhone photos actually display.

### Files touched

- `src/routes/admin.upload.tsx` — thumbnail/poster generation, progress, HEIC, feature toggle.
- `src/lib/media-utils.ts` — small helpers: `makeImageVariants(file)`, `captureVideoPoster(file)`.
- `src/components/MediaGrid.tsx` — use `thumbnail_url` when present; drop `#t=0.5` fallback once posters exist (keep as last-resort).
- `src/components/Lightbox.tsx` — poster, spinner, keyboard nav, preloading.
- `package.json` — add `heic2any`.

### Out of scope for this pass

AI enhancements, PWA/offline, SEO metadata polish, admin bulk-edit/reorder. Happy to take any of those next.

Approve and I'll implement.