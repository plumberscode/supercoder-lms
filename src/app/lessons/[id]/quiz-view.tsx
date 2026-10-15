"use client";

import { useState, useEffect } from "react";
import {
  getQuizForStudent,
  submitQuiz,
  type StudentQuizQuestion,
} from "../quiz-actions";

// Soal diambil tanpa kunci jawaban, dan dinilai di server (quiz-actions.ts).
export default function QuizView({ lessonId }: { lessonId: string }) {
  const [quiz, setQuiz] = useState<{ id: string; title: string; passScore: number } | null>(null);
  const [questions, setQuestions] = useState<StudentQuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getQuizForStudent(lessonId).then((result) => {
      if ("error" in result) setError(result.error);
      else {
        setQuiz(result.quiz);
        setQuestions(result.questions);
      }
      setLoading(false);
    });
  }, [lessonId]);

  const handleSelect = (questionId: string, index: number) => {
    if (submitted) return;
    setAnswers({ ...answers, [questionId]: index });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    const result = await submitQuiz(lessonId, answers);
    setSubmitting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setScore(result.score);
    setXpAwarded(result.xpAwarded);
    setSubmitted(true);
  };

  if (loading) return <div>Memuat kuis...</div>;
  if (!quiz) return <div>{error ?? "Kuis tidak ditemukan untuk materi ini."}</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "24px" }}>{quiz.title}</h2>

      {!submitted ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {questions.map((q, idx) => (
            <div key={q.id}>
              <p style={{ fontWeight: 600, marginBottom: "16px" }}>
                {idx + 1}. {q.question_text}
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: "12px",
                }}
              >
                {q.options.map((opt: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(q.id, i)}
                    style={{
                      textAlign: "left",
                      padding: "16px",
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                      backgroundColor:
                        answers[q.id] === i ? "var(--secondary)" : "white",
                      color: answers[q.id] === i ? "white" : "var(--secondary)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting || Object.keys(answers).length < questions.length}
            style={{ marginTop: "20px" }}
          >
            {submitting ? "Memeriksa..." : "Kirim Kuis"}
          </button>
          {error && <p style={{ color: "#DC2626", margin: 0 }}>{error}</p>}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "4rem", marginBottom: "16px" }}>
            {score >= quiz.passScore ? "🎉" : "📚"}
          </div>
          <h2>Skor Anda: {score}%</h2>
          <p style={{ color: "#64748B", marginTop: "8px" }}>
            {score >= quiz.passScore
              ? "Bagus sekali! Anda lulus."
              : "Tetap semangat dan coba lagi ya!"}
          </p>
          {xpAwarded > 0 && (
            <p style={{ color: "#F97316", fontWeight: 700, marginTop: "8px" }}>
              +{xpAwarded} XP
            </p>
          )}
          <button
            className="btn btn-secondary"
            style={{ marginTop: "24px" }}
            onClick={() => window.location.reload()}
          >
            Coba Lagi
          </button>
        </div>
      )}
    </div>
  );
}
