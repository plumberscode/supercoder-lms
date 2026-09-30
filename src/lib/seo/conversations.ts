import type OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToolEvent } from "./tools";

export type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };

export type ToolMeta = { name: string; ok: boolean; summary: string; event?: ToolEvent };

/** Pesan seperti tersimpan di seo_messages. */
export type StoredMessage = {
  role: "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[] | null;
  tool_call_id?: string | null;
  meta?: ToolMeta | null;
};

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

const OLD_TOOL_RESULT_CHARS = 1500;
const MAX_HISTORY = 60;

/**
 * StoredMessage → format chat OpenAI. Hasil tool dari giliran sebelumnya dipadatkan agar
 * hemat token; riwayat dipotong mulai dari pesan user supaya pasangan tool_call tetap utuh.
 */
export function toChatHistory(rows: StoredMessage[]): ChatMessage[] {
  let start = Math.max(0, rows.length - MAX_HISTORY);
  while (start > 0 && rows[start].role !== "user") start--;
  const slice = rows.slice(start);

  let lastUser = -1;
  slice.forEach((m, i) => m.role === "user" && (lastUser = i));

  return slice.map((m, i): ChatMessage => {
    if (m.role === "tool") {
      const content = m.content ?? "";
      return {
        role: "tool",
        tool_call_id: m.tool_call_id ?? "",
        content:
          i < lastUser && content.length > OLD_TOOL_RESULT_CHARS
            ? `${content.slice(0, OLD_TOOL_RESULT_CHARS)}…[hasil lama dipadatkan]`
            : content,
      };
    }
    if (m.role === "assistant") {
      return m.tool_calls?.length
        ? { role: "assistant", content: m.content || null, tool_calls: m.tool_calls }
        : { role: "assistant", content: m.content ?? "" };
    }
    return { role: "user", content: m.content ?? "" };
  });
}

export type DisplayTool = ToolMeta & { id: string; args: string; status: "running" | "done" };

export type DisplayItem =
  | { role: "user"; text: string }
  | { role: "assistant"; text: string; tools: DisplayTool[] };

/** Susun pesan tersimpan menjadi gelembung chat (1 gelembung asisten per giliran). */
export function toDisplayItems(rows: StoredMessage[]): DisplayItem[] {
  const items: DisplayItem[] = [];
  let current: Extract<DisplayItem, { role: "assistant" }> | null = null;

  for (const m of rows) {
    if (m.role === "user") {
      current = null;
      items.push({ role: "user", text: m.content ?? "" });
      continue;
    }
    if (!current) {
      current = { role: "assistant", text: "", tools: [] };
      items.push(current);
    }
    if (m.role === "assistant") {
      if (m.content) current.text += (current.text ? "\n\n" : "") + m.content;
      for (const call of m.tool_calls ?? []) {
        current.tools.push({
          id: call.id,
          name: call.function.name,
          args: call.function.arguments,
          ok: true,
          summary: "",
          status: "running",
        });
      }
    } else {
      const tool = current.tools.find((t) => t.id === m.tool_call_id);
      if (tool && m.meta) Object.assign(tool, m.meta, { status: "done" });
      else if (tool) tool.status = "done";
    }
  }
  return items;
}

export async function loadMessages(supabase: SupabaseClient, conversationId: string): Promise<StoredMessage[]> {
  const { data, error } = await supabase
    .from("seo_messages")
    .select("role, content, tool_calls, tool_call_id, meta")
    .eq("conversation_id", conversationId)
    .order("id", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as StoredMessage[];
}

export async function saveMessages(
  supabase: SupabaseClient,
  conversationId: string,
  messages: StoredMessage[],
) {
  if (!messages.length) return;
  const { error } = await supabase.from("seo_messages").insert(
    messages.map((m) => ({
      conversation_id: conversationId,
      role: m.role,
      content: m.content,
      tool_calls: m.tool_calls ?? null,
      tool_call_id: m.tool_call_id ?? null,
      meta: m.meta ?? null,
    })),
  );
  if (error) throw new Error(error.message);
  await supabase
    .from("seo_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
}
