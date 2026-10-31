import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

// Rapor kini diisi dari profil siswa di Buku Nilai; link lama diarahkan ke sana.
export default async function LegacyReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: report } = await supabase
    .from("monthly_reports")
    .select("student_id, period")
    .eq("id", id)
    .maybeSingle();
  if (!report) notFound();
  redirect(`/admin/gradebook/${report.student_id}/rapor?period=${report.period.slice(0, 7)}`);
}
