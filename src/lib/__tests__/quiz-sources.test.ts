import { describe, it, expect } from "vitest";
import {
  answersMatchSources,
  groupBySource,
  pickQuestions,
  resolveSources,
  sanitizeSources,
  validateSources,
  type QuizSource,
} from "@/lib/quiz-sources";

const q = (id: string, module_id: string, category: string | null = null) => ({
  id,
  module_id,
  category,
});

const bank = [
  q("a1", "A", "Loop"),
  q("a2", "A", "Loop"),
  q("a3", "A", "Variabel"),
  q("b1", "B"),
  q("b2", "B", "Fungsi "),
];

describe("resolveSources", () => {
  it("uses stored sources", () => {
    const sources = [{ module_id: "B", category: null, count: 3 }];
    expect(resolveSources({ sources }, "A")).toEqual(sources);
  });

  it("falls back to the lesson module for old quizzes", () => {
    expect(
      resolveSources(
        { sources: null, target_category: " Loop ", question_count: 7 },
        "A",
      ),
    ).toEqual([{ module_id: "A", category: "Loop", count: 7 }]);
    expect(resolveSources({ sources: null }, "A")).toEqual([
      { module_id: "A", category: null, count: 10 },
    ]);
    expect(resolveSources({ sources: null }, null)).toEqual([]);
  });
});

describe("sanitizeSources", () => {
  it("normalises untrusted input", () => {
    expect(
      sanitizeSources([
        { module_id: "A", category: "  ", count: "4" },
        { module_id: 5, category: " Loop", count: 2 },
        null,
      ]),
    ).toEqual([
      { module_id: "A", category: null, count: 4 },
      { module_id: "", category: "Loop", count: 2 },
    ]);
    expect(sanitizeSources("nope")).toEqual([]);
  });
});

describe("validateSources", () => {
  const ok: QuizSource[] = [
    { module_id: "A", category: "Loop", count: 2 },
    { module_id: "A", category: "Variabel", count: 1 },
    { module_id: "B", category: null, count: 2 },
  ];

  it("accepts distinct sources", () => {
    expect(validateSources(ok)).toBeNull();
  });

  it("rejects empty, missing module and bad counts", () => {
    expect(validateSources([])).toMatch(/minimal satu/);
    expect(
      validateSources([{ module_id: "", category: null, count: 1 }]),
    ).toMatch(/pilih modul/);
    expect(
      validateSources([{ module_id: "A", category: null, count: 0 }]),
    ).toMatch(/jumlah soal/);
    expect(
      validateSources([{ module_id: "A", category: null, count: NaN }]),
    ).toMatch(/jumlah soal/);
  });

  it("rejects overlapping sources from the same module", () => {
    expect(
      validateSources([
        { module_id: "A", category: null, count: 1 },
        { module_id: "A", category: "Loop", count: 1 },
      ]),
    ).toMatch(/Semua kategori/);
    expect(
      validateSources([
        { module_id: "A", category: "Loop", count: 1 },
        { module_id: "A", category: "Loop", count: 1 },
      ]),
    ).toMatch(/dua kali/);
  });

  it("checks availability when given", () => {
    const available = (s: QuizSource) => (s.module_id === "A" ? 2 : 0);
    expect(
      validateSources(
        [{ module_id: "A", category: null, count: 3 }],
        available,
      ),
    ).toMatch(/hanya tersedia 2/);
    expect(
      validateSources(
        [{ module_id: "B", category: null, count: 1 }],
        available,
      ),
    ).toMatch(/belum ada soal/);
  });
});

describe("pickQuestions & answersMatchSources", () => {
  const sources: QuizSource[] = [
    { module_id: "A", category: "Loop", count: 1 },
    { module_id: "B", category: null, count: 5 },
  ];
  const pools = groupBySource(sources, bank);

  it("groups by module and trimmed category", () => {
    expect(pools.map((p) => p.map((r) => r.id))).toEqual([
      ["a1", "a2"],
      ["b1", "b2"],
    ]);
    expect(
      groupBySource(
        [{ module_id: "B", category: "Fungsi", count: 1 }],
        bank,
      )[0],
    ).toHaveLength(1);
  });

  it("takes up to count from each source", () => {
    const picked = pickQuestions(sources, pools).map((r) => r.id);
    expect(picked).toHaveLength(3);
    expect(picked.filter((id) => id.startsWith("a"))).toHaveLength(1);
    expect(picked).toEqual(expect.arrayContaining(["b1", "b2"]));
  });

  it("accepts exactly the shown amount per source", () => {
    expect(answersMatchSources(sources, pools, ["a2", "b1", "b2"])).toBe(true);
  });

  it("rejects missing, extra, foreign or duplicate answers", () => {
    expect(answersMatchSources(sources, pools, ["a1", "b1"])).toBe(false);
    expect(answersMatchSources(sources, pools, ["a1", "a2", "b1", "b2"])).toBe(
      false,
    );
    expect(answersMatchSources(sources, pools, ["a3", "b1", "b2"])).toBe(false);
    expect(answersMatchSources(sources, pools, ["a1", "b1", "b2", "x"])).toBe(
      false,
    );
    expect(answersMatchSources(sources, pools, ["a1", "b1", "b1"])).toBe(false);
  });
});
