import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";
import { cleanExcerpt } from "./text";
import { postUrl } from "./jsonld";
import type { BlogPost } from "./types";

export function postDescription(post: Pick<BlogPost, "meta_description" | "excerpt" | "content">) {
  return (
    post.meta_description?.trim() ||
    post.excerpt?.trim() ||
    cleanExcerpt(post.content)
  );
}

/** Metadata artikel. Title memakai template root "%s | Supercoder". */
export function buildPostMetadata(post: BlogPost): Metadata {
  const url = postUrl(post.slug);
  const description = postDescription(post);

  return {
    title: post.title,
    description,
    alternates: { canonical: url },
    robots: post.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description,
      siteName: SITE_NAME,
      locale: "id_ID",
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      ...(post.author_name ? { authors: [post.author_name] } : {}),
      ...(post.category ? { section: post.category.name } : {}),
      // Gambar OG dibuat oleh opengraph-image.tsx di segmen yang sama
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
    },
  };
}
