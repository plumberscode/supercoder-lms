import { createClient } from "@/utils/supabase/server";
import styles from "../admin.module.css";
import MinasImportForm from "./MinasImportForm";
import MinasStudentList from "./MinasStudentList";

export default async function AdminMinasPage() {
  const supabase = await createClient();

  const { data: students, error } = await supabase
    .from("profiles")
    .select("id, full_name, username, status, xp, level")
    .eq("program", "minas")
    .eq("role", "student")
    .order("full_name", { ascending: true });

  if (error) return <div>Gagal memuat siswa MINAS: {error.message}</div>;

  const activeCount = students?.filter((s) => s.status === "approved").length ?? 0;

  return (
    <div>
      <h1 className={styles.pageTitle}>Siswa MINAS</h1>
      <p style={{ color: "#64748B", marginTop: "-8px", marginBottom: "24px" }}>
        {activeCount} siswa aktif. Siswa masuk di <strong>/minas</strong> dengan username
        dan password. Materi yang terlihat diatur lewat centang <strong>MINAS</strong> di
        setiap modul (menu Mata Pelajaran).
      </p>

      <MinasImportForm />
      <MinasStudentList students={students ?? []} />
    </div>
  );
}
