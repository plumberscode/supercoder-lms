"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { DisplayItem, DisplayTool } from "@/lib/seo/conversations";
import { QUICK_ACTIONS, TOOL_LABELS } from "@/lib/seo/labels";
import { renderAgentMarkdown } from "@/lib/seo/render-markdown";

type AssistantItem = Extract<DisplayItem, { role: "assistant" }>;

type StreamEvent =
  | { type: "conversation"; id: string }
  | { type: "text"; delta: string }
  | { type: "tool_start"; id: string; name: string; args: string }
  | { type: "tool_result"; id: string; name: string; ok: boolean; summary: string }
  | { type: "report_saved" | "draft_created"; id: string; title: string; href: string }
  | { type: "done" }
  | { type: "error"; message: string };

function ToolCard({ tool }: { tool: DisplayTool }) {
  const meta = TOOL_LABELS[tool.name] ?? { label: tool.name, icon: "🛠️" };
  let args = tool.args;
  try {
    args = JSON.stringify(JSON.parse(tool.args || "{}"), null, 2);
  } catch {
    // biarkan apa adanya
  }
  const running = tool.status === "running";

  return (
    <details className="rounded-lg border border-slate-200 bg-slate-50 text-xs">
      <summary className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none">
        <span>{meta.icon}</span>
        <span className="font-semibold text-slate-700">{meta.label}</span>
        <span className={`truncate ${tool.ok ? "text-slate-500" : "text-red-600"}`}>
          {running ? "sedang berjalan…" : tool.summary}
        </span>
        {running && <span className="ml-auto h-3 w-3 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />}
      </summary>
      <pre className="px-3 pb-3 whitespace-pre-wrap break-all text-slate-500">{args}</pre>
      {tool.event && (
        <div className="px-3 pb-3">
          <Link href={tool.event.href} className="font-semibold text-red-600 hover:underline">
            {tool.event.type === "report_saved" ? "📄 Buka laporan" : "✍️ Buka draft artikel"}: {tool.event.title}
          </Link>
        </div>
      )}
    </details>
  );
}

export default function SeoChat({
  conversationId,
  initialItems,
  configured,
}: {
  conversationId: string | null;
  initialItems: DisplayItem[];
  configured: { serp: boolean; gsc: boolean };
}) {
  const router = useRouter();
  const [items, setItems] = useState<DisplayItem[]>(initialItems);
  const [convId, setConvId] = useState<string | null>(conversationId);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Pindah percakapan lewat sidebar → muat ulang isi chat. Setelah percakapan baru dibuat,
  // prop berubah ke id yang sama dengan convId, jadi isi chat tidak di-reset.
  const [prevConversationId, setPrevConversationId] = useState(conversationId);
  if (conversationId !== prevConversationId) {
    setPrevConversationId(conversationId);
    if (conversationId !== convId) {
      setItems(initialItems);
      setConvId(conversationId);
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [items]);

  const updateAssistant = (fn: (item: AssistantItem) => AssistantItem) =>
    setItems((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role === "assistant") next[next.length - 1] = fn(last);
      return next;
    });

  const handleEvent = (event: StreamEvent) => {
    switch (event.type) {
      case "conversation":
        if (event.id !== convId) {
          setConvId(event.id);
          window.history.replaceState(null, "", `/admin/seo?c=${event.id}`);
        }
        break;
      case "text":
        updateAssistant((a) => ({ ...a, text: a.text + event.delta }));
        break;
      case "tool_start":
        updateAssistant((a) => ({
          ...a,
          tools: [...a.tools, { id: event.id, name: event.name, args: event.args, ok: true, summary: "", status: "running" }],
        }));
        break;
      case "tool_result":
        updateAssistant((a) => ({
          ...a,
          tools: a.tools.map((t) =>
            t.id === event.id ? { ...t, ok: event.ok, summary: event.summary, status: "done" } : t,
          ),
        }));
        break;
      case "report_saved":
      case "draft_created":
        updateAssistant((a) => {
          const tools = [...a.tools];
          const last = tools[tools.length - 1];
          if (last) tools[tools.length - 1] = { ...last, event: { ...event } };
          return { ...a, tools };
        });
        break;
      case "error":
        updateAssistant((a) => ({ ...a, text: `${a.text}\n\n⚠️ ${event.message}` }));
        break;
    }
  };

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setBusy(true);
    setInput("");
    setItems((prev) => [...prev, { role: "user", text: message }, { role: "assistant", text: "", tools: [] }]);

    try {
      const res = await fetch("/api/admin/seo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId, message }),
      });
      if (!res.ok || !res.body) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? `Gagal (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.trim()) handleEvent(JSON.parse(line) as StreamEvent);
        }
      }
      if (buffer.trim()) handleEvent(JSON.parse(buffer) as StreamEvent);
    } catch (e) {
      handleEvent({ type: "error", message: e instanceof Error ? e.message : "Koneksi terputus." });
    } finally {
      setBusy(false);
      router.refresh(); // perbarui daftar percakapan
    }
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white h-[calc(100vh-260px)] min-h-[480px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {items.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm mb-4">Mulai dari salah satu tugas ini, atau ketik pertanyaanmu sendiri.</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
              {QUICK_ACTIONS.map((q) => {
                const missing = q.needs && !configured[q.needs];
                return (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => send(q.prompt)}
                    disabled={busy}
                    title={missing ? `Sumber data ${q.needs?.toUpperCase()} belum aktif: hasil akan terbatas.` : q.prompt}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-red-50 hover:border-red-200 text-sm text-slate-700 disabled:opacity-50 cursor-pointer"
                  >
                    {q.label}
                    {missing && <span className="ml-1 text-amber-600">*</span>}
                  </button>
                );
              })}
            </div>
            {(!configured.serp || !configured.gsc) && (
              <p className="text-xs text-amber-700 mt-3">
                * Butuh sumber data yang belum aktif.{" "}
                <Link href="/admin/seo/settings" className="underline">Lihat pengaturan</Link>
              </p>
            )}
          </div>
        )}

        {items.map((item, i) =>
          item.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-red-600 text-white px-4 py-2 text-sm whitespace-pre-wrap">
                {item.text}
              </div>
            </div>
          ) : (
            <div key={i} className="max-w-[92%] space-y-2">
              {item.tools.length > 0 && (
                <div className="space-y-1">
                  {item.tools.map((t) => (
                    <ToolCard key={t.id} tool={t} />
                  ))}
                </div>
              )}
              {item.text ? (
                <div
                  className="prose prose-sm prose-slate max-w-none rounded-2xl rounded-bl-sm bg-slate-50 border border-slate-100 px-4 py-3 prose-table:text-xs prose-a:text-red-600"
                  dangerouslySetInnerHTML={{ __html: renderAgentMarkdown(item.text) }}
                />
              ) : (
                busy &&
                i === items.length - 1 && <div className="text-sm text-slate-400 animate-pulse">Agent sedang bekerja…</div>
              )}
            </div>
          ),
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-slate-200 p-3 flex gap-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={2}
          placeholder="Tanya agent SEO… (Enter untuk kirim, Shift+Enter baris baru)"
          className="flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
        >
          {busy ? "…" : "Kirim"}
        </button>
      </form>
    </div>
  );
}
