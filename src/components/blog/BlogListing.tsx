import Link from "next/link";
import type { BlogCategory, BlogPostSummary } from "@/lib/blog/types";
import Breadcrumbs, { type Crumb } from "./Breadcrumbs";
import PostCard from "./PostCard";
import ArticleCTA from "./ArticleCTA";

type Props = {
  title: string;
  description: string;
  breadcrumbs: Crumb[];
  posts: BlogPostSummary[];
  categories: BlogCategory[];
  activeCategory?: string;
};

export default function BlogListing({
  title,
  description,
  breadcrumbs,
  posts,
  categories,
  activeCategory,
}: Props) {
  const chip = (active: boolean) =>
    `px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
      active
        ? "bg-red-600 border-red-600 text-white"
        : "border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-600"
    }`;

  return (
    <div className="max-w-6xl mx-auto px-5 pb-20">
      <div className="pt-4 pb-8">
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <header className="max-w-3xl mb-10">
        <h1 className="font-poppins font-extrabold text-3xl sm:text-5xl text-slate-900 leading-tight mb-4">
          {title}
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed">{description}</p>
      </header>

      {categories.length > 0 && (
        <nav aria-label="Kategori blog" className="flex flex-wrap gap-2 mb-10">
          <Link href="/blog" className={chip(!activeCategory)}>
            Semua
          </Link>
          {categories.map((c) => (
            <Link key={c.id} href={`/blog/kategori/${c.slug}`} className={chip(activeCategory === c.slug)}>
              {c.name}
            </Link>
          ))}
        </nav>
      )}

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          Belum ada artikel yang diterbitkan. Nantikan tulisan pertama kami segera!
        </p>
      )}

      <div className="mt-16">
        <ArticleCTA />
      </div>
    </div>
  );
}
