"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, Copy, Check, PartyPopper } from "lucide-react";
import { PROMO_VOUCHER_CODE } from "@/lib/promo";

// Kampanye 9.9: diskon Rp50.000/bulan selamanya.
// Pendaftaran ditutup H+3 dari hari ini, tapi tidak pernah melewati akhir bulan September.
function getCampaignDeadline(now: Date): Date {
  const rollingDeadline = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const endOfSeptember = new Date(
    now.getFullYear(),
    8, // September (0-indexed)
    30,
    23,
    59,
    59,
    999,
  );
  return rollingDeadline < endOfSeptember ? rollingDeadline : endOfSeptember;
}

function isCampaignOver(now: Date): boolean {
  const endOfSeptember = new Date(
    now.getFullYear(),
    8,
    30,
    23,
    59,
    59,
    999,
  );
  return now.getTime() > endOfSeptember.getTime();
}

function formatDeadline(deadline: Date): string {
  return deadline.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PromoStickyBar() {
  const barRef = useRef<HTMLDivElement>(null);
  const [ended, setEnded] = useState(false);
  const [deadlineText, setDeadlineText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Keep Navbar (and page content) offset in sync with this bar's real height.
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;

    const setHeightVar = () => {
      document.documentElement.style.setProperty(
        "--promo-bar-height",
        `${el.offsetHeight}px`,
      );
    };

    setHeightVar();
    const observer = new ResizeObserver(setHeightVar);
    observer.observe(el);

    return () => {
      observer.disconnect();
      document.documentElement.style.setProperty("--promo-bar-height", "0px");
    };
  }, [ended]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      if (isCampaignOver(now)) {
        setEnded(true);
        return;
      }
      const deadline = getCampaignDeadline(now);
      setDeadlineText(formatDeadline(deadline));
    };

    tick();
    const interval = setInterval(tick, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (ended) return null;

  const handleCopyVoucher = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(PROMO_VOUCHER_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — silently ignore, code is still visible to copy manually.
    }
  };

  return (
    <div
      ref={barRef}
      className="fixed top-0 inset-x-0 z-[60] bg-[linear-gradient(120deg,#f97316_0%,#ec4899_45%,#a855f7_100%)] text-white shadow-md shadow-black/10"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 sm:py-2 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="inline-flex items-center gap-1 bg-white/20 border border-white/30 rounded-full px-2.5 py-0.5 text-[11px] sm:text-xs font-black uppercase tracking-wider backdrop-blur-xs">
            <PartyPopper className="w-3.5 h-3.5" />
            Promo 9.9
          </span>
          <p className="text-xs sm:text-sm font-poppins font-bold leading-tight">
            Diskon{" "}
            <span className="underline decoration-white/60 decoration-2 underline-offset-2">
              Rp50.000/bulan SELAMANYA
            </span>{" "}
            untuk pendaftar baru
            {deadlineText && (
              <span className="hidden sm:inline">
                {" "}
                — berlaku hingga {deadlineText}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyVoucher}
            title="Salin kode voucher"
            className="inline-flex items-center gap-1.5 bg-white/95 hover:bg-white text-purple-700 font-mono font-black text-[11px] sm:text-xs tracking-wider px-2.5 py-1 rounded-lg border border-white/60 shadow-sm transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {PROMO_VOUCHER_CODE}
          </button>

          <Link
            href={`/daftar?voucher=${PROMO_VOUCHER_CODE}`}
            className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-poppins font-bold text-[11px] sm:text-xs px-3.5 py-1.5 rounded-full shadow-sm transition-all hover:scale-[1.03]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Klaim Sekarang
          </Link>
        </div>
      </div>

      {deadlineText && (
        <div className="sm:hidden text-center pb-1.5 text-[11px] font-semibold">
          Berlaku hingga {deadlineText}
        </div>
      )}
    </div>
  );
}
