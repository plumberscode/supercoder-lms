"use client";

import ModuleSelect from "@/app/admin/question-bank/ModuleSelect";
import {
  availableCount,
  type ModuleOption,
  type QuestionBankSummary,
} from "@/lib/question-bank-summary";
import { MAX_SOURCE_COUNT, type QuizSource } from "@/lib/quiz-sources";

// Admin memilih dari modul (dan kategori) mana soal kuis dinamis diambil, sambil
// melihat jumlah soal yang tersedia di bank soal.
export default function QuizSourcePicker({
  modules,
  bank,
  value,
  onChange,
  error,
}: {
  modules: ModuleOption[];
  bank: QuestionBankSummary;
  value: QuizSource[];
  onChange: (sources: QuizSource[]) => void;
  error: string | null;
}) {
  const update = (index: number, patch: Partial<QuizSource>) =>
    onChange(value.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const addSource = () => {
    const used = new Set(value.map((s) => s.module_id));
    const next =
      modules.find((m) => !used.has(m.id) && bank[m.id]?.total) ??
      modules.find((m) => !used.has(m.id)) ??
      modules[0];
    if (!next) return;
    const n = bank[next.id]?.total ?? 0;
    onChange([
      ...value,
      {
        module_id: next.id,
        category: null,
        count: Math.max(1, Math.min(5, n)),
      },
    ]);
  };

  const total = value.reduce((sum, s) => sum + (Number(s.count) || 0), 0);
  const totalAvailable = value.reduce(
    (sum, s) => sum + availableCount(bank, s),
    0,
  );

  const headerStyle = {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#64748B",
    textTransform: "uppercase" as const,
  };
  const columns = "minmax(0, 2fr) minmax(0, 1.5fr) 90px 80px 32px";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div
        style={{ display: "grid", gridTemplateColumns: columns, gap: "8px" }}
      >
        <span style={headerStyle}>Modul</span>
        <span style={headerStyle}>Kategori</span>
        <span style={headerStyle}>Tersedia</span>
        <span style={headerStyle}>Ambil</span>
        <span />
      </div>

      {value.map((source, i) => {
        const moduleSummary = bank[source.module_id];
        const available = availableCount(bank, source);
        const over = source.count > available;
        return (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: columns,
              gap: "8px",
              alignItems: "center",
            }}
          >
            <ModuleSelect
              modules={modules}
              value={source.module_id}
              onChange={(module_id) => update(i, { module_id, category: null })}
            />
            <select
              value={source.category ?? ""}
              onChange={(e) => update(i, { category: e.target.value || null })}
              className="input"
              style={{ width: "100%" }}
            >
              <option value="">
                Semua kategori ({moduleSummary?.total ?? 0})
              </option>
              {moduleSummary?.categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.count})
                </option>
              ))}
            </select>
            <span
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: available === 0 ? "#DC2626" : "#1E293B",
              }}
            >
              {available} soal
            </span>
            <input
              type="number"
              min="1"
              max={Math.min(MAX_SOURCE_COUNT, Math.max(1, available))}
              value={Number.isNaN(source.count) ? "" : source.count}
              onChange={(e) => update(i, { count: parseInt(e.target.value) })}
              className="input"
              style={{
                width: "100%",
                borderColor: over ? "#DC2626" : undefined,
              }}
            />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              disabled={value.length === 1}
              title="Hapus sumber"
              style={{
                background: "none",
                border: "none",
                cursor: value.length === 1 ? "not-allowed" : "pointer",
                color: "#94A3B8",
                fontSize: "1rem",
              }}
            >
              ✕
            </button>
          </div>
        );
      })}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={addSource}
          className="btn btn-secondary"
          style={{ padding: "6px 12px", fontSize: "0.8rem" }}
        >
          + Tambah sumber
        </button>
        <span style={{ fontSize: "0.875rem", color: "#1E293B" }}>
          Total ditampilkan ke siswa: <strong>{total} soal</strong> (dari{" "}
          {totalAvailable} tersedia)
        </span>
      </div>

      {error && (
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#DC2626" }}>
          {error}
        </p>
      )}
    </div>
  );
}
