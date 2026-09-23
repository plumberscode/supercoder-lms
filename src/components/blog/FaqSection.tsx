import type { FaqItem } from "@/lib/blog/types";

export default function FaqSection({ items }: { items: FaqItem[] }) {
  if (!items.length) return null;

  return (
    <section aria-labelledby="faq-artikel">
      <h2 id="faq-artikel" className="font-poppins font-bold text-2xl text-slate-900 mb-4 scroll-mt-32">
        Pertanyaan yang Sering Diajukan
      </h2>
      <div className="divide-y divide-slate-200 border-y border-slate-200">
        {items.map((item, i) => (
          <details key={i} className="group py-4">
            <summary className="cursor-pointer list-none flex justify-between gap-4 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
              {item.q}
              <span aria-hidden className="text-red-600 transition-transform group-open:rotate-45 text-xl leading-none">+</span>
            </summary>
            <p className="mt-3 text-slate-600 leading-relaxed whitespace-pre-line">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
