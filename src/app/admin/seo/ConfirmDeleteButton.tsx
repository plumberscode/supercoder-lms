"use client";

import { useState } from "react";

export default function ConfirmDeleteButton({
  action,
  confirmText,
  label = "Hapus",
}: {
  action: () => Promise<void>;
  confirmText: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    if (!confirm(confirmText)) return;
    setBusy(true);
    try {
      await action();
    } catch (err) {
      // redirect() dari server action juga lewat sini sebagai error khusus Next — biarkan
      if (err instanceof Error && !err.message.includes("NEXT_REDIRECT")) alert(err.message);
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      disabled={busy}
      className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50 cursor-pointer"
    >
      {busy ? "Menghapus..." : label}
    </button>
  );
}
