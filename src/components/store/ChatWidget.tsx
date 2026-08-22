"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "¡Hola! 👋 Soy el asistente de COMECSA. Pregúntame por productos, precios o disponibilidad." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const nextMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-10) }),
      });
      const data = await res.json();
      if (res.status === 503) {
        setUnavailable(true);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Error");
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Se me cruzaron los cables 😅. Intenta de nuevo o escríbenos por WhatsApp." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (unavailable) return null;

  return (
    <>
      {open && (
        <div className="fixed bottom-40 right-5 z-50 flex h-[28rem] w-80 max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-brand-600 px-4 py-3">
            <p className="font-display font-bold text-white">🤖 Asistente COMECSA</p>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">✕</button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user" ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-900"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-ink-100 px-3 py-2 text-sm text-ink-700">Escribiendo...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex gap-2 border-t border-ink-200 p-3">
            <input
              className="input flex-1"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Escribe tu pregunta..."
              disabled={loading}
            />
            <button onClick={send} disabled={loading} className="btn-primary px-3">➤</button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir chat"
        className="fixed bottom-24 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-xl text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700"
      >
        {open ? "✕" : "🤖"}
      </button>
    </>
  );
}
