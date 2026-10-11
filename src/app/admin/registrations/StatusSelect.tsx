"use client";

import { useState, useTransition } from "react";
import { updateRegistrationStatus } from "./actions";
import styles from "./registrations.module.css";

export default function StatusSelect({
  id,
  status,
  label,
}: {
  id: string;
  status: string;
  label: string;
}) {
  const [value, setValue] = useState(status);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <select
        name="status"
        aria-label={label}
        className={styles.select}
        data-status={value}
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
      >
        <option value="pending">⏳ Menunggu</option>
        <option value="contacted">📞 Dihubungi</option>
        <option value="enrolled">✅ Terdaftar</option>
        <option value="cancelled">❌ Batal</option>
      </select>
      {error && <div className={styles.selectError}>{error}</div>}
    </div>
  );
}
