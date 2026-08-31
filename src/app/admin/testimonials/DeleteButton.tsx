"use client";

import { useState } from "react";
import { deleteTestimonial } from "./actions";
import { Trash2 } from "lucide-react";

export default function DeleteButton({
  testimonialId,
}: {
  testimonialId: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm("Apakah Anda yakin ingin menghapus testimoni ini?")) {
      setIsDeleting(true);
      try {
        await deleteTestimonial(testimonialId);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Gagal menghapus testimoni";
        alert(message);
        setIsDeleting(false);
      }
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        backgroundColor: "#FEE2E2",
        color: "#DC2626",
        border: "1px solid #FCA5A5",
        borderRadius: "8px",
        fontSize: "0.8rem",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
      className="hover:bg-red-200"
      title="Hapus Testimoni"
    >
      <Trash2 className="w-4 h-4" />
      <span>{isDeleting ? "Menghapus..." : "Hapus"}</span>
    </button>
  );
}
