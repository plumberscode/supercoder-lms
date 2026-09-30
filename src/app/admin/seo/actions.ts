"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBlogAdmin } from "@/lib/blog/auth";
import { parseGscLinksCsv } from "@/lib/seo/gsc-links";

const lines = (value: FormDataEntryValue | null) =>
  String(value ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

const bareDomain = (d: string) =>
  d.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");

export async function saveSeoSettings(formData: FormData) {
  const { supabase } = await requireBlogAdmin();
  const siteUrl = String(formData.get("site_url") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();

  const { error } = await supabase.from("seo_settings").upsert({
    id: 1,
    site_url: siteUrl || "https://supercoder.id",
    location: location || "Balikpapan, East Kalimantan, Indonesia",
    language: String(formData.get("language") ?? "id").trim() || "id",
    competitors: [...new Set(lines(formData.get("competitors")).map(bareDomain))].slice(0, 10),
    seed_keywords: [...new Set(lines(formData.get("seed_keywords")).map((k) => k.toLowerCase()))].slice(0, 30),
    gsc_property: String(formData.get("gsc_property") ?? "").trim() || null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/seo/settings");
  redirect("/admin/seo/settings?saved=1");
}

export async function importGscLinks(formData: FormData) {
  const { supabase } = await requireBlogAdmin();
  const file = formData.get("csv");
  if (!(file instanceof File) || file.size === 0) redirect("/admin/seo/settings?csv=empty");
  if (file.size > 2 * 1024 * 1024) redirect("/admin/seo/settings?csv=too-big");

  const links = parseGscLinksCsv(await file.text());
  const { error } = await supabase
    .from("seo_settings")
    .update({ gsc_links: links.slice(0, 1000), updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/seo/settings");
  redirect(`/admin/seo/settings?csv=${links.length}`);
}

export async function deleteReport(id: string) {
  const { supabase } = await requireBlogAdmin();
  const { error } = await supabase.from("seo_reports").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/seo/reports");
  redirect("/admin/seo/reports");
}

export async function deleteConversation(id: string) {
  const { supabase } = await requireBlogAdmin();
  const { error } = await supabase.from("seo_conversations").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/seo");
  redirect("/admin/seo");
}
