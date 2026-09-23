import Image from "next/image";
import Link from "next/link";
import type { BlogPostSummary } from "@/lib/blog/types";
import { formatDateId } from "@/lib/blog/text";

export default function PostCard({
  post,
  headingLevel = "h2",
}: {
  post: BlogPostSummary;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  const summary = post.excerpt || post.meta_description;

  return (
    <article className="group flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <Link href={`/blog/${post.slug}`} className="block relative aspect-[1200/630] bg-slate-100" tabIndex={-1} aria-hidden>
        {post.image_url ? (
          <Image
            src={post.image_url}
            alt={post.image_alt || post.headline || post.title}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-slate-900" />
        )}
      </Link>
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          {post.category && (
            <Link
              href={`/blog/kategori/${post.category.slug}`}
              className="font-semibold text-red-600 hover:underline"
            >
              {post.category.name}
            </Link>
          )}
          {post.category && <span aria-hidden>•</span>}
          <time dateTime={post.published_at}>{formatDateId(post.published_at)}</time>
        </div>
        <Heading className="font-poppins font-bold text-lg leading-snug text-slate-900 mb-2">
          <Link href={`/blog/${post.slug}`} className="group-hover:text-red-600 transition-colors">
            {post.headline || post.title}
          </Link>
        </Heading>
        {summary && <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{summary}</p>}
      </div>
    </article>
  );
}
