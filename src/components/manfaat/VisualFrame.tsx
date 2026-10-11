"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import styles from "./visual.module.css";

const TONES = {
  blue: { bg: "bg-blue-50", dot: "rgba(59, 130, 246, 0.22)" },
  orange: { bg: "bg-orange-50", dot: "rgba(249, 115, 22, 0.22)" },
  rose: { bg: "bg-rose-50", dot: "rgba(244, 63, 94, 0.2)" },
} as const;

export default function VisualFrame({
  label,
  tone,
  children,
}: {
  label: string;
  tone: keyof typeof TONES;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      const t = setTimeout(() => setSeen(true), 0);
      return () => clearTimeout(t);
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect(); // animasi sekali saja
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const { bg, dot } = TONES[tone];

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      style={{ "--dot": dot } as CSSProperties}
      className={`${styles.canvas} ${seen ? styles.in : ""} ${bg} relative w-full min-h-[280px] sm:h-[360px] rounded-3xl overflow-hidden shadow-xl ring-1 ring-slate-200/80 flex items-center justify-center p-4 sm:p-6`}
    >
      <div aria-hidden="true" className="w-full max-w-[490px]">
        {children}
      </div>
    </div>
  );
}
