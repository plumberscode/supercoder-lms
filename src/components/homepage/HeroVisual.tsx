import Image from "next/image";
import { Medal } from "lucide-react";
import styles from "./HeroVisual.module.css";

const PORTFOLIO_URL = "https://rig-porto01-supercoder.netlify.app";

export default function HeroVisual() {
  return (
    <div className={styles.stage}>
      <div className={styles.arch} aria-hidden="true" />

      <div className={styles.photo}>
        <Image
          src="/images/hero/rig-hero.webp"
          alt="Rig Marjanul, siswa Supercoder kelas 8, memegang sertifikat Bronze Medal International Coding Olympiad 2026"
          fill
          // Elemen LCP hero (Next 16: `preload` menggantikan `priority`)
          preload
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 320px, 70vw"
          className="object-contain object-bottom"
        />
      </div>

      <div className={`${styles.card} ${styles.medal}`}>
        <span className={styles.medalIcon}>
          <Medal className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className={`${styles.title} font-poppins font-semibold`}>Bronze Medal</p>
          <p className={styles.sub}>International Coding Olympiad 2026</p>
        </div>
      </div>

      <a
        href={PORTFOLIO_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Rig Marjanul, Kelas 8 SMP KPS Balikpapan, siswa Supercoder. Lihat portofolio (tab baru)"
        className={`${styles.card} ${styles.name} transition-colors hover:border-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2`}
      >
        <p className={`${styles.title} font-poppins font-bold`}>Rig Marjanul</p>
        <p className={styles.sub}>Kelas 8, SMP KPS Balikpapan</p>
        <p className={styles.accent}>Siswa Supercoder</p>
      </a>
    </div>
  );
}
