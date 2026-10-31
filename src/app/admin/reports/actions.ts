"use server";

import { randomBytes } from "crypto";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildReportSnapshot, normalizePeriod } from "@/lib/reports";

function notesFrom(formData: FormData) {
  const read = (key: string) => ((formData.get(key) as string) || "").trim() || null;
  return {
    month_note: read("month_note"),
    strengths: read("strengths"),
    improvements: read("improvements"),
    parent_advice: read("parent_advice"),
  };
}

function revalidateReport() {
  revalidatePath("/admin/reports");
  revalidatePath("/admin/gradebook/[studentId]/rapor", "page");
}

// Rapor satu siswa per bulan; barisnya dibuat saat pertama kali disimpan dari profil siswa.
async function ensureReport(studentId: string, rawPeriod: string) {
  const period = normalizePeriod(rawPeriod);
  if (!period) throw new Error("Periode tidak valid");
  const supabase = await createClient();

  const { data: existing, error } = await supabase
    .from("monthly_reports")
    .select("id, public_token")
    .eq("student_id", studentId)
    .eq("period", period)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (existing) return { supabase, period, report: existing };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: created, error: insertError } = await supabase
    .from("monthly_reports")
    .upsert(
      { student_id: studentId, period, created_by: user?.id ?? null },
      { onConflict: "student_id,period" },
    )
    .select("id, public_token")
    .single();
  if (insertError || !created) throw new Error(`Gagal membuat rapor: ${insertError?.message}`);
  return { supabase, period, report: created };
}

export async function createDrafts(formData: FormData) {
  const period = normalizePeriod(formData.get("period") as string);
  if (!period) throw new Error("Periode tidak valid");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: students, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "student")
    .eq("status", "approved")
    // Rapor bulanan hanya untuk siswa kursus Supercoder, bukan MINAS/teaser.
    .eq("program", "supercoder");
  if (error) throw new Error(error.message);

  if (students && students.length > 0) {
    const { error: insertError } = await supabase.from("monthly_reports").upsert(
      students.map((s) => ({
        student_id: s.id,
        period,
        created_by: user?.id ?? null,
      })),
      { onConflict: "student_id,period", ignoreDuplicates: true },
    );
    if (insertError) throw new Error(`Gagal membuat draf: ${insertError.message}`);
  }

  revalidatePath("/admin/reports");
  redirect(`/admin/reports?period=${period.slice(0, 7)}`);
}

export async function saveReport(studentId: string, period: string, formData: FormData) {
  const { supabase, report } = await ensureReport(studentId, period);
  const { error } = await supabase
    .from("monthly_reports")
    .update(notesFrom(formData))
    .eq("id", report.id);
  if (error) throw new Error(`Gagal menyimpan catatan: ${error.message}`);
  revalidateReport();
}

// Menyimpan catatan, membekukan data nilai saat ini, lalu menerbitkan.
// Jika dipanggil lagi untuk rapor yang sudah terbit, snapshot diperbarui dan token tetap sama.
export async function publishReport(studentId: string, period: string, formData: FormData) {
  const { supabase, period: normalized, report } = await ensureReport(studentId, period);
  const snapshot = await buildReportSnapshot(supabase, studentId, normalized);

  const { error } = await supabase
    .from("monthly_reports")
    .update({
      ...notesFrom(formData),
      snapshot,
      status: "published",
      public_token: report.public_token || randomBytes(24).toString("base64url"),
      published_at: new Date().toISOString(),
    })
    .eq("id", report.id);
  if (error) throw new Error(`Gagal menerbitkan rapor: ${error.message}`);
  revalidateReport();
}

export async function unpublishReport(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("monthly_reports")
    .update({ status: "draft" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateReport();
}

export async function markSent(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("monthly_reports")
    .update({ sent_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateReport();
}
