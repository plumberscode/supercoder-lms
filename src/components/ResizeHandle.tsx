"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import styles from "./ResizeHandle.module.css";

export interface PanelSize {
  /** Ukuran (px) hasil geseran user; null = pakai ukuran default dari CSS */
  size: number | null;
  setSize: (v: number | null) => void;
  /** Simpan ke localStorage (dipanggil saat geseran selesai); null menghapus */
  commit: (v: number | null) => void;
}

/** Ukuran panel yang diingat per browser. Aman bila localStorage tidak tersedia. */
export function usePanelSize(storageKey: string): PanelSize {
  const [size, setSize] = useState<number | null>(null);

  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(storageKey));
      // Dibaca setelah mount (bukan di initial state) agar HTML server & klien tetap sama
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (Number.isFinite(v) && v > 0) setSize(v);
    } catch {
      /* localStorage tidak tersedia */
    }
  }, [storageKey]);

  const commit = useCallback(
    (v: number | null) => {
      try {
        if (v === null) localStorage.removeItem(storageKey);
        else localStorage.setItem(storageKey, String(Math.round(v)));
      } catch {
        /* abaikan */
      }
    },
    [storageKey],
  );

  return { size, setSize, commit };
}

interface Props {
  /** "x": pembatas vertikal (geser kiri-kanan), "y": pembatas horizontal (geser atas-bawah) */
  axis: "x" | "y";
  panel: PanelSize;
  label: string;
  /** Ukuran minimum panel yang diubah (px) */
  min: number;
  /** Ruang (px) yang harus tersisa untuk panel lain di dalam induk */
  reserve: number;
  /**
   * Panel yang diubah ukurannya. Default: saudara sebelum handle (axis x)
   * atau sesudah handle (axis y, panel di bawah handle: geser ke atas = membesar).
   */
  targetRef?: RefObject<HTMLElement | null>;
}

const KEY_STEP = 24;

export default function ResizeHandle({ axis, panel, label, min, reserve, targetRef }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ start: 0, startSize: 0 });

  const getTarget = () =>
    targetRef?.current ??
    ((axis === "x" ? ref.current?.previousElementSibling : ref.current?.nextElementSibling) as HTMLElement | null);

  const measure = (el: HTMLElement) => (axis === "x" ? el.getBoundingClientRect().width : el.getBoundingClientRect().height);

  const clamp = (v: number) => {
    const parent = ref.current?.parentElement;
    const total = parent ? (axis === "x" ? parent.clientWidth : parent.clientHeight) : Infinity;
    return Math.round(Math.max(min, Math.min(v, Math.max(min, total - reserve))));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = getTarget();
    if (!target) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { start: axis === "x" ? e.clientX : e.clientY, startSize: measure(target) };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const delta = (axis === "x" ? e.clientX : e.clientY) - drag.current.start;
    panel.setSize(clamp(axis === "x" ? drag.current.startSize + delta : drag.current.startSize - delta));
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(false);
    panel.commit(panel.size);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const grow = axis === "x" ? "ArrowRight" : "ArrowUp";
    const shrink = axis === "x" ? "ArrowLeft" : "ArrowDown";
    if (e.key !== grow && e.key !== shrink) return;
    const target = getTarget();
    if (!target) return;
    e.preventDefault();
    const next = clamp((panel.size ?? measure(target)) + (e.key === grow ? KEY_STEP : -KEY_STEP));
    panel.setSize(next);
    panel.commit(next);
  };

  const reset = () => {
    panel.setSize(null);
    panel.commit(null);
  };

  // Cegah seleksi teks & kursor berganti selama geser
  useEffect(() => {
    if (!dragging) return;
    const prevSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = axis === "x" ? "col-resize" : "row-resize";
    return () => {
      document.body.style.userSelect = prevSelect;
      document.body.style.cursor = prevCursor;
    };
  }, [dragging, axis]);

  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation={axis === "x" ? "vertical" : "horizontal"}
      aria-label={label}
      title="Geser untuk mengubah ukuran (klik dua kali untuk reset)"
      tabIndex={0}
      className={`${axis === "x" ? styles.handleX : styles.handleY} ${dragging ? styles.active : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      onDoubleClick={reset}
    />
  );
}
