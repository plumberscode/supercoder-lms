import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "../../../admin.module.css";
import { requireBlogAdminPage } from "@/lib/blog/auth";
import { TOOL_LABELS } from "@/lib/seo/labels";
import { renderAgentMarkdown } from "@/lib/seo/render-markdown";
import { REPORT_TYPE_LABELS, type ReportType } from "@/lib/seo/types";
import { deleteReport } from "../../actions";
import ConfirmDeleteButton from "../../ConfirmDeleteButton";

export const metadata = { title: "Laporan SEO | Admin Supercoder" };

type Collected = { tool: string; args: unknown; data: unknown };

export default async function SeoReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireBlogAdminPage();
  const { data: report } = await supabase
    .from("seo_reports")
    .select("id, type, title, summary_md, data, created_at, conversation_id")
    .eq("id", id)
    .maybeSingle();

  if (!report) notFound();
  const collected = ((report.data as { collected?: Collected[] } | null)?.collected ?? []) as Collected[];

  return (
    <div className="max-w-4xl">
      <Link href="/admin/seo/reports" className="text-sm text-slate-500 hover:text-red-600">← Semua laporan</Link>
      <div className="flex flex-wrap items-start justify-between gap-4 mt-2 mb-6">
        <div>
          <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
            {REPORT_TYPE_LABELS[report.type as ReportType] ?? report.type}
          </span>
          <h1 className={styles.pageTitle} style={{ margin: "8px 0 0" }}>{report.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {new Date(report.created_at).toLocaleString("id-ID", {
              dateStyle: "full",
              timeStyle: "short",
              timeZone: "Asia/Makassar",
            })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {report.conversation_id && (
            <Link href={`/admin/seo?c=${report.conversation_id}`} className="text-xs font-semibold text-slate-500 hover:text-red-600">
              Lanjutkan di chat
            </Link>
          )}
          <ConfirmDeleteButton
            action={deleteReport.bind(null, report.id)}
            confirmText={`Hapus laporan "${report.title}"?`}
          />
        </div>
      </div>

      <article
        className="prose prose-slate max-w-none bg-white rounded-2xl border border-slate-200 p-6 prose-table:text-sm prose-a:text-red-600"
        dangerouslySetInnerHTML={{ __html: renderAgentMarkdown(report.summary_md) }}
      />

      {collected.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-slate-800 mb-3">Data mentah ({collected.length} sumber)</h2>
          <div className="space-y-2">
            {collected.map((c, i) => {
              const meta = TOOL_LABELS[c.tool] ?? { label: c.tool, icon: "🛠️" };
              return (
                <details key={i} className="rounded-xl border border-slate-200 bg-white text-xs">
                  <summary className="px-4 py-3 cursor-pointer font-semibold text-slate-700">
                    {meta.icon} {meta.label} <span className="font-normal text-slate-400">{JSON.stringify(c.args)}</span>
                  </summary>
                  <pre className="px-4 pb-4 max-h-[480px] overflow-auto whitespace-pre-wrap break-all text-slate-600">
                    {JSON.stringify(c.data, null, 2)}
                  </pre>
                </details>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
