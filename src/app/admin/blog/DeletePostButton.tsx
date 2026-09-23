"use client";

import { useState } from "react";
import { deletePost } from "./actions";

export default function DeletePostButton({ id, title }: { id: string; title: string }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Hapus artikel "${title}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setDeleting(true);
    try {
      await deletePost(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus artikel");
      setDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50 cursor-pointer"
    >
      {deleting ? "Menghapus..." : "Hapus"}
    </button>
  );
}
