"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function QuizView({ lessonId }: { lessonId: string }) {
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadQuiz() {
      const { data: quizData } = await supabase
        .from("quizzes")
        .select("*")
        .eq("lesson_id", lessonId)
        .single();

      if (quizData) {
        setQuiz(quizData);
        let questionData;
        if (quizData.is_dynamic) {
          const { data } = await supabase
            .from("question_bank")
            .select("*")
            .eq("category", quizData.target_category);

          // Randomize and limit in JS to ensure fresh experience
          questionData = (data || [])
            .sort(() => Math.random() - 0.5)
            .slice(0, quizData.question_count || 10);
        } else {
          const { data } = await supabase
            .from("quiz_questions")
            .select("*")
            .eq("quiz_id", quizData.id);
          questionData = data || [];
        }
        setQuestions(questionData);
      }
      setLoading(false);
    }
    loadQuiz();
  }, [lessonId]);

  const handleSelect = (questionId: string, index: number) => {
    if (submitted) return;
    setAnswers({ ...answers, [questionId]: index });
  };

  const handleSubmit = async () => {
    let correctCount = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_option_index) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / questions.length) * 100);
    setScore(finalScore);
    setSubmitted(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("submissions").insert({
        student_id: user.id,
        content_id: quiz.id,
        type: "quiz",
        data: answers,
        score: finalScore,
        status: "graded",
      });

      if (finalScore >= (quiz.pass_score || 70)) {
        await supabase.rpc("increment_xp", { user_id: user.id, amount: 50 });
      }
    }
  };

  if (loading) return <div>Memuat kuis...</div>;
  if (!quiz) return <div>Kuis tidak ditemukan untuk materi ini.</div>;

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
            disabled={Object.keys(answers).length < questions.length}
            style={{ marginTop: "20px" }}
          >
            Kirim Kuis
          </button>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "4rem", marginBottom: "16px" }}>
            {score >= (quiz.pass_score || 70) ? "🎉" : "📚"}
          </div>
          <h2>Skor Anda: {score}%</h2>
          <p style={{ color: "#64748B", marginTop: "8px" }}>
            {score >= (quiz.pass_score || 70)
              ? "Bagus sekali! Anda lulus."
              : "Tetap semangat dan coba lagi ya!"}
          </p>
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
