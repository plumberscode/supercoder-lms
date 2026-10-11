"use client";

import { useState, useTransition } from "react";
import { updateRegistrationStatus } from "./actions";

export default function StatusSelect({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [value, setValue] = useState(status);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <select
        name="status"
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          const prev = value;
          setValue(next);
          setError(null);
          startTransition(async () => {
            try {
              await updateRegistrationStatus(id, next);
            } catch {
              setValue(prev);
              setError("Gagal menyimpan");
            }
          });
        }}
        style={{
          padding: "6px 10px",
          borderRadius: "8px",
          border: "1px solid #CBD5E1",
          fontSize: "0.8rem",
          fontWeight: 600,
          backgroundColor: "#FFFFFF",
          cursor: pending ? "wait" : "pointer",
          opacity: pending ? 0.6 : 1,
        }}
      >
        <option value="pending">⏳ Menunggu</option>
        <option value="contacted">📞 Dihubungi</option>
        <option value="enrolled">✅ Terdaftar</option>
        <option value="cancelled">❌ Batal</option>
      </select>
      {error && (
        <div style={{ fontSize: "0.7rem", color: "#DC2626", marginTop: "4px" }}>
          {error}
        </div>
      )}
    </div>
  );
}
