"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Code2, X } from "lucide-react";
import { getSubmissionCode, type SubmissionCode } from "../actions";
import styles from "../gradebook.module.css";

export default function StudentCodeButton({
  submissionId,
  lesson,
  submittedAt,
}: {
  submissionId: string;
  lesson: string;
  submittedAt: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [result, setResult] = useState<SubmissionCode | null>(null);
  const [tab, setTab] = useState(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (result) dialogRef.current?.showModal();
  }, [result]);

  const open = () => {
    if (result) {
      dialogRef.current?.showModal();
      return;
    }
    startTransition(async () => {
      setTab(0);
      setResult(await getSubmissionCode(submissionId));
    });
  };

  const files = result?.ok ? result.files : [];
  const active = files[Math.min(tab, files.length - 1)];

  return (
    <>
      <button type="button" className={styles.codeBtn} onClick={open} disabled={pending}>
        <Code2 size={14} aria-hidden="true" />
        {pending ? "Memuat..." : "Lihat kode"}
      </button>
      <dialog
        ref={dialogRef}
        className={styles.codeDialog}
        aria-label={`Kode siswa: ${lesson}`}
        onClick={(e) => {
          // Klik di luar kotak dialog menutupnya.
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <div className={styles.codeDialogInner}>
          <div className={styles.codeDialogHead}>
            <div className={styles.stack} style={{ gap: 2 }}>
              <span className={styles.strong}>{lesson}</span>
              <span className={styles.muted}>Dikirim {submittedAt}</span>
            </div>
            <button
              type="button"
              className={styles.codeClose}
              onClick={() => dialogRef.current?.close()}
              aria-label="Tutup"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {result && !result.ok && <p className={styles.muted}>{result.message}</p>}

          {result?.ok && result.link && (
            <a href={result.link} target="_blank" rel="noopener noreferrer" className={styles.codeLink}>
              {result.link}
            </a>
          )}

          {result?.ok && files.length > 1 && (
            <div className={styles.codeTabs} role="tablist">
              {files.map((f, i) => (
                <button
                  key={f.label}
                  type="button"
                  role="tab"
                  aria-selected={f === active}
                  className={`${styles.codeTab} ${f === active ? styles.codeTabActive : ""}`}
                  onClick={() => setTab(i)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {active && <pre className={styles.codeBlock}>{active.content}</pre>}

          {result?.ok && files.length === 0 && !result.link && (
            <p className={styles.muted}>Tidak ada kode yang tersimpan pada kiriman ini.</p>
          )}
        </div>
      </dialog>
    </>
  );
}
