const ENDPOINT = "https://suggestqueries.google.com/complete/search";

async function suggest(q: string, language: string): Promise<string[]> {
  const url = `${ENDPOINT}?client=firefox&hl=${language}&gl=id&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
  if (!res.ok) throw new Error(`Autocomplete ${res.status}`);
  const text = new TextDecoder("utf-8").decode(await res.arrayBuffer());
  const json = JSON.parse(text) as [string, string[]];
  return json[1] ?? [];
}

const QUESTION_PREFIXES = ["berapa", "apa", "cara", "dimana", "kenapa"];

/**
 * Ide keyword dari Google Autocomplete (gratis, tidak resmi — hemat pemakaian).
 * `expand` menambah variasi seed + huruf a–z dan awalan pertanyaan.
 */
export async function keywordIdeas(
  seed: string,
  opts: { language: string; expand?: boolean },
): Promise<{ seed: string; ideas: string[]; questions: string[] }> {
  const variants = [seed];
  const questionVariants = opts.expand ? QUESTION_PREFIXES.map((p) => `${p} ${seed}`) : [];
  if (opts.expand) {
    for (const c of "abcdefghijklmnopqrstuvwxyz") variants.push(`${seed} ${c}`);
  }

  const run = async (list: string[]) => {
    const out = new Set<string>();
    for (let i = 0; i < list.length; i += 5) {
      const batch = await Promise.allSettled(
        list.slice(i, i + 5).map((q) => suggest(q, opts.language)),
      );
      batch.forEach((r) => r.status === "fulfilled" && r.value.forEach((s) => out.add(s)));
    }
    return out;
  };

  const ideas = await run(variants);
  const questions = await run(questionVariants);
  ideas.delete(seed);
  return { seed, ideas: [...ideas], questions: [...questions] };
}
