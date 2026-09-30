import Link from "next/link";
import { requireBlogAdminPage } from "@/lib/blog/auth";
import { REPORT_TYPE_LABELS, type ReportType } from "@/lib/seo/types";
import SeoTabs from "../SeoTabs";

export const metadata = { title: "Laporan SEO | Admin Supercoder" };

export default async function SeoReportsPage() {
  const { supabase } = await requireBlogAdminPage();
  const { data: reports, error } = await supabase
    .from("seo_reports")
    .select("id, type, title, created_at, conversation_id")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <SeoTabs active="reports" />

      {error && (
        <div className="p-4 mb-6 rounded-xl bg-red-50 text-red-800 text-sm">Gagal memuat laporan: {error.message}</div>
      )}

      {reports?.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-slate-300 bg-white text-center text-slate-500">
          Belum ada laporan. <Link href="/admin/seo" className="text-red-600 font-semibold">Minta agent membuat audit</Link>.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Judul</th>
                <th className="px-4 py-3 font-semibold">Jenis</th>
                <th className="px-4 py-3 font-semibold">Tanggal</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(reports ?? []).map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/seo/reports/${r.id}`} className="font-semibold text-slate-800 hover:text-red-600">
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                      {REPORT_TYPE_LABELS[r.type as ReportType] ?? r.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(r.created_at).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Asia/Makassar",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.conversation_id && (
                      <Link href={`/admin/seo?c=${r.conversation_id}`} className="text-xs font-semibold text-slate-500 hover:text-red-600">
                        Buka percakapan
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
