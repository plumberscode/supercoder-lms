"use client";

import { useState } from "react";
import StudentActiveToggle from "../users/StudentActiveToggle";
import LoginCards from "./LoginCards";
import ResetPasswordButton from "./ResetPasswordButton";
import type { MinasCredential } from "./actions";

export type MinasStudent = {
  id: string;
  full_name: string | null;
  username: string;
  status: string;
  xp: number;
  level: number;
};

export default function MinasStudentList({ students }: { students: MinasStudent[] }) {
  const [resetCredentials, setResetCredentials] = useState<MinasCredential[]>([]);

  return (
    <>
      <LoginCards credentials={resetCredentials} title="Password baru" />

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead
            style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid var(--border)" }}
          >
            <tr>
              <th style={{ padding: "16px 24px" }}>Nama</th>
              <th style={{ padding: "16px 24px" }}>Username</th>
              <th style={{ padding: "16px 24px" }}>XP</th>
              <th style={{ padding: "16px 24px" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr
                key={s.id}
                style={{
                  borderBottom: "1px solid var(--border)",
                  opacity: s.status === "inactive" ? 0.6 : 1,
                }}
              >
                <td style={{ padding: "12px 24px", fontWeight: 600 }}>
                  {s.full_name || "Tanpa Nama"}
                  {s.status === "inactive" && (
                    <span
                      className="badge"
                      style={{
                        marginLeft: "8px",
                        backgroundColor: "#E2E8F0",
                        color: "#475569",
                      }}
                    >
                      Nonaktif
                    </span>
                  )}
                </td>
                <td style={{ padding: "12px 24px", fontFamily: "ui-monospace, monospace" }}>
                  {s.username}
                </td>
                <td style={{ padding: "12px 24px" }}>
                  {s.xp} XP · Lv {s.level}
                </td>
                <td style={{ padding: "12px 24px" }}>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <ResetPasswordButton
                      userId={s.id}
                      studentName={s.full_name || s.username}
                      onReset={(credential) =>
                        setResetCredentials((prev) => [
                          credential,
                          ...prev.filter((c) => c.username !== credential.username),
                        ])
                      }
                    />
                    {(s.status === "approved" || s.status === "inactive") && (
                      <StudentActiveToggle
                        userId={s.id}
                        studentName={s.full_name || s.username}
                        isActive={s.status === "approved"}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: "24px", textAlign: "center", color: "#64748B" }}>
                  Belum ada siswa MINAS.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
