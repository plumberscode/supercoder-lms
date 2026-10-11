"use client";

import { useActionState } from "react";
import { updateParentContact, type ParentContactState } from "./actions";

const inputStyle = {
  padding: "6px 10px",
  borderRadius: "6px",
  border: "1px solid var(--border)",
  fontSize: "0.8rem",
  width: "100%",
};

export default function ParentContactForm({
  userId,
  parentName,
  parentWhatsapp,
  suggestedWhatsapp,
}: {
  userId: string;
  parentName: string | null;
  parentWhatsapp: string | null;
  suggestedWhatsapp?: string;
}) {
  const [state, formAction, pending] = useActionState<ParentContactState, FormData>(
    updateParentContact.bind(null, userId),
    null,
  );

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <input
        name="parent_name"
        defaultValue={parentName || ""}
        placeholder="Nama orang tua"
        style={inputStyle}
      />
      <input
        name="parent_whatsapp"
        defaultValue={parentWhatsapp || ""}
        placeholder={suggestedWhatsapp || "No. WA orang tua"}
        style={inputStyle}
      />
      {!parentWhatsapp && suggestedWhatsapp && (
        <div style={{ fontSize: "0.7rem", color: "#64748B" }}>
          Saran dari pendaftaran: {suggestedWhatsapp} (cek apakah ini nomor orang tua)
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          type="submit"
          className="btn"
          disabled={pending}
          style={{ padding: "4px 10px", fontSize: "0.75rem" }}
        >
          {pending ? "Menyimpan..." : "Simpan"}
        </button>
        {state && (
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: state.ok ? "#16A34A" : "#DC2626",
            }}
          >
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}
