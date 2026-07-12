import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QrCode as QrIcon } from "lucide-react";

export const Route = createFileRoute("/admin/qr")({ component: QrPage });

function QrPage() {
  const [url, setUrl] = useState("");
  useEffect(() => { setUrl(window.location.origin); }, []);
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&color=07583F&bgcolor=FFFDF7&margin=20&data=${encodeURIComponent(url)}`;

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-gold">Admin</div>
        <h1 className="font-display text-3xl">Event QR Code</h1>
        <p className="text-sm text-muted-foreground">Print or project this QR code so guests can instantly open ECOBA MOMENTS.</p>
      </div>
      <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-elegant">
        <div className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gold"><QrIcon className="h-3.5 w-3.5" /> Scan to view</div>
        <h2 className="font-display text-xl">ECOBA MOMENTS</h2>
        <div className="text-xs text-muted-foreground">NEC Meeting 2026 · Warri</div>
        {url && <img src={qr} alt="Event QR" className="mx-auto my-6 aspect-square w-full max-w-xs rounded-xl border border-border" />}
        <div className="break-all text-xs text-muted-foreground">{url}</div>
        <a href={qr} download="ecoba-moments-qr.png"
          className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Download QR</a>
      </div>
    </div>
  );
}
