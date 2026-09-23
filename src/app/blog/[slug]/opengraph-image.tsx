import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/blog/queries";

export const alt = "Artikel Blog Supercoder";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 60;

/** Paksa Cloudinary mengirim JPG 1200x630 (Satori tidak mendukung WebP/AVIF). */
function cloudinaryJpg(url: string) {
  return url.includes("res.cloudinary.com") && url.includes("/upload/")
    ? url.replace("/upload/", "/upload/f_jpg,q_85,c_fill,w_1200,h_630/")
    : null;
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  const title = post ? post.headline || post.title : "Blog Supercoder";
  const cover = post?.image_url ? cloudinaryJpg(post.image_url) : null;

  // Artikel dengan gambar unggulan: pakai gambarnya apa adanya
  if (cover) {
    return new ImageResponse(
      (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} width={1200} height={630} alt="" style={{ objectFit: "cover" }} />
      ),
      size,
    );
  }

  // Tanpa gambar: kartu brand dengan judul
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b2e 55%, #7f1d1d 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 34, fontWeight: 800 }}>
          <span style={{ color: "#ef4444" }}>Super</span>
          <span>coder</span>
          <span style={{ marginLeft: 20, fontSize: 24, fontWeight: 500, color: "#fdba74" }}>
            Blog
          </span>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: title.length > 70 ? 52 : 64,
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#cbd5e1" }}>
          Kelas Coding &amp; AI · supercoder.id
        </div>
      </div>
    ),
    size,
  );
}
