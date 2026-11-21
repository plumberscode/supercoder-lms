"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { currentAdminId, currentUserIsStaff } from "@/lib/staff";
import { LIMITED_SUBMISSION_TYPES } from "@/lib/attempts";

export interface SubmissionFile {
  label: string;
  content: string;
}

export type SubmissionCode =
  | { ok: true; files: SubmissionFile[]; link: string | null }
  | { ok: false; message: string };

const text = (v: unknown) => (typeof v === "string" ? v : "");

// Isi kiriman siswa sesuai tipe submission:
// code → { code, html? }, css → { css }, web → { html, css, js }, project → { link }.
function filesFor(type: string, data: Record<string, unknown>): SubmissionFile[] {
  const files: SubmissionFile[] =
    type === "code"
      ? data.html
        ? [
            { label: "HTML", content: text(data.html) },
            { label: "JavaScript", content: text(data.code) },
          ]
        : [{ label: "Kode", content: text(data.code) }]
      : type === "css"
        ? [{ label: "CSS", content: text(data.css) }]
        : type === "web"
          ? [
              { label: "HTML", content: text(data.html) },
              { label: "CSS", content: text(data.css) },
              { label: "JavaScript", content: text(data.js) },
            ]
          : [];
  return files.filter((f) => f.content.trim() !== "");
}

/**
 * Beri siswa jatah penilaian baru untuk satu soal coding (CSS, Web, HTML+JS).
 * Riwayat percobaan tidak dihapus; yang dihitung hanya percobaan setelah reset ini.
 * Nilai terbaik tetap, jadi XP "lulus pertama kali" tidak bisa didapat ulang.
 */
export async function resetSubmissionAttempts(
  submissionId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const adminId = await currentAdminId();
  if (!adminId) return { ok: false, message: "Hanya admin yang bisa mereset jatah." };

  const admin = createAdminClient();
  const { data: sub, error } = await admin
    .from("submissions")
    .select("id, student_id, content_id, type, attempts_reset_count")
    .eq("id", submissionId)
    .maybeSingle();
  if (error || !sub) return { ok: false, message: "Kiriman tidak ditemukan." };
  if (!(LIMITED_SUBMISSION_TYPES as readonly string[]).includes(sub.type)) {
    return { ok: false, message: "Kiriman ini tidak punya batas penilaian." };
  }

  const { error: updateError } = await admin
    .from("submissions")
    .update({
      attempts_reset_at: new Date().toISOString(),
      attempts_reset_by: adminId,
      attempts_reset_count: (sub.attempts_reset_count ?? 0) + 1,
    })
    .eq("id", sub.id);
  if (updateError) {
    console.error("Reset attempts failed:", updateError);
    return { ok: false, message: "Gagal mereset jatah: " + updateError.message };
  }

  revalidatePath(`/admin/gradebook/${sub.student_id}`);
  revalidatePath(`/lessons/${sub.content_id}`);
  return { ok: true };
}

export async function getSubmissionCode(submissionId: string): Promise<SubmissionCode> {
  if (!(await currentUserIsStaff())) return { ok: false, message: "Hanya admin atau guru." };

  const supabase = await createClient();
  const { data: sub, error } = await supabase
    .from("submissions")
    .select("type, data")
    .eq("id", submissionId)
    .maybeSingle();
  if (error || !sub) return { ok: false, message: "Kiriman tidak ditemukan." };

  const data = (sub.data ?? {}) as Record<string, unknown>;
  const link = sub.type === "project" && typeof data.link === "string" ? data.link : null;
  return { ok: true, files: filesFor(sub.type, data), link };
}
