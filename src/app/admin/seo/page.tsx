import Link from "next/link";
import { requireBlogAdminPage } from "@/lib/blog/auth";
import { loadMessages, toDisplayItems, type DisplayItem } from "@/lib/seo/conversations";
import { providerStatus } from "@/lib/seo/providers";
import { deleteConversation } from "./actions";
import ConfirmDeleteButton from "./ConfirmDeleteButton";
import SeoChat from "./SeoChat";
import SeoTabs from "./SeoTabs";

export const metadata = { title: "SEO Agent | Admin Supercoder" };

export default async function SeoAgentPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  const { supabase } = await requireBlogAdminPage();

  const { data: conversations, error } = await supabase
    .from("seo_conversations")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false })
    .limit(30);

  let items: DisplayItem[] = [];
  let activeId: string | null = null;
  if (c && conversations?.some((conv) => conv.id === c)) {
    activeId = c;
    items = toDisplayItems(await loadMessages(supabase, c));
  }

  const status = providerStatus();
  const configured = {
    serp: status.find((p) => p.id === "serp")?.configured ?? false,
    gsc: status.find((p) => p.id === "gsc")?.configured ?? false,
  };

  return (
    <div>
      <SeoTabs active="chat" />

      {error && (
        <div className="p-4 mb-6 rounded-xl bg-red-50 text-red-800 text-sm">
          Gagal memuat data: {error.message}. Pastikan <code>migration_seo_agent.sql</code> sudah dijalankan di Supabase.
        </div>
      )}
      {!process.env.DEEPSEEK_API_KEY && (
        <div className="p-4 mb-6 rounded-xl bg-amber-50 text-amber-800 text-sm">
          <code>DEEPSEEK_API_KEY</code> belum diisi, jadi agent belum bisa dipakai.
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-64 shrink-0">
          <Link
            href="/admin/seo"
            className="block text-center px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold mb-3"
          >
            + Percakapan baru
          </Link>
          <ul className="space-y-1 max-h-[60vh] overflow-y-auto">
            {(conversations ?? []).map((conv) => (
              <li
                key={conv.id}
                className={`group flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
                  conv.id === activeId ? "bg-red-50 text-red-700" : "hover:bg-slate-100 text-slate-700"
                }`}
              >
                <Link href={`/admin/seo?c=${conv.id}`} className="flex-1 min-w-0">
                  <span className="block truncate font-medium">{conv.title}</span>
                  <span className="block text-xs text-slate-400">
                    {new Date(conv.updated_at).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Asia/Makassar",
                    })}
                  </span>
                </Link>
                <span className="opacity-0 group-hover:opacity-100">
                  <ConfirmDeleteButton
                    action={deleteConversation.bind(null, conv.id)}
                    confirmText={`Hapus percakapan "${conv.title}"?`}
                    label="✕"
                  />
                </span>
              </li>
            ))}
            {conversations?.length === 0 && (
              <li className="text-xs text-slate-400 px-3">Belum ada percakapan.</li>
            )}
          </ul>
        </aside>

        <section className="flex-1 min-w-0">
          <SeoChat conversationId={activeId} initialItems={items} configured={configured} />
        </section>
      </div>
    </div>
  );
}
