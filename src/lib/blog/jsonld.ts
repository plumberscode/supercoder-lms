import { ORG_ID, SITE_LOGO, SITE_NAME, SITE_URL } from "@/lib/site";
import type { BlogCategory, BlogPost, BlogPostSummary, FaqItem } from "./types";

const publisher = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: SITE_NAME,
  url: SITE_URL,
  logo: { "@type": "ImageObject", url: SITE_LOGO },
};

export const postUrl = (slug: string) => `${SITE_URL}/blog/${slug}`;
export const categoryUrl = (slug: string) => `${SITE_URL}/blog/kategori/${slug}`;

export function absoluteUrl(url: string): string {
  return url.startsWith("http") ? url : `${SITE_URL}${url}`;
}

export function buildBlogPostingJsonLd(
  post: BlogPost,
  opts: { description: string; image: string; wordCount: number },
) {
  const url = postUrl(post.slug);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: (post.headline || post.title).slice(0, 110),
    name: post.title,
    description: opts.description,
    image: [absoluteUrl(opts.image)],
    datePublished: post.published_at,
    dateModified: post.updated_at,
    inLanguage: "id-ID",
    wordCount: opts.wordCount,
    ...(post.category ? { articleSection: post.category.name } : {}),
    author: post.author_name
      ? { "@type": "Person", name: post.author_name, worksFor: { "@id": ORG_ID } }
      : { "@type": "Organization", "@id": ORG_ID, name: SITE_NAME, url: SITE_URL },
    publisher,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    isPartOf: { "@type": "Blog", "@id": `${SITE_URL}/blog#blog` },
  };
}

export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildFaqJsonLd(faq: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/** Blog (indeks) atau CollectionPage (kategori) + ItemList artikel. */
export function buildBlogListJsonLd(
  posts: BlogPostSummary[],
  category?: BlogCategory,
) {
  const url = category ? categoryUrl(category.slug) : `${SITE_URL}/blog`;
  return {
    "@context": "https://schema.org",
    "@type": category ? "CollectionPage" : "Blog",
    "@id": category ? url : `${SITE_URL}/blog#blog`,
    url,
    name: category ? `${category.name} - Blog ${SITE_NAME}` : `Blog ${SITE_NAME}`,
    inLanguage: "id-ID",
    publisher,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((post, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: postUrl(post.slug),
        name: post.headline || post.title,
      })),
    },
  };
}
