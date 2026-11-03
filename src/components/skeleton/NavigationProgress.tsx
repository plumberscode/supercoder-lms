"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import styles from "./Skeleton.module.css";

/** Batas aman: bar disembunyikan bila navigasi tak kunjung selesai (mis. dibatalkan). */
const MAX_DURATION_MS = 15000;

function isInternalNavigation(event: MouseEvent): boolean {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;

  const anchor = (event.target as Element | null)?.closest?.("a");
  if (!anchor || !anchor.href) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;

  const next = new URL(anchor.href, window.location.href);
  const current = window.location;
  if (next.origin !== current.origin) return false;
  // Link ke anchor di halaman yang sama (#bagian) bukan perpindahan halaman.
  return next.pathname !== current.pathname || next.search !== current.search;
}

/**
 * Garis progres tipis di atas layar yang langsung muncul saat link diklik,
 * supaya pengguna tahu klik-nya diproses walau server belum membalas.
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState<number | null>(null);
  const timers = useRef<number[]>([]);
  const active = useRef(false);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  useEffect(() => {
    const start = () => {
      clearTimers();
      active.current = true;
      setProgress(0.08);
      // Maju cepat di awal lalu melambat, tanpa pernah mencapai 100%.
      [
        [50, 0.3],
        [400, 0.55],
        [1200, 0.72],
        [2500, 0.85],
        [5000, 0.92],
      ].forEach(([delay, value]) => {
        timers.current.push(window.setTimeout(() => setProgress(value), delay));
      });
      timers.current.push(
        window.setTimeout(() => {
          active.current = false;
          setProgress(null);
        }, MAX_DURATION_MS),
      );
    };

    const onClick = (event: MouseEvent) => {
      if (isInternalNavigation(event)) start();
    };

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      clearTimers();
    };
  }, []);

  // URL berubah = halaman baru sudah tampil (skeleton atau konten), selesaikan bar.
  useEffect(() => {
    if (!active.current) return;
    active.current = false;
    clearTimers();
    setProgress(1);
    timers.current.push(window.setTimeout(() => setProgress(null), 300));
  }, [pathname, searchParams]);

  if (progress === null) return null;

  return (
    <div
      className={styles.progress}
      style={{ transform: `scaleX(${progress})`, opacity: progress === 1 ? 0 : 1 }}
      aria-hidden="true"
    />
  );
}
