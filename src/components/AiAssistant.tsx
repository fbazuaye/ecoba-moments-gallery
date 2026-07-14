import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, Send, X, Loader2, RotateCcw } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string; links?: { label: string; to: string }[] };

const SUGGESTIONS = [
  "Show me pictures from the Gala Night",
  "What time did the NEC meeting start?",
  "Photos from the royal courtesy visit",
  "How many photos have been uploaded?",
];

export function AiAssistant({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([{
    role: "assistant",
    content: "Welcome to Ask ECOBA AI. I can help you navigate the ECOBA NEC Meeting 2026 gallery, programme, and albums. What would you like to see?",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { listRef.current?.scrollTo(0, listRef.current.scrollHeight); }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
      });
      const data = await res.json();
      setMessages([...next, {
        role: "assistant",
        content: data.reply ?? "I'm not sure. Try browsing the Gallery.",
        links: data.links ?? [],
      }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Sorry, I couldn't reach the assistant. Please try again." }]);
    } finally { setLoading(false); }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gold-gradient text-forest"><Sparkles className="h-4 w-4" /></div>
          <div>
            <div className="font-display text-base font-semibold">Ask ECOBA AI</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Your event concierge</div>
          </div>
        </div>
        <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted" aria-label="Close AI"><X className="h-4 w-4" /></button>
      </div>

      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "ml-8 text-right" : "mr-4"}>
            <div className={`inline-block max-w-full rounded-2xl px-4 py-2.5 text-sm ${
              m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              {m.links && m.links.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {m.links.map((l, j) => (
                    <Link key={j} to={l.to} className="rounded-full bg-gold/20 px-3 py-1 text-xs font-medium text-forest hover:bg-gold/30">
                      {l.label} →
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Thinking…</div>}
        {messages.length === 1 && (
          <div className="space-y-2 pt-2">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Try asking</div>
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)}
                className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-sm hover:border-gold/50 hover:bg-gold/5">
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex items-center gap-2 border-t border-border p-3">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about photos, programme, albums…"
          className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30" />
        <button type="submit" disabled={loading || !input.trim()}
          className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
