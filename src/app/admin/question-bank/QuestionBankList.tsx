"use client";

import { useMemo, useState } from "react";
import { deleteQuestion } from "./actions";
import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/components/ToastProvider";
import type { ModuleOption } from "./ModuleSelect";

interface QuestionBankListProps {
  questions: any[];
  modules: ModuleOption[];
}

const NO_MODULE = "__none__";

export default function QuestionBankList({
  questions,
  modules,
}: QuestionBankListProps) {
  // Pakai props langsung (bukan salinan di state) supaya soal baru dari form/impor
  // langsung tampil setelah router.refresh(); yang dihapus cukup disembunyikan.
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const { showToast } = useToast();

  const groups = useMemo(() => {
    const term = filter.toLowerCase();
    const visible = questions.filter(
      (q) =>
        !deletedIds.has(q.id) &&
        (!moduleFilter || (q.module_id ?? NO_MODULE) === moduleFilter) &&
        (q.question_text.toLowerCase().includes(term) ||
          q.category.toLowerCase().includes(term)),
    );
    const byModule = new Map<string, any[]>();
    for (const q of visible) {
      const key = q.module_id ?? NO_MODULE;
      byModule.set(key, [...(byModule.get(key) ?? []), q]);
    }
    const ordered = modules
      .filter((m) => byModule.has(m.id))
      .map((m) => ({
        key: m.id,
        title: m.title,
        subjectTitle: m.subjectTitle,
        items: byModule.get(m.id)!,
      }));
    const orphan = [...byModule].filter(
      ([key]) => !modules.some((m) => m.id === key),
    );
    if (orphan.length > 0) {
      ordered.push({
        key: NO_MODULE,
        title: "Tanpa Modul",
        subjectTitle: "",
        items: orphan.flatMap(([, items]) => items),
      });
    }
    return ordered;
  }, [questions, modules, deletedIds, filter, moduleFilter]);

  const handleDelete = async () => {
    if (!questionToDelete) return;

    const id = questionToDelete;
    setQuestionToDelete(null);

    try {
      await deleteQuestion(id);
      setDeletedIds((prev) => new Set(prev).add(id));
      showToast("Soal berhasil dihapus", "success");
    } catch (err: any) {
      showToast("Gagal menghapus: " + err.message, "error");
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <input
          type="text"
          placeholder="Cari soal atau kategori..."
          className="input"
          style={{ flex: "1 1 240px", maxWidth: "400px" }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <select
          className="input"
          style={{ flex: "1 1 220px", maxWidth: "320px" }}
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
        >
          <option value="">Semua modul</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.subjectTitle} — {m.title}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        {groups.map((group) => (
          <section key={group.key}>
            <div style={{ marginBottom: "12px" }}>
              {group.subjectTitle && (
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#64748B",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {group.subjectTitle}
                </div>
              )}
              <h3 style={{ margin: 0 }}>
                {group.title}{" "}
                <span style={{ fontWeight: 400, color: "#94A3B8" }}>
                  ({group.items.length} soal)
                </span>
              </h3>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {group.items.map((q) => (
                <div key={q.id} className="card" style={{ padding: "20px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "12px",
                    }}
                  >
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      <span
                        className="badge"
                        style={{ backgroundColor: "#F0FDF4", color: "#166534" }}
                      >
                        🏷️ {q.category}
                      </span>
                    </div>
                    <button
                      onClick={() => setQuestionToDelete(q.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#EF4444",
                        cursor: "pointer",
                      }}
                      title="Hapus"
                    >
                      🗑️
                    </button>
                  </div>

                  <p
                    style={{
                      fontWeight: 600,
                      fontSize: "1.1rem",
                      marginBottom: "16px",
                    }}
                  >
                    {q.question_text}
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                    }}
                  >
                    {q.options.map((opt: string, i: number) => (
                      <div
                        key={i}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: "1px solid #E2E8F0",
                          backgroundColor:
                            i === q.correct_option_index ? "#F0FDF4" : "transparent",
                          borderColor:
                            i === q.correct_option_index ? "#86EFAC" : "#E2E8F0",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 700,
                            color: "#94A3B8",
                          }}
                        >
                          {String.fromCharCode(65 + i)}.
                        </span>
                        <span
                          style={{
                            fontSize: "0.875rem",
                            color:
                              i === q.correct_option_index ? "#166534" : "inherit",
                          }}
                        >
                          {opt}
                        </span>
                        {i === q.correct_option_index && <span>✅</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {groups.length === 0 && (
          <div
            style={{ textAlign: "center", padding: "48px", color: "#94A3B8" }}
          >
            Tidak ada soal yang ditemukan.
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={!!questionToDelete}
        onClose={() => setQuestionToDelete(null)}
        onConfirm={handleDelete}
        title="Hapus Soal?"
        message="Apakah Anda yakin ingin menghapus soal ini dari bank soal?"
        confirmText="Hapus Soal"
      />
    </div>
  );
}
