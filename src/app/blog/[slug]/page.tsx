import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleView from "@/components/blog/ArticleView";
import JsonLdScript from "@/components/seo/JsonLdScript";
import {
  getPostBySlug,
  getPublishedPostIndex,
  getRelatedPosts,
} from "@/lib/blog/queries";
import { processArticleHtml } from "@/lib/blog/html";
import {
  buildBlogPostingJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  categoryUrl,
  postUrl,
} from "@/lib/blog/jsonld";
import { buildPostMetadata, postDescription } from "@/lib/blog/seo";
import { DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/site";

// Statis + ISR. Tidak membaca cookies(), preview draft ada di /admin/blog/preview/[id]
export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const posts = await getPublishedPostIndex();
  return posts.map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return { title: "Artikel Tidak Ditemukan", robots: { index: false, follow: false } };
  }
  return buildPostMetadata(post);
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const h1 = post.headline || post.title;
  const article = processArticleHtml(post.content, h1);
  const related = await getRelatedPosts(post);
  const url = postUrl(post.slug);

  const jsonLd = [
    buildBlogPostingJsonLd(post, {
      description: postDescription(post),
      image: post.image_url || DEFAULT_OG_IMAGE,
      wordCount: article.wordCount,
    }),
    buildBreadcrumbJsonLd([
      { name: "Beranda", url: SITE_URL },
      { name: "Blog", url: `${SITE_URL}/blog` },
      ...(post.category
        ? [{ name: post.category.name, url: categoryUrl(post.category.slug) }]
        : []),
      { name: h1, url },
    ]),
    ...(post.faq.length ? [buildFaqJsonLd(post.faq)] : []),
  ];

  return (
    <>
      <JsonLdScript data={jsonLd} />
      <ArticleView post={post} article={article} related={related} url={url} />
    </>
  );
}
