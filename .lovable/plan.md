## Goal
Turn the Home page "Fresh moments" section into a horizontally scrolling carousel of featured photos and videos, instead of the current static grid.

## Changes

1. **`src/routes/index.tsx`** — Replace the `<MediaGrid>` in the "Fresh moments" section with a new horizontal scroller:
   - Rename the section heading to "Featured Photos & Videos" (keep the small "On the Home page" eyebrow).
   - Query stays the same (`featured = true`, `status = published`, ordered by `uploaded_at desc`, limit 12).
   - Render items in a horizontally scrolling row (`overflow-x-auto`, `snap-x snap-mandatory`, hidden scrollbar). Each tile is a fixed width (`w-64 md:w-72`), aspect `4/5` or `square`, rounded, with hover lift.
   - Add left/right chevron buttons (desktop only) that scroll the container by one tile width. On mobile, users swipe.
   - Clicking a tile still opens the existing `Lightbox` at the correct index.

2. **New component `src/components/FeaturedCarousel.tsx`** — Encapsulates the scroller, arrow controls, and tile rendering (photo `<img>` with signed URL, video with poster/first-frame + play badge, featured star). Reuses `signedUrl` from `@/lib/media-utils` and the same tile visuals as `MediaGrid` so styling stays consistent.

3. **No changes** to the database, queries, admin uploader, or the `featured` flag semantics. Gallery, Albums, Videos pages are untouched.

## Notes
- Uses only CSS scroll-snap + a `ref.scrollBy()` for arrows — no new dependency.
- If there are 0 featured items, the existing empty-state message stays.
