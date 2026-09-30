import { requireBlogAdminPage } from "@/lib/blog/auth";
import { providerStatus } from "@/lib/seo/providers";
import { getSeoSettings } from "@/lib/seo/settings";
import { importGscLinks, saveSeoSettings } from "../actions";
import SeoTabs from "../SeoTabs";

export const metadata = { title: "Pengaturan SEO Agent | Admin Supercoder" };

const field = "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-red-500";

export default async function SeoSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; csv?: string }>;
}) {
  const { saved, csv } = await searchParams;
  const { supabase } = await requireBlogAdminPage();
  const settings = await getSeoSettings(supabase);
  const providers = providerStatus();

  const csvMessage =
    csv === "empty" ? "Pilih file CSV terlebih dahulu." : csv === "too-big" ? "File terlalu besar (maks 2 MB)." : csv ? `${csv} domain pemberi link diimpor.` : null;

  return (
    <div className="max-w-4xl">
      <SeoTabs active="settings" />

      {saved && <div className="p-3 mb-4 rounded-xl bg-emerald-50 text-emerald-800 text-sm">Pengaturan tersimpan.</div>}
      {csvMessage && <div className="p-3 mb-4 rounded-xl bg-slate-100 text-slate-700 text-sm">{csvMessage}</div>}

      <section className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-1">Sumber data</h2>
        <p className="text-sm text-slate-500 mb-4">
          Isi variabel env di <code>.env.local</code> (lokal) dan Vercel, lalu deploy ulang. Agent otomatis memakai sumber yang aktif.
        </p>
        <ul className="divide-y divide-slate-100">
          {providers.map((p) => (
            <li key={p.id} className="py-3 flex gap-3 text-sm">
              <span>{p.configured ? "✅" : "⚠️"}</span>
              <div>
                <div className="font-semibold text-slate-800">{p.label}</div>
                <div className="text-slate-500">{p.note}</div>
                {p.env !== "—" && <code className="text-xs text-slate-400">{p.env}</code>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <form action={saveSeoSettings} className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Target & kompetitor</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">URL situs</span>
            <input name="site_url" defaultValue={settings.site_url} className={`${field} mt-1`} />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">Properti GSC</span>
            <input name="gsc_property" defaultValue={settings.gsc_property ?? ""} placeholder="sc-domain:supercoder.id" className={`${field} mt-1`} />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">Lokasi SERP</span>
            <input name="location" defaultValue={settings.location} className={`${field} mt-1`} />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">Bahasa</span>
            <input name="language" defaultValue={settings.language} className={`${field} mt-1`} />
          </label>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">Domain kompetitor (satu per baris, maks 10)</span>
            <textarea name="competitors" rows={6} defaultValue={settings.competitors.join("\n")} className={`${field} mt-1 font-mono`} />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">Keyword target (satu per baris, maks 30)</span>
            <textarea name="seed_keywords" rows={6} defaultValue={settings.seed_keywords.join("\n")} className={`${field} mt-1 font-mono`} />
          </label>
        </div>
        <button type="submit" className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold cursor-pointer">
          Simpan pengaturan
        </button>
      </form>

      <form action={importGscLinks} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
        <h2 className="text-lg font-bold text-slate-800">Impor link dari Search Console</h2>
        <p className="text-sm text-slate-500">
          Gratis sebagai pengganti indeks backlink: di GSC buka <b>Links → Top linking sites → Export → CSV</b>, lalu unggah di sini.
          Agent memakai data ini untuk menandai domain yang sudah link ke kita.
        </p>
        <p className="text-sm text-slate-600">Saat ini: <b>{settings.gsc_links.length}</b> domain tersimpan.</p>
        <div className="flex flex-wrap items-center gap-3">
          <input type="file" name="csv" accept=".csv,text/csv" className="text-sm" />
          <button type="submit" className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
            Impor CSV
          </button>
        </div>
      </form>
    </div>
  );
}
