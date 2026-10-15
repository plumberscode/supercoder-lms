import Link from "next/link";

// Ajakan bagi akun teaser untuk ikut kelas Supercoder. Hanya dirender untuk teaser.
export default function UpgradeCta({
  progress,
}: {
  // Materi gratis yang sudah dikerjakan; tidak dikirim di halaman subject.
  progress?: { done: number; total: number };
}) {
  const finished = !!progress && progress.total > 0 && progress.done >= progress.total;

  const title = finished
    ? "Semua materi gratis sudah kamu selesaikan! 🎉"
    : "Suka belajarnya? Masih banyak yang bisa kamu buat 🚀";
  const message = finished
    ? "Kamu siap naik level. Di kelas Supercoder kamu membuat website dan aplikasi sungguhan, didampingi instruktur."
    : "Materi yang bergembok terbuka di kelas Supercoder: proyek nyata, bimbingan instruktur, dan petunjuk AI tanpa batas.";

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        padding: "20px 24px",
        marginBottom: "24px",
        borderRadius: "16px",
        border: "1px solid #FED7AA",
        background: "linear-gradient(135deg, #FFF7ED, #FFEDD5)",
      }}
    >
      <div style={{ flex: "1 1 280px" }}>
        <p style={{ fontWeight: 800, color: "#9A3412", margin: 0 }}>{title}</p>
        <p style={{ color: "#7C2D12", fontSize: "0.9rem", margin: "6px 0 0" }}>
          {message}
        </p>
        {progress && progress.total > 0 && !finished && (
          <p style={{ color: "#9A3412", fontSize: "0.8rem", margin: "8px 0 0" }}>
            {progress.done} dari {progress.total} materi gratis selesai
          </p>
        )}
      </div>
      <Link
        href="/daftar"
        className="btn btn-primary"
        style={{ whiteSpace: "nowrap" }}
      >
        Daftar Kelas Supercoder →
      </Link>
    </div>
  );
}
