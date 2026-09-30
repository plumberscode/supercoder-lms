import OpenAI from "openai";
import { requireBlogAdmin } from "@/lib/blog/auth";
import { runSeoAgent, type AgentEvent } from "@/lib/seo/agent";
import { loadMessages, saveMessages, type StoredMessage } from "@/lib/seo/conversations";
import { buildSystemPrompt } from "@/lib/seo/prompt";
import { providerStatus } from "@/lib/seo/providers";
import { getSeoSettings } from "@/lib/seo/settings";

// Riset (crawl, PageSpeed, SERP) bisa makan waktu beberapa menit
export const maxDuration = 300;

type StreamEvent = AgentEvent | { type: "conversation"; id: string } | { type: "done" } | { type: "error"; message: string };

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export async function POST(request: Request) {
  let admin: Awaited<ReturnType<typeof requireBlogAdmin>>;
  try {
    admin = await requireBlogAdmin();
  } catch {
    return json({ error: "Hanya admin yang dapat memakai SEO Agent." }, 403);
  }
  const { supabase, user } = admin;

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return json({ error: "DEEPSEEK_API_KEY belum diisi." }, 500);

  const body = (await request.json().catch(() => null)) as { conversationId?: string; message?: string } | null;
  const message = body?.message?.trim();
  if (!message) return json({ error: "Pesan kosong." }, 400);
  if (message.length > 4000) return json({ error: "Pesan terlalu panjang (maks 4000 karakter)." }, 400);

  let conversationId = body?.conversationId ?? null;
  let history: StoredMessage[] = [];
  if (conversationId) {
    try {
      history = await loadMessages(supabase, conversationId);
    } catch (e) {
      return json({ error: e instanceof Error ? e.message : "Gagal memuat percakapan." }, 500);
    }
  } else {
    const { data, error } = await supabase
      .from("seo_conversations")
      .insert({ title: message.slice(0, 80), created_by: user.id })
      .select("id")
      .single();
    if (error) {
      return json({ error: `${error.message}. Pastikan migration_seo_agent.sql sudah dijalankan.` }, 500);
    }
    conversationId = data.id as string;
  }

  const [settings, { data: posts }] = await Promise.all([
    getSeoSettings(supabase),
    supabase
      .from("blog_posts")
      .select("title, slug")
      .eq("is_published", true)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(100),
  ]);

  const system = buildSystemPrompt({
    settings,
    posts: posts ?? [],
    providers: providerStatus(),
    today: new Date().toLocaleDateString("id-ID", { dateStyle: "full", timeZone: "Asia/Makassar" }),
  });

  const client = new OpenAI({ baseURL: "https://api.deepseek.com", apiKey });
  const userMessage: StoredMessage = { role: "user", content: message };
  const convId = conversationId;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const send = (event: StreamEvent) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          open = false; // klien menutup koneksi; agent tetap selesai & tersimpan
        }
      };

      send({ type: "conversation", id: convId });
      let created: StoredMessage[] = [];
      try {
        created = await runSeoAgent({
          stream: (params) =>
            client.chat.completions.create({ model: "deepseek-chat", stream: true, temperature: 0.3, ...params }),
          system,
          history: [...history, userMessage],
          ctx: { supabase, userId: user.id, conversationId: convId, settings, collected: [] },
          emit: send,
        });
        send({ type: "done" });
      } catch (e) {
        console.error("seo agent:", e);
        send({ type: "error", message: e instanceof Error ? e.message : "Agent gagal." });
      } finally {
        try {
          await saveMessages(supabase, convId, [userMessage, ...created]);
        } catch (e) {
          console.error("seo agent: gagal menyimpan pesan", e);
        }
        if (open) controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
