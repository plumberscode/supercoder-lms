import Link from "next/link";

// Tombol ke materi berikutnya di modul yang sama, tampil di panel "Selamat!"
// setelah soal selesai. Tidak dirender jika soal ini materi terakhir modul.
export default function NextLessonButton({ lessonId }: { lessonId: string }) {
  return (
    <Link
      href={`/lessons/${lessonId}`}
      style={{
        display: "inline-block",
        marginTop: "12px",
        padding: "8px 18px",
        borderRadius: "8px",
        background: "#16A34A",
        color: "#FFFFFF",
        fontSize: "0.85rem",
        fontWeight: 700,
        textDecoration: "none",
      }}
    >
      Next →
    </Link>
  );
}
