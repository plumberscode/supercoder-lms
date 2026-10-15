"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./Celebration.module.css";

// Nilai minimal lulus tantangan; sama dengan syarat XP di server (css-actions dll.).
export const PASSING_SCORE = 70;

const VISIBLE_MS = 2800;
const EXIT_MS = 350;
const COUNT_DELAY_MS = 250;
const COUNT_MS = 900;
const COLORS = ["#ef4444", "#3b82f6", "#f59e0b", "#10b981", "#ffffff"];

interface CelebrationProps {
  score: number;
  // XP yang benar-benar diberikan server; 0 berarti sudah pernah lulus sebelumnya.
  xpEarned: number;
  onDone: () => void;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function Celebration({ score, xpEarned, onDone }: CelebrationProps) {
  const firstPass = xpEarned > 0;
  const target = firstPass ? xpEarned : score;
  const [count, setCount] = useState(() => (prefersReducedMotion() ? target : 0));
  const [leaving, setLeaving] = useState(false);
  const onDoneRef = useRef(onDone);
  const exitTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const dismiss = useCallback(() => {
    if (exitTimer.current) return;
    setLeaving(true);
    exitTimer.current = setTimeout(() => onDoneRef.current(), EXIT_MS);
  }, []);

  // Confetti: dua "meriam" dari sudut bawah selama ~1 detik, lalu satu ledakan di tengah.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let cancelled = false;
    let frame = 0;
    let burstTimer: ReturnType<typeof setTimeout> | undefined;

    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      const base = {
        colors: COLORS,
        disableForReducedMotion: true,
        zIndex: 10000,
        ticks: 260,
        gravity: 0.9,
        decay: 0.93,
        scalar: 0.9,
      };
      const end = Date.now() + 1000;
      const cannons = () => {
        confetti({ ...base, particleCount: 4, angle: 60, spread: 55, startVelocity: 58, origin: { x: 0, y: 0.9 } });
        confetti({ ...base, particleCount: 4, angle: 120, spread: 55, startVelocity: 58, origin: { x: 1, y: 0.9 } });
        if (!cancelled && Date.now() < end) frame = requestAnimationFrame(cannons);
      };
      cannons();
      burstTimer = setTimeout(() => {
        if (cancelled) return;
        confetti({ ...base, particleCount: 90, spread: 100, startVelocity: 36, origin: { x: 0.5, y: 0.42 } });
      }, 300);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      clearTimeout(burstTimer);
    };
  }, []);

  // Angka naik 0 → target dengan ease-out, mulai setelah kartu masuk.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let frame = 0;
    const startAt = performance.now() + COUNT_DELAY_MS;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - startAt) / COUNT_MS));
      setCount(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  useEffect(() => {
    const autoClose = setTimeout(dismiss, VISIBLE_MS);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(autoClose);
      window.removeEventListener("keydown", onKey);
    };
  }, [dismiss]);

  useEffect(() => () => clearTimeout(exitTimer.current), []);

  return createPortal(
    <div className={`${styles.layer} ${leaving ? styles.leaving : ""}`}>
      <div
        className={styles.card}
        role="status"
        aria-live="polite"
        onClick={dismiss}
        title="Klik untuk menutup"
      >
        <span className={styles.srOnly}>
          {firstPass
            ? `Kamu lulus dengan nilai ${score} dan mendapat ${xpEarned} XP!`
            : `Kamu lulus lagi dengan nilai ${score}!`}
        </span>
        <div aria-hidden="true">
          <div className={styles.emoji}>{firstPass ? "🏆" : "🎉"}</div>
          <div className={styles.title}>
            {firstPass ? "Keren, kamu lulus!" : "Mantap, lulus lagi!"}
          </div>
          <div
            className={`${styles.badge} ${firstPass ? styles.badgeXp : styles.badgeScore}`}
          >
            {firstPass ? (
              <>
                <span className={styles.value}>+{count}</span>
                <span className={styles.unit}>XP</span>
              </>
            ) : (
              <>
                <span className={styles.unit}>Nilai</span>
                <span className={styles.value}>{count}</span>
              </>
            )}
          </div>
          <div className={styles.sub}>
            {firstPass
              ? `Nilaimu ${score}. Terus pertahankan, ya!`
              : "XP-nya sudah kamu dapat sebelumnya. Terus asah kemampuanmu!"}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
