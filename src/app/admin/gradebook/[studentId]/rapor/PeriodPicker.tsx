"use client";

import { useRouter } from "next/navigation";
import styles from "./rapor.module.css";

export default function PeriodPicker({
  value,
  options,
}: {
  value: string;
  options: { value: string; label: string; href: string }[];
}) {
  const router = useRouter();
  return (
    <label className={styles.periodLabel}>
      Periode
      <select
        className={styles.periodSelect}
        value={value}
        onChange={(e) => {
          const target = options.find((o) => o.value === e.target.value);
          if (target) router.push(target.href);
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
