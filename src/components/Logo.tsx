import ecobaLogo from "@/assets/ecoba-logo.png";

export function Logo({ className = "h-10 w-10", showText = false }: { className?: string; showText?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img src={ecobaLogo} alt="ECOBA official crest" className={className + " object-contain"} />
      {showText && (
        <div className="leading-tight">
          <div className="font-display text-lg font-semibold tracking-tight">ECOBA MOMENTS</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Bridging Memories</div>
        </div>
      )}
    </div>
  );
}
