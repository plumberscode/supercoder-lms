export type SerpOrganic = {
  position: number;
  title: string;
  link: string;
  domain: string;
  snippet: string;
};

export type SerpResult = {
  query: string;
  location: string;
  provider: string;
  fetchedAt: string;
  organic: SerpOrganic[];
  peopleAlsoAsk: { question: string; snippet?: string; link?: string }[];
  localPack: { title: string; rating?: number; reviews?: number; address?: string; website?: string }[];
  relatedSearches: string[];
  knowledgeGraph?: { title?: string; type?: string; website?: string };
  answerBox?: { title?: string; snippet?: string; link?: string };
};

export type SerpSearchOptions = { location: string; language: string; num?: number };

/** Penyedia hasil Google live. Implementasi: serper (sekarang), dataforseo (nanti). */
export interface SerpProvider {
  id: string;
  search(query: string, opts: SerpSearchOptions): Promise<SerpResult>;
}

/** Penyedia data backlink (belum ada implementasi gratis; DataForSEO nanti). */
export interface BacklinkProvider {
  id: string;
  referringDomains(
    domain: string,
    limit?: number,
  ): Promise<{ domain: string; backlinks: number; rank?: number }[]>;
}

export type ProviderStatus = {
  id: string;
  label: string;
  configured: boolean;
  env: string;
  note: string;
};

export const domainOf = (link: string) => {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return link;
  }
};
