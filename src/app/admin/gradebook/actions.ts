"use server";

import { createClient } from "@/utils/supabase/server";
import { currentUserIsStaff } from "@/lib/staff";

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
