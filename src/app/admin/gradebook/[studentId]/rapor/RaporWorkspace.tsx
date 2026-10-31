"use client";

import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Check, Plus } from "lucide-react";
import ReportView, { type ReportNotes } from "@/components/reports/ReportView";
import type { NoteField, NoteHint, ReportSnapshot } from "@/lib/reports";
import gb from "../../gradebook.module.css";
import styles from "./rapor.module.css";

type Notes = Record<NoteField, string>;

const FIELDS: { name: NoteField; label: string; tag?: string; placeholder: string }[] = [
  {
    name: "month_note",
    label: "Kegiatan bulan ini",
    tag: "Disorot paling atas",
    placeholder:
      "Contoh: Bulan ini ananda fokus belajar AI untuk persiapan lomba, sehingga belum mengerjakan soal di LMS.",
  },
  {
    name: "strengths",
    label: "Hal yang sudah dikuasai",
    placeholder: "Contoh: Cepat memahami konsep perulangan dan rajin bertanya.",
  },
  {
    name: "improvements",
    label: "Fokus pengembangan berikutnya",
    placeholder: "Contoh: Perlu lebih teliti membaca soal sebelum mengerjakan.",
  },
  {
    name: "parent_advice",
    label: "Dukungan belajar di rumah",
    placeholder: "Contoh: Ajak ananda menceritakan proyek yang sedang dibuat setiap minggu.",
  },
];

function Actions({
  isPublished,
  publishAction,
}: {
  isPublished: boolean;
  publishAction: (formData: FormData) => Promise<void>;
}) {
  const { pending } = useFormStatus();
  return (
    <div className={styles.row}>
      <button type="submit" className={`${gb.btnGhost} ${styles.asButton}`} disabled={pending}>
        Simpan
      </button>
      <button
        type="submit"
        formAction={publishAction}
        className={`${gb.btnMain} ${styles.asButton} ${styles.grow}`}
        disabled={pending}
      >
        {pending ? "Memproses…" : isPublished ? "Simpan & perbarui nilai" : "Simpan & terbitkan"}
      </button>
    </div>
  );
}

// Pratinjau ikut berubah saat guru mengetik, jadi hasilnya terlihat sebelum disimpan.
export default function RaporWorkspace({
  snapshot,
  initialNotes,
  hints,
  isPublished,
  previewNote,
  saveAction,
  publishAction,
  checks,
  sendPanel,
}: {
  snapshot: ReportSnapshot;
  initialNotes: ReportNotes;
  hints: NoteHint[];
  isPublished: boolean;
  previewNote: string;
  saveAction: (formData: FormData) => Promise<void>;
  publishAction: (formData: FormData) => Promise<void>;
  checks: ReactNode;
  sendPanel: ReactNode;
}) {
  const [notes, setNotes] = useState<Notes>({
    month_note: initialNotes.month_note ?? "",
    strengths: initialNotes.strengths ?? "",
    improvements: initialNotes.improvements ?? "",
    parent_advice: initialNotes.parent_advice ?? "",
  });
  const [used, setUsed] = useState<Set<string>>(() => new Set());
  const filled = FIELDS.filter((f) => notes[f.name].trim()).length;

  const addHint = (hint: NoteHint) => {
    setNotes((n) => {
      const prev = n[hint.field].trim();
      return { ...n, [hint.field]: prev ? `${prev} ${hint.text}` : hint.text };
    });
    setUsed((u) => new Set(u).add(hint.label));
  };

  return (
    <div className={styles.layout}>
      <section className={styles.previewCol} aria-label="Pratinjau rapor">
        <div className={gb.sectionHead}>
          <h2 className={gb.sectionTitle}>Pratinjau, seperti yang dilihat orang tua</h2>
          <span className={gb.sectionHint}>{previewNote}</span>
        </div>
        <div className={styles.previewFrame}>
          <ReportView snapshot={snapshot} notes={notes} />
        </div>
      </section>

      <aside className={styles.side} aria-label="Isi dan kirim rapor">
        {checks}

        <form action={saveAction} className={`${gb.panel} ${styles.card}`}>
          <div>
            <h2 className={styles.cardTitle}>Catatan guru</h2>
            <span className={styles.hint}>
              {filled} dari 4 terisi. Klik petunjuk untuk menyisipkannya ke catatan, lalu sunting seperlunya.
            </span>
          </div>

          {hints.length > 0 && (
            <div className={styles.field}>
              <span className={styles.hintLabel}>Petunjuk dari data</span>
              <div className={styles.hints}>
                {hints.map((h) => {
                  const isUsed = used.has(h.label);
                  return (
                    <button
                      key={h.label}
                      type="button"
                      className={`${styles.hintChip} ${isUsed ? styles.hintUsed : ""}`}
                      onClick={() => addHint(h)}
                      title={h.text}
                    >
                      {isUsed ? <Check size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
                      {h.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {FIELDS.map((f) => (
            <label key={f.name} className={styles.field}>
              <span className={styles.fieldLabel}>
                {f.label}
                {f.tag && <span className={styles.fieldTag}>{f.tag}</span>}
              </span>
              <textarea
                name={f.name}
                value={notes[f.name]}
                onChange={(e) => setNotes((n) => ({ ...n, [f.name]: e.target.value }))}
                placeholder={f.placeholder}
                className={styles.textarea}
              />
            </label>
          ))}

          <Actions isPublished={isPublished} publishAction={publishAction} />
          <span className={styles.hint}>
            {isPublished
              ? "“Simpan” hanya mengubah catatan. “Perbarui nilai” juga mengambil ulang nilai terbaru bulan ini; link rapor tetap sama."
              : "Terbitkan membekukan nilai bulan ini dan membuat link rapor untuk orang tua."}
          </span>
        </form>

        {sendPanel}
      </aside>
    </div>
  );
}
