import { domainOf, type SerpProvider, type SerpResult } from "./types";

type SerperResponse = {
  organic?: { title: string; link: string; snippet?: string; position: number }[];
  peopleAlsoAsk?: { question: string; snippet?: string; link?: string }[];
  places?: { title: string; address?: string; rating?: number; ratingCount?: number; website?: string }[];
  relatedSearches?: { query: string }[];
  knowledgeGraph?: { title?: string; type?: string; website?: string };
  answerBox?: { title?: string; snippet?: string; link?: string };
};

export function createSerperProvider(apiKey: string): SerpProvider {
  return {
    id: "serper",
    async search(query, { location, language, num = 20 }): Promise<SerpResult> {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ q: query, gl: "id", hl: language, location, num }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) throw new Error(`Serper ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const json = (await res.json()) as SerperResponse;

      return {
        query,
        location,
        provider: "serper",
        fetchedAt: new Date().toISOString(),
        organic: (json.organic ?? []).map((o) => ({
          position: o.position,
          title: o.title,
          link: o.link,
          domain: domainOf(o.link),
          snippet: o.snippet ?? "",
        })),
        peopleAlsoAsk: json.peopleAlsoAsk ?? [],
        localPack: (json.places ?? []).map((p) => ({
          title: p.title,
          rating: p.rating,
          reviews: p.ratingCount,
          address: p.address,
          website: p.website,
        })),
        relatedSearches: (json.relatedSearches ?? []).map((r) => r.query),
        knowledgeGraph: json.knowledgeGraph,
        answerBox: json.answerBox,
      };
    },
  };
}
