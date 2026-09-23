import { getPublishedPosts } from "@/lib/blog/queries";
import { postUrl } from "@/lib/blog/jsonld";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const revalidate = 300;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = await getPublishedPosts({ limit: 50 });

  const items = posts
    .map((post) => {
      const url = postUrl(post.slug);
      const description = post.meta_description || post.excerpt || "";
      return `    <item>
      <title>${escapeXml(post.headline || post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(post.published_at).toUTCString()}</pubDate>
      ${post.category ? `<category>${escapeXml(post.category.name)}</category>` : ""}
      <description>${escapeXml(description)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Blog ${SITE_NAME}</title>
    <link>${SITE_URL}/blog</link>
    <description>Tips belajar coding, web development, dan AI dari ${SITE_NAME}.</description>
    <language>id-ID</language>
    <atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml" />
${posts[0] ? `    <lastBuildDate>${new Date(posts[0].updated_at).toUTCString()}</lastBuildDate>\n` : ""}${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
