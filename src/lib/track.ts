// Lightweight client-side visit tracker. Fires once per pathname change.
let lastPath = "";
let sessionId = "";

function getSession() {
  if (sessionId) return sessionId;
  try {
    const k = "ecoba_sid";
    let v = sessionStorage.getItem(k);
    if (!v) {
      v = crypto.randomUUID();
      sessionStorage.setItem(k, v);
    }
    sessionId = v;
  } catch {
    sessionId = Math.random().toString(36).slice(2);
  }
  return sessionId;
}

function deviceType() {
  const ua = navigator.userAgent.toLowerCase();
  if (/tablet|ipad/.test(ua)) return "tablet";
  if (/mobi|android|iphone/.test(ua)) return "mobile";
  return "desktop";
}

export function trackPageView(path: string) {
  if (typeof window === "undefined") return;
  if (path === lastPath) return;
  lastPath = path;
  const payload = {
    event_type: "page_view",
    path,
    referrer: document.referrer || null,
    session_id: getSession(),
    device_type: deviceType(),
  };
  try {
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    if (!navigator.sendBeacon || !navigator.sendBeacon("/api/public/track", blob)) {
      fetch("/api/public/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch { /* ignore */ }
}
