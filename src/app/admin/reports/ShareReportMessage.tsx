"use client";

import { useRef, useState, useTransition } from "react";
import { markSent } from "./actions";

export default function ShareReportMessage({
  reportId,
  message,
  waLink,
  alreadySent,
}: {
  reportId: string;
  message: string;
  waLink: string | null;
  alreadySent: boolean;
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
    <div style={{ marginBottom: "12px" }}>
      <textarea
        ref={textareaRef}
        readOnly
        value={message}
        rows={6}
        onFocus={(e) => e.currentTarget.select()}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          fontFamily: "inherit",
          fontSize: "0.85rem",
          lineHeight: 1.5,
          resize: "vertical",
          marginBottom: "8px",
        }}
      />
      {copyState === "manual" && (
        <p style={{ fontSize: "0.75rem", color: "#D97706", marginBottom: "8px" }}>
          Teks sudah dipilih. Tekan Ctrl+C untuk menyalin.
        </p>
      )}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button type="button" className="btn btn-primary" onClick={copy}>
          {copyState === "copied" ? "✅ Tersalin" : "📋 Salin Pesan"}
        </button>
        <button
          type="button"
          className="btn"
          disabled={pending}
          onClick={() => startTransition(() => markSent(reportId))}
        >
          ✔ {alreadySent ? "Tandai Terkirim Lagi" : "Tandai Terkirim"}
        </button>
        {waLink && (
          <button
            type="button"
            className="btn"
            disabled={pending}
            style={{ backgroundColor: "#22C55E", color: "white" }}
            onClick={openWa}
          >
            💬 Buka di WA
          </button>
        )}
      </div>
    </div>
  );
}
