"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QuizSourcePicker from "@/components/admin/QuizSourcePicker";
import { useToast } from "@/components/ToastProvider";
import {
  availableCount,
  type ModuleOption,
  type QuestionBankSummary,
} from "@/lib/question-bank-summary";
import { validateSources, type QuizSource } from "@/lib/quiz-sources";
import { updateQuizSettings } from "../actions";

export default function QuizSettingsForm({
  lessonId,
  initialDynamic,
  initialSources,
  modules,
  bank,
}: {
  lessonId: string;
  initialDynamic: boolean;
  initialSources: QuizSource[];
  modules: ModuleOption[];
  bank: QuestionBankSummary;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isDynamic, setIsDynamic] = useState(initialDynamic);
  const [sources, setSources] = useState(initialSources);
  const [saving, setSaving] = useState(false);

  const sourceError = isDynamic
    ? validateSources(sources, (s) => availableCount(bank, s))
    : null;

  const save = async () => {
    setSaving(true);
    const result = await updateQuizSettings(lessonId, isDynamic, sources);
    setSaving(false);
    if ("error" in result) {
      showToast(result.error, "error");
      return;
    }
    showToast("Pengaturan kuis disimpan.", "success");
    router.refresh();
  };

  return (
    <div className="card" style={{ marginBottom: "32px" }}>
      <h2 style={{ fontSize: "1.25rem", marginBottom: "16px" }}>
        Pengaturan Kuis
      </h2>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: "16px",
        }}
      >
        <input
          type="checkbox"
          checked={isDynamic}
          onChange={(e) => setIsDynamic(e.target.checked)}
          style={{ width: "20px", height: "20px" }}
        />
        Gunakan Bank Soal (Kuis Dinamis)
      </label>

      {isDynamic ? (
        <QuizSourcePicker
          modules={modules}
          bank={bank}
          value={sources}
          onChange={setSources}
          error={sourceError}
        />
      ) : (
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748B" }}>
          Mode Statik: siswa mengerjakan soal yang ditambahkan manual di bawah.
        </p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={saving || !!sourceError}
        className="btn btn-primary"
        style={{ marginTop: "16px" }}
      >
        {saving ? "Menyimpan..." : "Simpan Pengaturan"}
      </button>
    </div>
  );
}
