"use client";

import { useState } from "react";
import { deleteQuestion } from "./actions";
import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/components/ToastProvider";

interface QuestionBankListProps {
  initialQuestions: any[];
}

export default function QuestionBankList({
  initialQuestions,
}: QuestionBankListProps) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [filter, setFilter] = useState("");
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const { showToast } = useToast();

  const filteredQuestions = questions.filter(
    (q) =>
      q.question_text.toLowerCase().includes(filter.toLowerCase()) ||
      q.category.toLowerCase().includes(filter.toLowerCase()),
  );

  const handleDelete = async () => {
    if (!questionToDelete) return;

    const id = questionToDelete;
    setQuestionToDelete(null);

    try {
      await deleteQuestion(id);
      setQuestions(questions.filter((q) => q.id !== id));
      showToast("Soal berhasil dihapus", "success");
    } catch (err: any) {
      showToast("Gagal menghapus: " + err.message, "error");
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <input
          type="text"
          placeholder="Cari soal atau kategori..."
          className="input"
          style={{ width: "100%", maxWidth: "400px" }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {filteredQuestions.map((q) => (
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
                  style={{ backgroundColor: "#E0F2FE", color: "#0369A1" }}
                >
                  {q.subjects?.title}
                </span>
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

        {filteredQuestions.length === 0 && (
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
