"use client";

import { useActionState } from "react";
import { createMinasStudents, type CreateMinasState } from "./actions";
import LoginCards from "./LoginCards";

export default function MinasImportForm() {
  const [state, formAction, pending] = useActionState<CreateMinasState, FormData>(
    createMinasStudents,
    null,
  );

  return (
    <>
      <div className="card" style={{ marginBottom: "24px" }}>
        <h3 style={{ marginTop: 0 }}>+ Tambah Siswa MINAS</h3>
        <p style={{ color: "#64748B", fontSize: "0.875rem", marginTop: 0 }}>
          Satu nama per baris (bisa ditempel dari Excel). Username dan password dibuat
          otomatis, akun langsung aktif.
        </p>
        <form action={formAction}>
          <textarea
            name="names"
            rows={8}
            placeholder={"Budi Santoso\nSiti Aisyah\nAhmad Fauzan"}
            required
            style={{ width: "100%", fontFamily: "inherit", marginBottom: "12px" }}
          />
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Membuat akun..." : "Buat Akun"}
          </button>
        </form>

        {state?.error && (
          <p style={{ color: "#DC2626", marginBottom: 0 }}>{state.error}</p>
        )}
        {state?.failed && state.failed.length > 0 && (
          <div style={{ color: "#DC2626", marginTop: "12px", fontSize: "0.875rem" }}>
            <strong>Gagal dibuat:</strong>
            <ul style={{ margin: "4px 0 0" }}>
              {state.failed.map((f, i) => (
                <li key={i}>
                  {f.fullName}: {f.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {state?.created && (
        <LoginCards
          credentials={state.created}
          title={`${state.created.length} akun baru dibuat`}
        />
      )}
    </>
  );
}
