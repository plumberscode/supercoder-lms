import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";
import type { BlogPost, BlogPostSummary } from "@/lib/blog/types";
import type { ProcessedArticle } from "@/lib/blog/html";
import { formatDateId } from "@/lib/blog/text";
import Breadcrumbs from "./Breadcrumbs";
import TableOfContents from "./TableOfContents";
import ShareButtons from "./ShareButtons";
import ArticleCTA from "./ArticleCTA";
import FaqSection from "./FaqSection";
import PostCard from "./PostCard";

type Props = {
  post: BlogPost;
  article: ProcessedArticle;
  related: BlogPostSummary[];
  url: string;
  banner?: React.ReactNode;
};

export default function ArticleView({ post, article, related, url, banner }: Props) {
  const h1 = post.headline || post.title;
  const intro = post.excerpt || post.meta_description;
  const wasUpdated =
    new Date(post.updated_at).getTime() - new Date(post.published_at).getTime() >
    24 * 60 * 60 * 1000;

  return (
    <div className="max-w-6xl mx-auto px-5 pb-20">
      {banner}

      <div className="pt-4 pb-6">
        <Breadcrumbs
          items={[
            { name: "Beranda", href: "/" },
            { name: "Blog", href: "/blog" },
            ...(post.category
              ? [{ name: post.category.name, href: `/blog/kategori/${post.category.slug}` }]
              : []),
            { name: h1 },
          ]}
        />
      </div>

      <article>
        <header className="max-w-3xl">
          {post.category && (
            <Link
              href={`/blog/kategori/${post.category.slug}`}
              className="inline-block mb-4 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wide hover:bg-red-100 transition-colors"
            >
              {post.category.name}
            </Link>
          )}
          <h1 className="font-poppins font-extrabold text-3xl sm:text-4xl lg:text-[2.75rem] leading-tight text-slate-900 mb-4">
            {h1}
          </h1>
          {intro && <p className="text-lg text-slate-600 leading-relaxed mb-5">{intro}</p>}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            {post.author_name && (
              <span>
                Oleh <span className="font-semibold text-slate-700">{post.author_name}</span>
              </span>
            )}
            <span>
              <time dateTime={post.published_at}>{formatDateId(post.published_at)}</time>
            </span>
            {wasUpdated && (
              <span>
                Diperbarui <time dateTime={post.updated_at}>{formatDateId(post.updated_at)}</time>
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" aria-hidden />
              {article.readingMinutes} menit baca
            </span>
          </div>
        </header>

        {post.image_url && (
          <div className="relative mt-8 aspect-[1200/630] rounded-3xl overflow-hidden bg-slate-100">
            <Image
              src={post.image_url}
              alt={post.image_alt || h1}
              fill
              priority
              sizes="(min-width: 1152px) 1152px, 100vw"
              className="object-cover"
            />
          </div>
        )}

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-10 lg:gap-14">
          <div className="min-w-0">
            <div className="lg:hidden mb-8">
              <TableOfContents items={article.toc} />
            </div>

            <div
              className="prose prose-slate lg:prose-lg max-w-none prose-headings:font-poppins prose-headings:scroll-mt-32 prose-a:text-red-600 prose-a:font-medium hover:prose-a:text-red-700 prose-img:rounded-2xl prose-pre:bg-[#0d1117] prose-pre:rounded-2xl prose-code:before:content-none prose-code:after:content-none prose-table:text-sm"
              dangerouslySetInnerHTML={{ __html: article.html }}
            />

            {post.faq.length > 0 && (
              <div className="mt-12">
                <FaqSection items={post.faq} />
              </div>
            )}

            <div className="mt-12 pt-6 border-t border-slate-200">
              <ShareButtons url={url} title={h1} />
            </div>

            <div className="mt-10">
              <ArticleCTA />
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-32 space-y-6">
              <TableOfContents items={article.toc} />
            </div>
          </aside>
        </div>
      </article>

      {related.length > 0 && (
        <section className="mt-20" aria-labelledby="artikel-terkait">
          <h2 id="artikel-terkait" className="font-poppins font-bold text-2xl text-slate-900 mb-6">
            Artikel Terkait
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((p) => (
              <PostCard key={p.id} post={p} headingLevel="h3" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
