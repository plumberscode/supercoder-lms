import type { Metadata } from "next";
import LoginForm from "../login/LoginForm";

export const metadata: Metadata = {
  title: "Masuk Siswa MINAS",
  robots: { index: false, follow: true },
};

// Link pendek untuk dibagikan di kelas MINAS: login dengan tab MINAS langsung terbuka.
export default function MinasLoginPage() {
  return <LoginForm mode="minas" />;
}
