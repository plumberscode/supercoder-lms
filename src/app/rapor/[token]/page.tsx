import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ReportView from "@/components/reports/ReportView";
import PrintButton from "@/components/reports/PrintButton";
import type { PublicReport } from "@/lib/reports";
import { BUSINESS } from "@/lib/site";
import styles from "./rapor.module.css";

// Judul sengaja generik: link dibagikan lewat WhatsApp dan pratinjaunya tidak perlu memuat nama siswa.
export const metadata: Metadata = {
  title: "Rapor Belajar Bulanan",
  description: "Rapor belajar bulanan siswa Supercoder.",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  alternates: { canonical: null },
};

export default async function PublicReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{20,}$/.test(token)) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_report", {
    p_token: token,
  });

  if (error) console.error("get_public_report error:", error);
  const report = data as PublicReport | null;
  if (!report?.snapshot) notFound();

  return (
    <main className={styles.page}>
      <div className={styles.toolbar}>
        <span>
          {report.parent_name ? `Untuk Bapak/Ibu ${report.parent_name}` : "Untuk Orang Tua/Wali"}
        </span>
        <PrintButton className={styles.printBtn} />
      </div>

      <ReportView snapshot={report.snapshot} notes={report} />

      <p className={styles.contact}>
        Ada pertanyaan tentang perkembangan anak Anda? Hubungi kami via{" "}
        <a href={BUSINESS.whatsappUrl} target="_blank" rel="noopener noreferrer">
          WhatsApp {BUSINESS.phoneDisplay}
        </a>
        .
      </p>
    </main>
  );
}
