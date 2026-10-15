"use client";

import { useState, useTransition } from "react";
import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/components/ToastProvider";
import { resetMinasPassword, type MinasCredential } from "./actions";

export default function ResetPasswordButton({
  userId,
  studentName,
  onReset,
}: {
  userId: string;
  studentName: string;
  onReset: (credential: MinasCredential) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { showToast } = useToast();

  const submit = () => {
    setConfirmOpen(false);
    startTransition(async () => {
      const result = await resetMinasPassword(userId);
      if (result.ok) onReset(result.credential);
      else showToast(result.message, "error");
    });
  };

  return (
    <>
      <button
        type="button"
        className="btn"
        disabled={pending}
        onClick={() => setConfirmOpen(true)}
        style={{ padding: "6px 12px", fontSize: "0.75rem", whiteSpace: "nowrap" }}
      >
        {pending ? "Memproses..." : "Reset Password"}
      </button>
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={submit}
        title="Reset password?"
        message={`Password lama ${studentName} tidak bisa dipakai lagi. Password baru akan tampil sekali di atas daftar siswa.`}
        confirmText="Reset"
        type="warning"
      />
    </>
  );
}
