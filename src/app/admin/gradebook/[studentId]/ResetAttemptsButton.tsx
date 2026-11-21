"use client";

import { useRef, useState, useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { MAX_ATTEMPTS } from "@/lib/attempts";
import { resetSubmissionAttempts } from "../actions";
import styles from "../gradebook.module.css";

export default function ResetAttemptsButton({
  submissionId,
  studentName,
  lesson,
  disabled,
}: {
  submissionId: string;
  studentName: string;
  lesson: string;
  disabled: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const confirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await resetSubmissionAttempts(submissionId);
      if (result.ok) dialogRef.current?.close();
      else setError(result.message);
    });
  };

  return (
    <>
      <button
        type="button"
        className={styles.codeBtn}
        onClick={() => {
          setError(null);
          dialogRef.current?.showModal();
        }}
        disabled={disabled || pending}
        title={disabled ? "Belum ada jatah yang terpakai" : undefined}
      >
        <RotateCcw size={14} aria-hidden="true" />
        {pending ? "Mereset..." : "Reset jatah"}
      </button>
      <dialog
        ref={dialogRef}
        className={styles.codeDialog}
        style={{ width: "min(440px, calc(100vw - 32px))" }}
        aria-label="Konfirmasi reset jatah penilaian"
        onClick={(e) => {
          if (e.target === e.currentTarget && !pending) e.currentTarget.close();
        }}
      >
        <div className={styles.codeDialogInner}>
          <span className={styles.strong} style={{ fontSize: "1rem" }}>
            Reset jatah penilaian?
          </span>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "#334155", lineHeight: 1.5 }}>
            Beri <strong>{studentName}</strong> {MAX_ATTEMPTS} kesempatan penilaian lagi untuk soal{" "}
            <strong>{lesson}</strong>? Riwayat nilai dan nilai terbaik tetap tersimpan.
          </p>
          {error && (
            <p role="alert" style={{ margin: 0, fontSize: "0.8125rem", color: "#b91c1c" }}>
              {error}
            </p>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              type="button"
              className={styles.btnGhost}
              onClick={() => dialogRef.current?.close()}
              disabled={pending}
            >
              Batal
            </button>
            <button type="button" className={styles.btnMain} onClick={confirm} disabled={pending}>
              {pending ? "Mereset..." : "Ya, reset jatah"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
