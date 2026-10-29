"use client";

import { useEffect } from "react";

/**
 * Animasi "muncul saat di-scroll" untuk seluruh homepage, pengganti GSAP + ScrollTrigger.
 * Satu IntersectionObserver + transisi CSS (.reveal-pending / .reveal-anim di globals.css),
 * jauh lebih ringan dari GSAP sehingga halaman lebih cepat tampil.
 *
 * Aman tanpa JS: elemen hanya disembunyikan setelah skrip ini jalan, dan elemen yang
 * sudah terlihat di layar saat itu tidak disentuh (tidak berkedip).
 */
type Rule = {
  /** Elemen yang dianimasikan */
  targets: string;
  /** Elemen pemicu; default: <section>/<footer> terdekat dari elemen pertama */
  trigger?: string;
  y?: number;
  scale?: number;
  /** Detik */
  duration?: number;
  stagger?: number;
  delay?: number;
  /** Posisi pemicu dari atas layar (0.85 = "top 85%") */
  start?: number;
};

// Nilai disalin dari animasi GSAP sebelumnya agar tampilannya sama
const RULES: Rule[] = [
  { targets: ".school-logo-item", y: 12, duration: 0.55, stagger: 0.04 },
  { targets: ".program-header", y: 20 },
  { targets: ".program-card", trigger: ".program-grid", y: 24, stagger: 0.07 },
  { targets: ".tech-header", y: 20 },
  { targets: ".tech-card", trigger: ".tech-container", y: 20, scale: 0.97, stagger: 0.05 },
  { targets: ".journey-header", y: 20 },
  { targets: ".journey-card", trigger: ".journey-grid", y: 24, stagger: 0.07 },
  { targets: ".karya-header", y: 20 },
  { targets: ".karya-track-wrap", trigger: ".karya-track-wrap", y: 24 },
  { targets: ".gallery-header", y: 20 },
  { targets: ".gallery-card", trigger: ".gallery-grid", y: 22, scale: 0.97, stagger: 0.06 },
  { targets: ".testi-header", y: 20 },
  { targets: ".testi-featured", trigger: ".testi-featured", y: 20 },
  { targets: ".testi-cards-wrap", trigger: ".testi-cards-wrap", y: 24 },
  { targets: ".faq-header", y: 20 },
  { targets: ".faq-item", trigger: ".faq-accordion", y: 18, duration: 0.55, stagger: 0.05 },
  { targets: ".cta-card", y: 24, scale: 0.97 },
  { targets: ".footer-content", y: 18, start: 0.9 },
];

export default function ScrollReveal() {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    type Item = { el: HTMLElement; ms: number; vars: [string, string][] };
    const groups = new Map<Element, { start: number; items: Item[] }>();

    for (const rule of RULES) {
      const els = Array.from(document.querySelectorAll<HTMLElement>(rule.targets));
      if (els.length === 0) continue;
      const trigger = rule.trigger
        ? document.querySelector(rule.trigger)
        : els[0].closest("section, footer");
      if (!trigger) continue;

      const start = rule.start ?? 0.85;
      const duration = rule.duration ?? 0.6;
      const group = groups.get(trigger) ?? { start, items: [] };
      els.forEach((el, i) => {
        const delay = (rule.delay ?? 0) + i * (rule.stagger ?? 0);
        group.items.push({
          el,
          ms: (duration + delay) * 1000,
          vars: [
            ["--reveal-y", `${rule.y ?? 24}px`],
            ["--reveal-scale", String(rule.scale ?? 1)],
            ["--reveal-dur", `${duration}s`],
            ["--reveal-delay", `${delay}s`],
          ],
        });
      });
      groups.set(trigger, group);
    }
    if (groups.size === 0) return;

    // Posisi pemicu dibaca dari callback pertama IntersectionObserver (bukan
    // getBoundingClientRect) agar tidak memaksa layout seluruh halaman saat hydration.
    const armed = new Set<Element>();
    const frames: number[] = [];
    const arm = (trigger: Element) => {
      const group = groups.get(trigger);
      if (!group) return;
      armed.add(trigger);
      for (const { el, vars } of group.items) {
        for (const [p, v] of vars) el.style.setProperty(p, v);
        el.classList.add("reveal-pending");
      }
      // Keadaan tersembunyi harus tergambar dulu, baru transisi diaktifkan
      frames.push(
        requestAnimationFrame(() =>
          frames.push(
            requestAnimationFrame(() => group.items.forEach(({ el }) => el.classList.add("reveal-anim"))),
          ),
        ),
      );
    };

    const timers: ReturnType<typeof setTimeout>[] = [];
    const reveal = (trigger: Element) => {
      const group = groups.get(trigger);
      if (!group) return;
      groups.delete(trigger);
      if (!armed.has(trigger)) return;
      for (const { el, ms } of group.items) {
        el.classList.remove("reveal-pending");
        // Setelah selesai, bersihkan agar transisi/hover bawaan elemen kembali normal
        timers.push(
          setTimeout(() => {
            el.classList.remove("reveal-anim");
            for (const p of ["--reveal-y", "--reveal-scale", "--reveal-dur", "--reveal-delay"]) {
              el.style.removeProperty(p);
            }
          }, ms + 100),
        );
      }
    };

    // Satu observer per posisi pemicu ("top 85%" / "top 90%")
    const seen = new Set<Element>();
    const observers = new Map<number, IntersectionObserver>();
    groups.forEach((g, trigger) => {
      let io = observers.get(g.start);
      if (!io) {
        io = new IntersectionObserver(
          (entries, observer) => {
            for (const entry of entries) {
              const passed = entry.isIntersecting || entry.boundingClientRect.top < 0;
              if (!seen.has(entry.target)) {
                seen.add(entry.target);
                // Callback pertama = posisi awal. Pemicu belum lewat: sembunyikan untuk dianimasikan.
                // Sudah lewat (mis. di layar pertama): reveal() melepasnya tanpa animasi.
                if (!passed) {
                  arm(entry.target);
                  continue;
                }
              }
              if (passed) {
                observer.unobserve(entry.target);
                reveal(entry.target);
              }
            }
          },
          { rootMargin: `0px 0px -${Math.round((1 - g.start) * 100)}% 0px` },
        );
        observers.set(g.start, io);
      }
      io.observe(trigger);
    });

    // Cetak halaman: tampilkan semua
    const revealAll = () => Array.from(groups.keys()).forEach(reveal);
    window.addEventListener("beforeprint", revealAll);

    return () => {
      window.removeEventListener("beforeprint", revealAll);
      observers.forEach((io) => io.disconnect());
      frames.forEach(cancelAnimationFrame);
      timers.forEach(clearTimeout);
    };
  }, []);

  return null;
}
