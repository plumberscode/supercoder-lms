"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBlogAdmin } from "@/lib/blog/auth";
import { parseGscLinksCsv } from "@/lib/seo/gsc-links";
import {
  explainGscError,
  gscConfigured,
  gscListSites,
  gscSearchAnalytics,
  lastDays,
  matchGscProperty,
  type GscSite,
} from "@/lib/seo/providers/gsc";
import { getSeoSettings } from "@/lib/seo/settings";

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

export type GscTestResult = {
  ok: boolean;
  message: string;
  property: string;
  sites: GscSite[];
  sample?: {
    range: string;
    clicks: number;
    impressions: number;
    topQueries: { query: string; clicks: number; impressions: number; position: number }[];
  };
};

/** Cek koneksi GSC end-to-end: kredensial → daftar properti → contoh data 28 hari. */
export async function testGscConnection(): Promise<GscTestResult> {
  const { supabase } = await requireBlogAdmin();
  const settings = await getSeoSettings(supabase);
  const property = settings.gsc_property || "";

  if (!gscConfigured()) {
    return {
      ok: false,
      property,
      sites: [],
      message:
        "GSC_CLIENT_EMAIL / GSC_PRIVATE_KEY belum diisi. Buat service account di Google Cloud, unduh key JSON, isi keduanya di .env.local (dan Vercel), lalu restart server.",
    };
  }

  let sites: GscSite[];
  try {
    sites = await gscListSites();
  } catch (e) {
    return { ok: false, property, sites: [], message: explainGscError(e instanceof Error ? e.message : String(e)) };
  }

  if (sites.length === 0) {
    return {
      ok: false,
      property,
      sites,
      message:
        "Kredensial valid, tapi service account belum punya akses ke properti mana pun. Tambahkan email service account sebagai user di Search Console.",
    };
  }

  const match = matchGscProperty(sites, property);
  if (!match) {
    return {
      ok: false,
      property,
      sites,
      message: `Properti "${property || "(kosong)"}" tidak ada di daftar yang bisa diakses. Salin salah satu properti di bawah ke kolom Properti GSC.`,
    };
  }

  try {
    const range = lastDays(28);
    const rows = await gscSearchAnalytics(match.siteUrl, { ...range, dimensions: ["query"], rowLimit: 5 });
    const totals = await gscSearchAnalytics(match.siteUrl, { ...range, dimensions: [], rowLimit: 1 });
    return {
      ok: true,
      property: match.siteUrl,
      sites,
      message: `Tersambung ke ${match.siteUrl} (${match.permissionLevel}).`,
      sample: {
        range: `${range.startDate} s/d ${range.endDate}`,
        clicks: totals[0]?.clicks ?? 0,
        impressions: totals[0]?.impressions ?? 0,
        topQueries: rows.map((r) => ({
          query: r.keys[0],
          clicks: r.clicks,
          impressions: r.impressions,
          position: Number(r.position.toFixed(1)),
        })),
      },
    };
  } catch (e) {
    return { ok: false, property, sites, message: explainGscError(e instanceof Error ? e.message : String(e)) };
  }
}
