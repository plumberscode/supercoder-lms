"use client";

import { useState, useTransition } from "react";
import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/components/ToastProvider";
import { setStudentActive } from "./actions";

export default function StudentActiveToggle({
  userId,
  studentName,
  isActive,
}: {
  userId: string;
  studentName: string;
  isActive: boolean;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { showToast } = useToast();

  const submit = (active: boolean) => {
    setConfirmOpen(false);
    startTransition(async () => {
      const result = await setStudentActive(userId, active);
      if (result) showToast(result.message, result.ok ? "success" : "error");
    });
  };

  return (
    <>
      <button
        type="button"
        className={isActive ? "btn" : "btn btn-primary"}
        disabled={pending}
        onClick={() => (isActive ? setConfirmOpen(true) : submit(true))}
        style={{ padding: "6px 12px", fontSize: "0.75rem", whiteSpace: "nowrap" }}
      >
        {pending ? "Memproses..." : isActive ? "Nonaktifkan" : "Aktifkan Kembali"}
      </button>
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => submit(false)}
        title="Nonaktifkan siswa?"
        message={`${studentName} tidak bisa lagi mengakses materi dan tidak muncul di leaderboard, buku nilai, maupun rapor baru. Semua data belajarnya tetap tersimpan dan bisa diaktifkan kembali kapan saja.`}
        confirmText="Nonaktifkan"
        type="warning"
      />
    </>
  );
}
