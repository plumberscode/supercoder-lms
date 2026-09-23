import { ListTree } from "lucide-react";
import type { TocItem } from "@/lib/blog/types";

/** Daftar isi dari H2/H3. Pakai <details> agar bisa dilipat tanpa JavaScript. */
export default function TableOfContents({ items }: { items: TocItem[] }) {
  if (items.length < 2) return null;

  return (
    <details
      open
      className="group rounded-2xl border border-slate-200 bg-slate-50/70 p-5 [&_summary::-webkit-details-marker]:hidden"
    >
      <summary className="flex items-center gap-2 cursor-pointer font-poppins font-bold text-slate-900 text-sm list-none">
        <ListTree className="w-4 h-4 text-red-600" aria-hidden />
        Daftar Isi
        <span className="ml-auto text-xs font-medium text-slate-400 group-open:hidden">Tampilkan</span>
      </summary>
      <ol className="mt-4 space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.id} className={item.level === 3 ? "pl-4" : ""}>
            <a
              href={`#${item.id}`}
              className="text-slate-600 hover:text-red-600 transition-colors leading-snug block"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}
