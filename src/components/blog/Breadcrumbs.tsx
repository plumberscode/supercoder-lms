import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Crumb = { name: string; href?: string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden />}
            {item.href ? (
              <Link href={item.href} className="hover:text-red-600 transition-colors">
                {item.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-slate-700 font-medium truncate max-w-[16rem] sm:max-w-md">
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
