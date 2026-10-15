"use client";

import { useState, useEffect } from "react";
import {
  getQuizForStudent,
  submitQuiz,
  type StudentQuizQuestion,
} from "../quiz-actions";
import ui from "@/components/student/student.module.css";

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

  if (loading) return <p className={ui.panelText}>Memuat kuis...</p>;
  if (!quiz)
    return (
      <p className={ui.panelText}>{error ?? "Kuis tidak ditemukan untuk materi ini."}</p>
    );

  const passed = score >= quiz.passScore;

  return (
    <div>
      <h2 className={ui.cardTitle}>{quiz.title}</h2>
      {!submitted && (
        <p className={ui.panelText} style={{ margin: 0 }}>
          {questions.length} soal · nilai lulus {quiz.passScore}
        </p>
      )}

      {!submitted ? (
        <div className={ui.quizList}>
          {questions.map((q, idx) => (
            <div key={q.id}>
              <p className={ui.quizQuestion}>
                <span className={ui.quizNumber}>{idx + 1}</span>
                {q.question_text}
              </p>
              <div className={ui.quizOptions}>
                {q.options.map((opt: string, i: number) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelect(q.id, i)}
                    aria-pressed={answers[q.id] === i}
                    className={`${ui.quizOption} ${
                      answers[q.id] === i ? ui.quizOptionSelected : ""
                    }`}
                  >
                    <span className={ui.quizLetter}>{String.fromCharCode(65 + i)}</span>
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div>
            <button
              type="button"
              className={ui.primaryBtn}
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length < questions.length}
            >
              {submitting ? "⏳ Memeriksa..." : "🚀 Kirim Kuis"}
            </button>
            {error && <p className={ui.errorText}>{error}</p>}
          </div>
        </div>
      ) : (
        <div className={ui.quizResult}>
          <div className={ui.quizResultEmoji}>{passed ? "🎉" : "📚"}</div>
          <h2 className={ui.heroTitle} style={{ fontSize: "1.6rem" }}>
            Skor kamu: {score}
          </h2>
          <p className={ui.panelText} style={{ margin: 0 }}>
            {passed
              ? "Keren, kamu lulus kuis ini!"
              : `Belum mencapai ${quiz.passScore}. Tetap semangat, coba lagi ya!`}
          </p>
          {xpAwarded > 0 && <span className={ui.quizXp}>+{xpAwarded} XP</span>}
          <div className={ui.heroActions} style={{ justifyContent: "center" }}>
            <button
              type="button"
              className={ui.secondaryBtn}
              onClick={() => window.location.reload()}
            >
              🔁 Coba Lagi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
