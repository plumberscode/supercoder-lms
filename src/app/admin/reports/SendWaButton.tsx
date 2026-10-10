"use client";

import { useTransition } from "react";
import { markSent } from "./actions";

export default function SendWaButton({
  reportId,
  waLink,
  alreadySent,
}: {
  reportId: string;
  waLink: string;
  alreadySent: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn"
      disabled={pending}
      style={{ backgroundColor: "#22C55E", color: "white" }}
      onClick={() => {
        window.open(waLink, "_blank", "noopener,noreferrer");
        startTransition(() => markSent(reportId));
      }}
    >
      💬 {alreadySent ? "Kirim Ulang via WA" : "Kirim via WA"}
    </button>
  );
}
