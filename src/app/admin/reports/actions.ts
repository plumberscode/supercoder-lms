"use server";

import { randomBytes } from "crypto";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildReportSnapshot, normalizePeriod } from "@/lib/reports";

function notesFrom(formData: FormData) {
  const read = (key: string) => ((formData.get(key) as string) || "").trim() || null;
  return {
    strengths: read("strengths"),
    improvements: read("improvements"),
    parent_advice: read("parent_advice"),
  };
}

function revalidateReport(id: string) {
  revalidatePath("/admin/reports");
  revalidatePath(`/admin/reports/${id}`);
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
    .eq("status", "approved");
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

export async function saveNotes(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("monthly_reports")
    .update(notesFrom(formData))
    .eq("id", id);
  if (error) throw new Error(`Gagal menyimpan catatan: ${error.message}`);
  revalidateReport(id);
}

// Menyimpan catatan, membekukan data nilai saat ini, lalu menerbitkan.
// Jika dipanggil lagi untuk rapor yang sudah terbit, snapshot diperbarui dan token tetap sama.
export async function publishReport(id: string, formData: FormData) {
  const supabase = await createClient();

  const { data: report, error } = await supabase
    .from("monthly_reports")
    .select("student_id, period, public_token")
    .eq("id", id)
    .single();
  if (error || !report) throw new Error("Rapor tidak ditemukan");

  const snapshot = await buildReportSnapshot(supabase, report.student_id, report.period);

  const { error: updateError } = await supabase
    .from("monthly_reports")
    .update({
      ...notesFrom(formData),
      snapshot,
      status: "published",
      public_token: report.public_token || randomBytes(24).toString("base64url"),
      published_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (updateError) throw new Error(`Gagal menerbitkan rapor: ${updateError.message}`);

  revalidateReport(id);
}

export async function unpublishReport(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("monthly_reports")
    .update({ status: "draft" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateReport(id);
}

export async function markSent(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("monthly_reports")
    .update({ sent_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateReport(id);
}
