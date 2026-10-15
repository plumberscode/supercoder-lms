"use client";

import { useState } from "react";
import { submitProject } from "../quiz-actions";

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
    <div
      className="card"
      style={{ border: "2px dashed var(--border)", backgroundColor: "#F8FAFC" }}
    >
      <h3 style={{ marginBottom: "16px" }}>Pengumpulan Proyek</h3>

      {!submitted ? (
        <form onSubmit={handleSubmit}>
          <p
            style={{
              color: "#64748B",
              fontSize: "0.875rem",
              marginBottom: "20px",
            }}
          >
            Silakan kirim link proyek Anda (Google Drive, GitHub, atau Loom).
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <input
              type="url"
              placeholder="https://drive.google.com/..."
              required
              style={{ flex: 1, minWidth: "200px" }}
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
            >
              {loading ? "Mengirim..." : "Kirim Proyek"}
            </button>
          </div>
          {error && (
            <p style={{ color: "#DC2626", fontSize: "0.875rem", marginTop: "12px" }}>
              {error}
            </p>
          )}
        </form>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            color: "var(--success)",
          }}
        >
          <span>✅</span>
          <div>
            <div style={{ fontWeight: 600 }}>Proyek Berhasil Dikirim!</div>
            <div style={{ fontSize: "0.875rem" }}>
              Instruktur akan meninjau dan memberi nilai segera.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
