import type OpenAI from "openai";
import { compactJson } from "./compact";
import { toChatHistory, type StoredMessage, type ToolCall } from "./conversations";
import { executeTool, SEO_TOOLS, toolDefinitions, type SeoTool, type ToolEvent } from "./tools";
import type { SeoContext } from "./types";

type Chunk = OpenAI.Chat.Completions.ChatCompletionChunk;
type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

export type AgentEvent =
  | { type: "text"; delta: string }
  | { type: "tool_start"; id: string; name: string; args: string }
  | { type: "tool_result"; id: string; name: string; ok: boolean; summary: string }
  | ({ type: ToolEvent["type"] } & Omit<ToolEvent, "type">);

/** Satu panggilan model yang di-stream. Diinjeksi agar loop bisa dites tanpa API. */
export type ChatStreamFn = (params: {
  messages: ChatMessage[];
  tools: OpenAI.Chat.Completions.ChatCompletionTool[];
  tool_choice: "auto" | "none";
}) => Promise<AsyncIterable<Chunk>>;

export const MAX_AGENT_STEPS = 12;

/**
 * Loop agent: model → (tool calls → hasil tool → model)* → jawaban akhir.
 * Mengembalikan pesan baru (assistant & tool) untuk disimpan.
 */
export async function runSeoAgent(opts: {
  stream: ChatStreamFn;
  system: string;
  history: StoredMessage[];
  ctx: SeoContext;
  emit: (event: AgentEvent) => void;
  maxSteps?: number;
  tools?: SeoTool[];
}): Promise<StoredMessage[]> {
  const registry = opts.tools ?? SEO_TOOLS;
  const definitions = opts.tools
    ? registry.map((t) => ({
        type: "function" as const,
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }))
    : toolDefinitions();
  const maxSteps = opts.maxSteps ?? MAX_AGENT_STEPS;
  const created: StoredMessage[] = [];

  for (let step = 0; step <= maxSteps; step++) {
    const final = step === maxSteps;
    const chunks = await opts.stream({
      messages: [
        { role: "system", content: opts.system },
        ...toChatHistory([...opts.history, ...created]),
      ],
      tools: definitions,
      tool_choice: final ? "none" : "auto",
    });

    let content = "";
    const calls: { id: string; name: string; args: string }[] = [];
    for await (const chunk of chunks) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;
      if (delta.content) {
        content += delta.content;
        opts.emit({ type: "text", delta: delta.content });
      }
      for (const tc of delta.tool_calls ?? []) {
        const slot = (calls[tc.index] ??= { id: "", name: "", args: "" });
        if (tc.id) slot.id = tc.id;
        if (tc.function?.name) slot.name += tc.function.name;
        if (tc.function?.arguments) slot.args += tc.function.arguments;
      }
    }

    const toolCalls: ToolCall[] = calls
      .filter((c) => c && c.name)
      .map((c, i) => ({
        id: c.id || `call_${step}_${i}`,
        type: "function",
        function: { name: c.name, arguments: c.args },
      }));

    if (!toolCalls.length || final) {
      if (final && !content) {
        content = "Batas langkah agent tercapai sebelum analisis selesai. Minta saya melanjutkan bila perlu.";
        opts.emit({ type: "text", delta: content });
      }
      created.push({ role: "assistant", content });
      break;
    }

    created.push({ role: "assistant", content: content || null, tool_calls: toolCalls });

    for (const call of toolCalls) {
      opts.emit({ type: "tool_start", id: call.id, name: call.function.name, args: call.function.arguments });
      const out = await executeTool(call.function.name, call.function.arguments, opts.ctx, registry);
      opts.emit({ type: "tool_result", id: call.id, name: call.function.name, ok: out.ok, summary: out.summary });
      if (out.event) opts.emit(out.event);
      created.push({
        role: "tool",
        tool_call_id: call.id,
        content: compactJson(out.llm),
        meta: { name: call.function.name, ok: out.ok, summary: out.summary, event: out.event },
      });
    }
  }

  return created;
}
