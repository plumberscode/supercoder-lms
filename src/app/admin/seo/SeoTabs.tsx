import Link from "next/link";
import styles from "../admin.module.css";

const TABS = [
  { key: "chat", href: "/admin/seo", label: "Chat Agent" },
  { key: "reports", href: "/admin/seo/reports", label: "Laporan" },
  { key: "settings", href: "/admin/seo/settings", label: "Pengaturan & Sumber Data" },
] as const;

export default function SeoTabs({ active }: { active: (typeof TABS)[number]["key"] }) {
  return (
    <div className="mb-6">
      <h1 className={styles.pageTitle} style={{ margin: 0 }}>SEO Agent</h1>
      <p className="text-sm text-slate-500 mt-1">
        Riset kompetitor, keyword gap, peluang pencarian, SERP Google, audit website & backlink.
      </p>
      <nav className="flex gap-1 mt-4 border-b border-slate-200">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 ${
              active === t.key
                ? "border-red-600 text-red-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
