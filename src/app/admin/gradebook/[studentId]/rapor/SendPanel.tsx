"use client";

import { useRef, useState, useTransition } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { markSent } from "@/app/admin/reports/actions";
import gb from "../../gradebook.module.css";
import styles from "./rapor.module.css";

export default function SendPanel({
  reportId,
  message,
  waLink,
  publicUrl,
  sentLabel,
  unpublishAction,
}: {
  reportId: string;
  message: string;
  waLink: string | null;
  publicUrl: string;
  sentLabel: string | null;
  unpublishAction: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const [copyState, setCopyState] = useState<"idle" | "copied" | "manual">("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      // Clipboard API bisa ditolak browser; pilih teksnya agar admin cukup tekan Ctrl+C.
      textareaRef.current?.select();
      setCopyState("manual");
    }
  };

  const openWa = () => {
    if (!waLink) return;
    // Nama tab tetap agar klik berikutnya memakai tab WhatsApp yang sama, bukan tab baru.
    const win = window.open(waLink, "supercoder-wa");
    try {
      if (win) win.opener = null;
    } catch {
      // Tab lama sudah beda origin; abaikan.
    }
    startTransition(() => markSent(reportId));
  };

  return (
    <>
      <textarea
        ref={textareaRef}
        readOnly
        value={message}
        rows={6}
        onFocus={(e) => e.currentTarget.select()}
        className={styles.message}
        aria-label="Pesan WhatsApp untuk orang tua"
      />
      {copyState === "manual" && (
        <span className={`${styles.hint} ${styles.warn}`}>Teks sudah dipilih. Tekan Ctrl+C untuk menyalin.</span>
      )}
      <a href={publicUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
        {publicUrl}
      </a>
      <div className={styles.row}>
        <button type="button" className={`${gb.btnGhost} ${styles.asButton}`} onClick={copy}>
          {copyState === "copied" ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          {copyState === "copied" ? "Tersalin" : "Salin pesan"}
        </button>
        {waLink ? (
          <button type="button" className={`${styles.btnWa} ${styles.grow}`} disabled={pending} onClick={openWa}>
            <MessageCircle size={16} aria-hidden="true" />
            {sentLabel ? "Kirim ulang via WhatsApp" : "Buka WhatsApp & tandai terkirim"}
          </button>
        ) : (
          <button
            type="button"
            className={`${gb.btnGhost} ${styles.asButton} ${styles.grow}`}
            disabled={pending}
            onClick={() => startTransition(() => markSent(reportId))}
          >
            <Check size={16} aria-hidden="true" />
            Tandai terkirim
          </button>
        )}
      </div>
      <div className={styles.row} style={{ justifyContent: "space-between" }}>
        <span className={styles.hint}>{sentLabel ?? "Belum dikirim"}</span>
        <form action={unpublishAction}>
          <button type="submit" className={styles.btnDanger}>
            Tarik ke draf
          </button>
        </form>
      </div>
    </>
  );
}
