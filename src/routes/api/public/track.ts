import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/track")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({}));
          const path = typeof body?.path === "string" ? body.path.slice(0, 512) : "/";
          const referrer = typeof body?.referrer === "string" ? body.referrer.slice(0, 512) : null;
          const session_id = typeof body?.session_id === "string" ? body.session_id.slice(0, 64) : null;
          const device_type = typeof body?.device_type === "string" ? body.device_type.slice(0, 32) : null;
          const event_type = typeof body?.event_type === "string" ? body.event_type.slice(0, 64) : "page_view";

          const h = request.headers;
          const country = h.get("cf-ipcountry") || h.get("x-vercel-ip-country") || null;
          const country_code = country;
          const region = h.get("cf-region") || h.get("x-vercel-ip-country-region") || null;
          const city = h.get("cf-ipcity") || h.get("x-vercel-ip-city") || null;
          const latStr = h.get("cf-iplatitude") || h.get("x-vercel-ip-latitude");
          const lonStr = h.get("cf-iplongitude") || h.get("x-vercel-ip-longitude");
          const latitude = latStr ? Number(latStr) : null;
          const longitude = lonStr ? Number(lonStr) : null;
          const user_agent = (h.get("user-agent") || "").slice(0, 512) || null;

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.from("analytics_events").insert({
            event_type,
            path,
            referrer,
            session_id,
            device_type,
            country: country ? decodeURIComponent(country) : null,
            country_code,
            region: region ? decodeURIComponent(region) : null,
            city: city ? decodeURIComponent(city) : null,
            latitude: Number.isFinite(latitude as number) ? latitude : null,
            longitude: Number.isFinite(longitude as number) ? longitude : null,
            user_agent,
          });

          return Response.json({ ok: true });
        } catch (e) {
          return Response.json({ ok: false, error: (e as Error).message }, { status: 200 });
        }
      },
    },
  },
});
