import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/admin/blog/actions", () => ({ createPost: vi.fn() }));

import { runSeoAgent, type AgentEvent, type ChatStreamFn } from "@/lib/seo/agent";
import { analyzeHtml } from "@/lib/seo/analyze-page";
import { crawlSite, parseRobots, parseSitemap, summarizeAudit } from "@/lib/seo/audit";
import { compactJson } from "@/lib/seo/compact";
import { toChatHistory, toDisplayItems, type StoredMessage } from "@/lib/seo/conversations";
import { assertPublicUrl, isPrivateIp, type SafeFetchResult } from "@/lib/seo/fetch-guard";
import { parseGscLinksCsv } from "@/lib/seo/gsc-links";
import { matchesDomain, rankingGap, topicGap } from "@/lib/seo/keyword-gap";
import { findOpportunities } from "@/lib/seo/opportunities";
import { explainGscError, matchGscProperty } from "@/lib/seo/providers/gsc";
import type { SerpResult } from "@/lib/seo/providers/types";
import { renderAgentMarkdown } from "@/lib/seo/render-markdown";
import { classifyDomain, type SeoTool } from "@/lib/seo/tools";
import type { SeoContext } from "@/lib/seo/types";

const page = (opts: {
  title?: string;
  desc?: string;
  h1?: string;
  body?: string;
  robots?: string;
  canonical?: string;
  links?: string[];
}) => `
<!doctype html><html lang="id"><head>
<title>${opts.title ?? "Kursus Coding Balikpapan | Supercoder"}</title>
<meta name="description" content="${opts.desc ?? "Kursus coding Balikpapan untuk SMP, SMA dan umum. Belajar membuat website dan aplikasi dengan AI."}">
<meta name="viewport" content="width=device-width">
${opts.robots ? `<meta name="robots" content="${opts.robots}">` : ""}
<link rel="canonical" href="${opts.canonical ?? "/"}">
<meta property="og:image" content="https://supercoder.id/og.png">
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"EducationalOrganization"},{"@type":"FAQPage"}]}</script>
</head><body>
<h1>${opts.h1 ?? "Kursus Coding Balikpapan"}</h1>
<p>${opts.body ?? "kata ".repeat(400)}</p>
<img src="a.png" alt="logo"><img src="b.png">
${(opts.links ?? []).map((l) => `<a href="${l}">link</a>`).join("")}
<a href="https://wa.me/62816331126">WA</a>
<script>var x = "tidak dihitung";</script>
</body></html>`;

describe("fetch-guard", () => {
  it("mengenali IP privat & publik", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "::1", "fd00::1", "::ffff:10.0.0.1"]) {
      expect(isPrivateIp(ip)).toBe(true);
    }
    for (const ip of ["8.8.8.8", "104.21.3.4", "2606:4700::1111"]) expect(isPrivateIp(ip)).toBe(false);
  });

  it("menolak URL berbahaya", async () => {
    await expect(assertPublicUrl("file:///etc/passwd")).rejects.toThrow();
    await expect(assertPublicUrl("http://localhost:3000")).rejects.toThrow();
    await expect(assertPublicUrl("http://127.0.0.1/")).rejects.toThrow();
    await expect(assertPublicUrl("http://10.0.0.5/admin")).rejects.toThrow();
    await expect(assertPublicUrl("http://user:pass@8.8.8.8/")).rejects.toThrow();
    await expect(assertPublicUrl("https://8.8.8.8/")).resolves.toBeInstanceOf(URL);
  });
});

describe("analyzeHtml", () => {
  it("mengambil sinyal on-page & NAP", () => {
    const a = analyzeHtml(page({ links: ["/blog", "https://timedooracademy.com/x"] }), "https://supercoder.id/", {
      phones: ["+62816331126"],
      address: "Jl. Syarifuddin Yoes",
      city: "Balikpapan",
    });
    expect(a.title).toBe("Kursus Coding Balikpapan | Supercoder");
    expect(a.h1).toEqual(["Kursus Coding Balikpapan"]);
    expect(a.canonical).toBe("https://supercoder.id/");
    expect(a.jsonLdTypes).toEqual(expect.arrayContaining(["EducationalOrganization", "FAQPage"]));
    expect(a.imagesWithoutAlt).toBe(1);
    expect(a.internalLinks).toContain("https://supercoder.id/blog");
    expect(a.externalLinks).toContain("https://timedooracademy.com/x");
    expect(a.wordCount).toBeGreaterThan(400);
    expect(a.nap).toEqual({ phone: true, address: false, city: true });
    expect(a.issues.map((i) => i.code)).toEqual(["img_alt_missing"]);
  });

  it("menandai isu penting", () => {
    const html = "<html><head></head><body><p>pendek</p></body></html>";
    const codes = analyzeHtml(html, "https://x.com/").issues.map((i) => i.code);
    expect(codes).toEqual(
      expect.arrayContaining(["title_missing", "description_missing", "h1_missing", "viewport_missing", "thin_content", "canonical_missing"]),
    );
  });
});

describe("sitemap & robots", () => {
  it("parse urlset dan sitemapindex", () => {
    expect(parseSitemap("<urlset><url><loc>https://a.id/</loc></url><url><loc> https://a.id/b?x=1&amp;y=2 </loc></url></urlset>").urls).toEqual([
      "https://a.id/",
      "https://a.id/b?x=1&y=2",
    ]);
    expect(parseSitemap("<sitemapindex><sitemap><loc>https://a.id/s1.xml</loc></sitemap></sitemapindex>").sitemaps).toEqual([
      "https://a.id/s1.xml",
    ]);
  });

  it("parse robots.txt", () => {
    const r = parseRobots("User-agent: Googlebot\nDisallow: /\n\nUser-agent: *\nDisallow: /admin\nSitemap: https://a.id/sitemap.xml");
    expect(r).toEqual({ sitemaps: ["https://a.id/sitemap.xml"], disallowAll: false });
    expect(parseRobots("User-agent: *\nDisallow: /").disallowAll).toBe(true);
  });
});

describe("crawlSite + summarizeAudit", () => {
  const site: Record<string, { status: number; body: string; type?: string; redirect?: string }> = {
    "https://s.id/robots.txt": { status: 200, body: "User-agent: *\nAllow: /\nSitemap: https://s.id/sitemap.xml", type: "text/plain" },
    "https://s.id/sitemap.xml": {
      status: 200,
      type: "application/xml",
      body: "<urlset><url><loc>https://s.id/</loc></url><url><loc>https://s.id</loc></url><url><loc>https://s.id/daftar</loc></url><url><loc>https://s.id/lama</loc></url><url><loc>https://s.id/pindah</loc></url></urlset>",
    },
    "https://s.id/": { status: 200, body: page({ links: ["/daftar", "/hilang", "/daftar?voucher=X"] }) },
    "https://s.id/pindah": { status: 200, body: "", redirect: "https://s.id/" },
    "https://s.id/daftar": { status: 200, body: page({ robots: "noindex" }) },
    "https://s.id/lama": { status: 200, body: page({ title: "Kursus Coding Balikpapan | Supercoder", canonical: "/lama" }) },
    "https://s.id/hilang": { status: 404, body: "not found" },
  };

  const fetcher = async (url: string): Promise<SafeFetchResult> => {
    const key = url === "https://s.id" ? "https://s.id/" : url;
    const hit = site[key] ?? { status: 404, body: "" };
    const target = hit.redirect ? site[hit.redirect] : hit;
    return {
      requestedUrl: url,
      finalUrl: hit.redirect ?? key,
      status: target.status,
      redirects: hit.redirect ? [{ from: key, to: hit.redirect, status: 301 }] : [],
      headers: { "content-type": target.type ?? "text/html" },
      body: target.body,
      truncated: false,
      ms: 50,
    };
  };

  it("menemukan isu lintas halaman", async () => {
    const crawl = await crawlSite("https://s.id/", { fetcher, maxPages: 20 });
    expect(crawl.sitemapUrls).toHaveLength(5);
    // "https://s.id" == "https://s.id/"; URL berparameter di luar sitemap tidak di-crawl
    expect(crawl.pages.filter((p) => p.url === "https://s.id/")).toHaveLength(1);
    expect(crawl.pages.some((p) => p.url.includes("voucher"))).toBe(false);
    expect(crawl.brokenLinks).toEqual([{ from: "https://s.id/", to: "https://s.id/hilang", status: 404 }]);

    const summary = summarizeAudit(crawl);
    const codes = summary.issues.map((i) => i.code);
    expect(codes).toEqual(
      expect.arrayContaining(["sitemap_duplicate", "sitemap_noindex", "title_duplicate", "broken_internal_link", "client_error"]),
    );
    expect(codes).toContain("sitemap_redirect");
    // Redirect /pindah → / tidak dihitung sebagai title duplikat kedua
    expect(summary.issues.find((i) => i.code === "title_duplicate")?.urls.sort()).toEqual(["https://s.id/", "https://s.id/lama"]);
    // Isu high diurutkan paling atas
    expect(summary.issues[0].severity).toBe("high");
    expect(summary.score).toBeLessThan(100);
    expect(summary.stats.errors).toBe(1);
  });
});

describe("crawl dari host non-www", () => {
  it("URL awal non-www yang redirect ke www tidak dianggap URL sitemap", async () => {
    const pages: Record<string, string> = {
      "https://www.w.id/": page({ canonical: "https://www.w.id/" }),
    };
    const fetcher = async (url: string): Promise<SafeFetchResult> => {
      const u = new URL(url);
      const redirected = u.hostname === "w.id";
      const finalUrl = redirected ? `https://www.w.id${u.pathname}` : url;
      const isSitemap = u.pathname === "/sitemap.xml";
      return {
        requestedUrl: url,
        finalUrl,
        status: isSitemap || pages[finalUrl] ? 200 : 404,
        redirects: redirected ? [{ from: url, to: finalUrl, status: 308 }] : [],
        headers: { "content-type": isSitemap ? "application/xml" : "text/html" },
        body: isSitemap ? "<urlset><url><loc>https://www.w.id</loc></url></urlset>" : (pages[finalUrl] ?? ""),
        truncated: false,
        ms: 1,
      };
    };
    const crawl = await crawlSite("https://w.id", { fetcher, maxPages: 5 });
    const codes = summarizeAudit(crawl).issues.map((i) => i.code);
    expect(codes).not.toContain("sitemap_redirect");
    expect(crawl.pages.find((p) => p.url === "https://w.id/")?.inSitemap).toBe(false);
  });
});

describe("findOpportunities", () => {
  it("memisahkan striking distance & CTR rendah", () => {
    const rows = [
      { keys: ["kursus coding balikpapan", "https://s.id/"], clicks: 2, impressions: 400, ctr: 0.005, position: 4.6 },
      { keys: ["les coding balikpapan", "https://s.id/"], clicks: 0, impressions: 150, ctr: 0, position: 12.3 },
      { keys: ["supercoder", "https://s.id/"], clicks: 5, impressions: 100, ctr: 0.05, position: 1.2 },
      { keys: ["jarang", "https://s.id/"], clicks: 0, impressions: 3, ctr: 0, position: 8 },
    ];
    const { strikingDistance, lowCtr } = findOpportunities(rows, { periodDays: 30 });
    expect(strikingDistance.map((o) => o.query)).toEqual(["kursus coding balikpapan", "les coding balikpapan"]);
    // Diurutkan dari potensi klik terbesar
    expect(lowCtr.map((o) => o.query)).toEqual(["supercoder", "kursus coding balikpapan"]);
    expect(strikingDistance[0].potentialClicks).toBeGreaterThan(0);
  });
});

describe("keyword gap", () => {
  const serp = (query: string, domains: string[]): SerpResult => ({
    query,
    location: "Balikpapan",
    provider: "test",
    fetchedAt: "",
    organic: domains.map((domain, i) => ({ position: i + 1, domain, link: `https://${domain}/`, title: "", snippet: "" })),
    peopleAlsoAsk: [],
    localPack: [],
    relatedSearches: [],
  });

  it("matchesDomain menangani www & subdomain", () => {
    expect(matchesDomain("www.supercoder.id", "supercoder.id")).toBe(true);
    expect(matchesDomain("blog.timedooracademy.com", "https://timedooracademy.com")).toBe(true);
    expect(matchesDomain("notsupercoder.id", "supercoder.id")).toBe(false);
  });

  it("mengklasifikasi status ranking", () => {
    const rows = rankingGap(
      [
        serp("a", ["instagram.com", "timedooracademy.com", "supercoder.id"]),
        serp("b", ["timedooracademy.com", "lauwba.com"]),
        serp("c", ["supercoder.id", "lauwba.com"]),
        serp("d", ["wikipedia.org"]),
      ],
      "supercoder.id",
      ["timedooracademy.com", "lauwba.com"],
    );
    expect(rows.map((r) => r.status)).toEqual(["behind", "missing", "winning", "untapped"]);
    expect(rows[0]).toMatchObject({ ourPosition: 3, bestCompetitor: { domain: "timedooracademy.com", position: 2 } });
  });

  it("topicGap menemukan frasa kompetitor yang belum kita punya", () => {
    const gap = topicGap(["kursus coding balikpapan", "belajar coding smp sma"], {
      "a.com": ["kursus coding di balikpapan", "biaya kursus coding anak"],
      "b.com": ["biaya kursus coding anak balikpapan", "robotik anak"],
    });
    const top = gap.map((g) => g.phrase);
    expect(top).toContain("biaya kursus coding");
    expect(gap.find((g) => g.phrase === "biaya kursus coding")?.competitors).toEqual(["a.com", "b.com"]);
    expect(top).not.toContain("kursus coding balikpapan");
  });
});

describe("perbaikan dari tes data asli", () => {
  it("robots.txt & sitemap soft 404 (HTML 200) dilaporkan, bukan diam-diam kosong", async () => {
    const { fetchSitemapUrls } = await import("@/lib/seo/audit");
    const html = "<!DOCTYPE html><html><head><title></title></head><body>home</body></html>";
    const fetcher = async (url: string) => ({
      requestedUrl: url,
      finalUrl: url,
      status: 200,
      redirects: [],
      headers: { "content-type": "text/html" },
      body: html,
      truncated: false,
      ms: 1,
    });
    const r = await fetchSitemapUrls("https://soft.id", fetcher);
    expect(r.robots.found).toBe(false);
    expect(r.urls).toEqual([]);
    expect(r.errors[0]).toContain("soft 404");
  });

  it("topicGap membuang kota lain & kata menu", () => {
    const gap = topicGap(
      ["kursus coding balikpapan"],
      {
        "a.com": ["kursus android semarang", "contact us", "biaya kursus coding balikpapan"],
        "b.com": ["kursus web semarang", "contact", "biaya kursus coding"],
      },
      { ourCity: "Balikpapan" },
    ).map((g) => g.phrase);
    expect(top(gap)).toContain("biaya kursus coding");
    expect(gap.some((p) => p.includes("semarang"))).toBe(false);
    expect(gap).not.toContain("contact");
    function top(list: string[]) {
      return list.slice(0, 5);
    }
  });
});

describe("helper lain", () => {
  it("compactJson tetap di bawah batas", () => {
    const big = { rows: Array.from({ length: 500 }, (_, i) => ({ i, text: "x".repeat(100) })) };
    const out = compactJson(big, 4000);
    expect(out.length).toBeLessThanOrEqual(4000);
    expect(() => JSON.parse(out)).not.toThrow();
  });

  it("parseGscLinksCsv", () => {
    const csv = '﻿Top linking sites,Linking pages\n"www.sman1bpn.sch.id","12"\nkaltimpost.id,3\nsman1bpn.sch.id,1\n';
    expect(parseGscLinksCsv(csv)).toEqual([
      { domain: "sman1bpn.sch.id", links: 13 },
      { domain: "kaltimpost.id", links: 3 },
    ]);
  });

  it("classifyDomain", () => {
    expect(classifyDomain("sman1balikpapan.sch.id")).toBe("sekolah");
    expect(classifyDomain("smp-7.example.com")).toBe("sekolah");
    expect(classifyDomain("smartphone.com")).toBe("lainnya");
    expect(classifyDomain("kaltim.tribunnews.com")).toBe("media");
    expect(classifyDomain("uniba-bpn.ac.id")).toBe("kampus");
  });

  it("renderAgentMarkdown membuang HTML & link berbahaya", () => {
    const html = renderAgentMarkdown(
      '# Judul\n\n<script>alert(1)</script>\n\n[klik](javascript:alert(1)) [ok](https://supercoder.id) [lap](/admin/seo/reports/1)\n\n![x](https://e.com/a.png)',
    );
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("javascript:");
    expect(html).toContain('href="https://supercoder.id"');
    expect(html).toContain('href="/admin/seo/reports/1"');
    expect(html).not.toContain("<img");
  });
});

describe("riwayat percakapan", () => {
  const rows: StoredMessage[] = [
    { role: "user", content: "audit" },
    { role: "assistant", content: null, tool_calls: [{ id: "t1", type: "function", function: { name: "audit_site", arguments: "{}" } }] },
    { role: "tool", tool_call_id: "t1", content: "x".repeat(5000), meta: { name: "audit_site", ok: true, summary: "Skor 90" } },
    { role: "assistant", content: "Selesai." },
    { role: "user", content: "lagi" },
  ];

  it("memadatkan hasil tool lama", () => {
    const history = toChatHistory(rows);
    const tool = history[2] as { content: string };
    expect(tool.content.length).toBeLessThan(1600);
  });

  it("menyusun gelembung chat", () => {
    const items = toDisplayItems(rows);
    expect(items).toHaveLength(3);
    expect(items[1]).toMatchObject({ role: "assistant", text: "Selesai.", tools: [{ id: "t1", summary: "Skor 90", status: "done" }] });
  });
});

describe("runSeoAgent", () => {
  type Delta = { content?: string; tool_calls?: { index: number; id?: string; function?: { name?: string; arguments?: string } }[] };
  const streamOf = (deltas: Delta[]) =>
    (async function* () {
      for (const delta of deltas) yield { choices: [{ delta }] };
    })() as unknown as AsyncIterable<never>;

  const echoTool: SeoTool = {
    name: "echo",
    description: "echo",
    parameters: { type: "object", properties: {} },
    async run(args) {
      return { summary: "ok", llm: { echoed: args }, data: args };
    },
  };
  const ctx = () => ({ collected: [] }) as unknown as SeoContext;

  it("menjalankan tool lalu menjawab", async () => {
    const calls: Parameters<ChatStreamFn>[0][] = [];
    const responses = [
      [
        { tool_calls: [{ index: 0, id: "c1", function: { name: "echo", arguments: '{"a"' } }] },
        { tool_calls: [{ index: 0, function: { arguments: ":1}" } }] },
      ],
      [{ content: "Hasil: " }, { content: "beres" }],
    ];
    const stream: ChatStreamFn = async (params) => {
      calls.push(params);
      return streamOf(responses[calls.length - 1]);
    };
    const events: AgentEvent[] = [];
    const c = ctx();
    const created = await runSeoAgent({
      stream,
      system: "sys",
      history: [{ role: "user", content: "halo" }],
      ctx: c,
      emit: (e) => events.push(e),
      tools: [echoTool],
    });

    expect(created.map((m) => m.role)).toEqual(["assistant", "tool", "assistant"]);
    expect(created[1]).toMatchObject({ tool_call_id: "c1", content: '{"echoed":{"a":1}}', meta: { name: "echo", ok: true } });
    expect(created[2].content).toBe("Hasil: beres");
    expect(c.collected).toEqual([{ tool: "echo", args: { a: 1 }, data: { a: 1 } }]);
    // Panggilan kedua membawa hasil tool
    expect(calls[1].messages.at(-1)).toMatchObject({ role: "tool", tool_call_id: "c1" });
    expect(events.map((e) => e.type)).toEqual(["tool_start", "tool_result", "text", "text"]);
  });

  it("berhenti di batas langkah & tool tidak dikenal tidak melempar", async () => {
    const choices: string[] = [];
    const stream: ChatStreamFn = async (params) => {
      choices.push(params.tool_choice);
      return streamOf([{ tool_calls: [{ index: 0, id: `x${choices.length}`, function: { name: "tidak_ada", arguments: "{}" } }] }]);
    };
    const created = await runSeoAgent({
      stream,
      system: "sys",
      history: [{ role: "user", content: "loop" }],
      ctx: ctx(),
      emit: () => {},
      tools: [echoTool],
      maxSteps: 2,
    });
    expect(choices).toEqual(["auto", "auto", "none"]);
    expect(created.filter((m) => m.role === "tool")[0].meta?.ok).toBe(false);
    expect(created.at(-1)?.content).toContain("Batas langkah");
  });
});

describe("koneksi GSC", () => {
  const sites = [
    { siteUrl: "sc-domain:supercoder.id", permissionLevel: "siteRestrictedUser" },
    { siteUrl: "https://www.supercoder.id/", permissionLevel: "siteFullUser" },
  ];

  it("mencocokkan properti dengan toleransi slash & huruf", () => {
    expect(matchGscProperty(sites, "SC-DOMAIN:supercoder.id")?.siteUrl).toBe("sc-domain:supercoder.id");
    expect(matchGscProperty(sites, "https://www.supercoder.id")?.siteUrl).toBe("https://www.supercoder.id/");
    expect(matchGscProperty(sites, "https://supercoder.id/")).toBeNull();
  });

  it("menjelaskan error umum", () => {
    expect(explainGscError('GSC auth 400: {"error":"invalid_grant"}')).toContain("invalid_grant");
    expect(explainGscError("error:1E08010C:DECODER routines::unsupported")).toContain("GSC_PRIVATE_KEY");
    expect(explainGscError("GSC 403: User does not have sufficient permission")).toContain("Users and permissions");
    expect(explainGscError("GSC 403: Google Search Console API has not been used in project 123")).toContain("belum diaktifkan");
    expect(explainGscError("lain")).toBe("lain");
  });
});

describe("metadata homepage", () => {
  it("title ≤60 dan description ≤160 karakter, SITE_URL memakai www", async () => {
    const { HOME_TITLE, HOME_DESCRIPTION, SITE_URL } = await import("@/lib/site");
    expect(HOME_TITLE.length).toBeLessThanOrEqual(60);
    expect(HOME_DESCRIPTION.length).toBeLessThanOrEqual(160);
    expect(HOME_DESCRIPTION.length).toBeGreaterThanOrEqual(120);
    expect(SITE_URL).toMatch(/^https?:\/\//);
  });
});

describe("SITE_URL", () => {
  it("apex supercoder.id dinormalisasi ke www; localhost tidak diubah", async () => {
    const orig = process.env.NEXT_PUBLIC_SITE_URL;
    try {
      for (const [env, want] of [
        ["https://supercoder.id", "https://www.supercoder.id"],
        ["https://supercoder.id/", "https://www.supercoder.id"],
        ["http://localhost:3000", "http://localhost:3000"],
      ]) {
        process.env.NEXT_PUBLIC_SITE_URL = env;
        vi.resetModules();
        expect((await import("@/lib/site")).SITE_URL).toBe(want);
      }
    } finally {
      if (orig === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
      else process.env.NEXT_PUBLIC_SITE_URL = orig;
    }
  });
});
