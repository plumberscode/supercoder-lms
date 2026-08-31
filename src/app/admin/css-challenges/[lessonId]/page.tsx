import { createClient } from "@/utils/supabase/server";
import styles from "../../admin.module.css";
import Link from "next/link";
import CssChallengeEditor from "./CssChallengeEditor";

export default async function CssChallengePage({
  params,
}: {
  params: { lessonId: string };
}) {
  const { lessonId } = await params;
  const supabase = await createClient();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*, module_id(subject_id, title)")
    .eq("id", lessonId)
    .single();

  if (!lesson) return <div>Lesson tidak ditemukan</div>;

  const { data: challenge } = await supabase
    .from("css_challenges")
    .select("*")
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const subjectId = (lesson.module_id as any).subject_id;

  return (
    <div>
      <Link
        href={`/admin/subjects/${subjectId}`}
        style={{ color: "var(--primary)", fontWeight: 600 }}
      >
        ← Kembali ke Mata Pelajaran
      </Link>
      <h1 className={styles.pageTitle} style={{ marginTop: "20px" }}>
        🎨 Editor Soal CSS
      </h1>
      <p style={{ marginBottom: "24px", color: "var(--text-muted)" }}>
        Lesson: <strong>{lesson.title}</strong>
      </p>

      <CssChallengeEditor lessonId={lessonId} existingChallenge={challenge} />
    </div>
  );
}
