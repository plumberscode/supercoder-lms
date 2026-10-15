import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import styles from "./student.module.css";

interface StudentTopBarProps {
  profile: {
    full_name?: string | null;
    level?: number | null;
    role?: string | null;
  };
  email?: string | null;
}

export function firstNameOf(fullName?: string | null, email?: string | null) {
  return (fullName || email?.split("@")[0] || "Coder").split(" ")[0];
}

/** Top bar kaca yang sama di semua halaman siswa (dashboard, mata pelajaran, materi). */
export default function StudentTopBar({ profile, email }: StudentTopBarProps) {
  const firstName = firstNameOf(profile.full_name, email);
  const isStaff = profile.role === "admin" || profile.role === "teacher";

  return (
    <header className={styles.topBar}>
      <div className={styles.topBarContainer}>
        <Link href="/dashboard" className={styles.brandLink} aria-label="Kembali ke Dashboard">
          <Image
            src="/images/Logo transparent orange.webp"
            alt="Supercoder"
            width={140}
            height={40}
            className={styles.brandLogo}
            priority
          />
        </Link>

        <div className={styles.topBarRight}>
          {isStaff && (
            <Link href="/admin/users" className={styles.adminPill}>
              ⚙️ Admin
            </Link>
          )}
          <div className={styles.levelPill}>
            <span>⚡</span>
            <span>Level {profile.level ?? 1}</span>
          </div>
          <form action={signOut} className={styles.signOutForm}>
            <button type="submit" className={styles.signOutBtn}>
              Keluar 🚪
            </button>
          </form>
          <div className={styles.userAvatar} aria-hidden="true">
            {firstName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
