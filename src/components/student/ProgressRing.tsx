import styles from "./student.module.css";

const R = 52;
const CIRC = 2 * Math.PI * R;

/** Cincin progres bergaya cincin XP dashboard (gradien oranye → merah). */
export default function ProgressRing({
  percent,
  value,
  label,
}: {
  percent: number;
  value: string | number;
  label: string;
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  const gradientId = `ringGrad-${label.replace(/\W+/g, "")}`;

  return (
    <div className={styles.ringWrap}>
      <svg width="128" height="128" viewBox="0 0 128 128" className={styles.ringSvg} aria-hidden="true">
        <circle cx="64" cy="64" r={R} fill="none" stroke="#e2e8f0" strokeWidth="12" />
        <circle
          cx="64"
          cy="64"
          r={R}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - clamped / 100)}
          transform="rotate(-90 64 64)"
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
      </svg>
      <div className={styles.ringCenter}>
        <span className={styles.ringNumber}>{value}</span>
        <span className={styles.ringLabel}>{label}</span>
      </div>
    </div>
  );
}
