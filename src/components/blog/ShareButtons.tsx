"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const text = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);

  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${text}%20${encodedUrl}` },
    { label: "X", href: `https://x.com/intent/post?text=${text}&url=${encodedUrl}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard tidak tersedia; abaikan
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold text-slate-700 mr-1">Bagikan:</span>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:border-red-300 hover:text-red-600 transition-colors"
        >
          {l.label}
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:border-red-300 hover:text-red-600 transition-colors cursor-pointer"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
        {copied ? "Tersalin" : "Salin link"}
      </button>
    </div>
  );
}
