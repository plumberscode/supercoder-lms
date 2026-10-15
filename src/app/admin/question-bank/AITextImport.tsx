"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateQuestionsFromText, saveDraftQuestions } from "./actions";
import { useToast } from "@/components/ToastProvider";
import type { DraftQuestion } from "@/lib/ai-questions";

interface AITextImportProps {
  subjects: any[];
  maxLength: number;
}

type Draft = DraftQuestion & { selected: boolean };

const LETTERS = ["A", "B", "C", "D"];

export default function AITextImport({ subjects, maxLength }: AITextImportProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || "");
  const [defaultCategory, setDefaultCategory] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedCount = drafts.filter((d) => d.selected).length;

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const result = await generateQuestionsFromText(sourceText, defaultCategory);
      if ("error" in result) {
        showToast(result.error, "error");
        return;
      }
      if (result.questions.length === 0) {
        showToast("AI tidak menemukan soal dalam teks tersebut.", "error");
        return;
      }
      setDrafts(result.questions.map((q) => ({ ...q, selected: true })));
      showToast(
        `${result.questions.length} soal berhasil diolah. Periksa sebelum disimpan.`,
        "success",
      );
    } catch (err: any) {
      showToast("Gagal memproses: " + err.message, "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const chosen = drafts
        .filter((d) => d.selected)
        .map(({ selected, ...q }) => q);
      const result = await saveDraftQuestions(subjectId, chosen);
      if ("error" in result) {
        showToast(result.error, "error");
        return;
      }
      showToast(`${result.saved} soal disimpan ke bank soal!`, "success");
      setDrafts([]);
      setSourceText("");
      router.refresh();
    } catch (err: any) {
      showToast("Gagal menyimpan: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const updateDraft = (index: number, patch: Partial<Draft>) => {
    setDrafts((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    );
  };

  const updateOption = (index: number, optIndex: number, value: string) => {
    setDrafts((prev) =>
      prev.map((d, i) =>
        i === index
          ? {
              ...d,
              options: d.options.map((o, j) => (j === optIndex ? value : o)),
            }
          : d,
      ),
    );
  };

  return (
    <div className="card" style={{ marginTop: "32px" }}>
      <h3 style={{ marginBottom: "8px" }}>✨ Impor dari Teks (AI)</h3>
      <p style={{ fontSize: "0.875rem", color: "#64748B", marginBottom: "20px" }}>
        Tempel soal dalam bentuk teks bebas — boleh campuran pilihan ganda,
        isian, dengan atau tanpa kunci. AI akan memilah dan mengubahnya menjadi
        soal pilihan ganda 4 opsi. Hasilnya bisa diperiksa dan diedit sebelum
        disimpan.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontWeight: 600, fontSize: "0.875rem" }}>
            Mata Pelajaran
          </label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="input"
            style={{ width: "100%" }}
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontWeight: 600, fontSize: "0.875rem" }}>
            Kategori Default (opsional)
          </label>
          <input
            type="text"
            value={defaultCategory}
            onChange={(e) => setDefaultCategory(e.target.value)}
            placeholder="Contoh: HTML Dasar"
            className="input"
            style={{ width: "100%" }}
          />
        </div>
      </div>

      <textarea
        value={sourceText}
        onChange={(e) => setSourceText(e.target.value)}
        className="input"
        rows={10}
        maxLength={maxLength}
        style={{ width: "100%", fontFamily: "inherit" }}
        placeholder={`Contoh:\n1. Tag HTML untuk membuat paragraf adalah...\na. <p>  b. <h1>  c. <div>  d. <span>\nJawaban: a\n\n2. Apa fungsi perintah print() di Python?\n\n3. Sebutkan properti CSS untuk mengubah warna teks!`}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          marginTop: "12px",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
          {sourceText.length.toLocaleString("id-ID")} /{" "}
          {maxLength.toLocaleString("id-ID")} karakter
        </span>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleProcess}
          disabled={processing || saving || !sourceText.trim()}
        >
          {processing ? "AI sedang memproses..." : "Olah dengan AI"}
        </button>
      </div>

      {drafts.length > 0 && (
        <div style={{ marginTop: "32px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "16px",
            }}
          >
            <h4 style={{ margin: 0 }}>
              Pratinjau ({selectedCount} dari {drafts.length} dipilih)
            </h4>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDrafts([])}
                disabled={saving}
              >
                Buang
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving || selectedCount === 0}
              >
                {saving ? "Menyimpan..." : `Simpan ${selectedCount} Soal`}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {drafts.map((d, i) => (
              <div
                key={i}
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: d.selected ? "white" : "#F8FAFC",
                  opacity: d.selected ? 1 : 0.6,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                    marginBottom: "12px",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontWeight: 600,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={d.selected}
                      onChange={(e) =>
                        updateDraft(i, { selected: e.target.checked })
                      }
                    />
                    Soal #{i + 1}
                  </label>
                  <input
                    type="text"
                    value={d.category}
                    onChange={(e) => updateDraft(i, { category: e.target.value })}
                    className="input"
                    placeholder="Kategori"
                    style={{ flex: "1 1 160px", minWidth: 0 }}
                  />
                  <input
                    type="number"
                    min={1}
                    value={d.points}
                    onChange={(e) =>
                      updateDraft(i, { points: parseInt(e.target.value) || 10 })
                    }
                    className="input"
                    title="Poin"
                    style={{ width: "80px" }}
                  />
                </div>

                {(d.answer_from_ai || d.options_from_ai) && (
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#B45309",
                      backgroundColor: "#FEF3C7",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      marginBottom: "12px",
                    }}
                  >
                    ⚠️{" "}
                    {[
                      d.answer_from_ai && "Kunci jawaban ditentukan AI",
                      d.options_from_ai && "pilihan jawaban dibuat AI",
                    ]
                      .filter(Boolean)
                      .join(", ")}{" "}
                    — mohon dicek.
                  </div>
                )}

                <textarea
                  value={d.question_text}
                  onChange={(e) =>
                    updateDraft(i, { question_text: e.target.value })
                  }
                  className="input"
                  rows={2}
                  style={{ width: "100%", marginBottom: "12px" }}
                />

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {d.options.map((opt, j) => (
                    <div
                      key={j}
                      style={{ display: "flex", alignItems: "center", gap: "10px" }}
                    >
                      <input
                        type="radio"
                        name={`ai-correct-${i}`}
                        checked={d.correct_option_index === j}
                        onChange={() => updateDraft(i, { correct_option_index: j })}
                        style={{ width: "18px", height: "18px" }}
                        title="Tandai sebagai jawaban benar"
                      />
                      <span style={{ fontWeight: 600, width: "16px" }}>
                        {LETTERS[j]}
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOption(i, j, e.target.value)}
                        className="input"
                        style={{
                          flex: 1,
                          minWidth: 0,
                          borderColor:
                            d.correct_option_index === j ? "#22C55E" : undefined,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
