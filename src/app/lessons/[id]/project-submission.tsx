"use client";

import { useState } from "react";
import { submitProject } from "../quiz-actions";
import ui from "@/components/student/student.module.css";

export default function ProjectSubmission({ lessonId }: { lessonId: string }) {
  const [link, setLink] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await submitProject(lessonId, link);
    if ("error" in result) setError(result.error);
    else setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className={ui.contentCard}>
      <h3 className={ui.cardTitle}>📦 Pengumpulan Proyek</h3>

      {!submitted ? (
        <form onSubmit={handleSubmit}>
          <p className={ui.panelText}>
            Kirim link proyekmu (Google Drive, GitHub, atau Loom).
          </p>
          <div className={ui.formRow}>
            <input
              type="url"
              placeholder="https://drive.google.com/..."
              required
              className={ui.textInput}
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            <button className={ui.primaryBtn} type="submit" disabled={loading}>
              {loading ? "⏳ Mengirim..." : "🚀 Kirim Proyek"}
            </button>
          </div>
          {error && <p className={ui.errorText}>{error}</p>}
        </form>
      ) : (
        <div className={ui.successBox}>
          <span>✅</span>
          <div>
            <div style={{ fontWeight: 700 }}>Proyek berhasil dikirim!</div>
            <div style={{ fontSize: "0.875rem" }}>
              Instruktur akan meninjau dan memberi nilai segera.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
