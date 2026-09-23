"use server";

import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { requireBlogAdmin } from "@/lib/blog/auth";

export type MediaItem = {
  id: string;
  url: string;
  name: string | null;
  width: number | null;
  height: number | null;
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
// Batas body request serverless Vercel ±4,5MB; lihat serverActions.bodySizeLimit di next.config.ts
const MAX_SIZE = 4 * 1024 * 1024;

function configureCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary belum dikonfigurasi (CLOUDINARY_* di .env).");
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function uploadMedia(
  formData: FormData,
): Promise<{ success: true; media: MediaItem } | { success: false; error: string }> {
  try {
    const { supabase } = await requireBlogAdmin();
    configureCloudinary();

    const file = formData.get("file");
    if (!(file instanceof File)) return { success: false, error: "File tidak ditemukan." };
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { success: false, error: "Format tidak didukung. Gunakan JPG, PNG, WebP, GIF, atau AVIF." };
    }
    if (file.size > MAX_SIZE) return { success: false, error: "Ukuran file maksimal 4MB. Kompres gambar dulu (mis. ke WebP)." };

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "supercoder-blog", resource_type: "image" }, (error, res) =>
          error || !res ? reject(error ?? new Error("Upload gagal")) : resolve(res),
        )
        .end(buffer);
    });

    const { data, error } = await supabase
      .from("blog_media")
      .insert({
        public_id: result.public_id,
        url: result.secure_url,
        name: file.name,
        width: result.width,
        height: result.height,
      })
      .select("id, url, name, width, height")
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, media: data as MediaItem };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Gagal mengunggah gambar." };
  }
}

export async function listMedia(): Promise<MediaItem[]> {
  const { supabase } = await requireBlogAdmin();
  const { data } = await supabase
    .from("blog_media")
    .select("id, url, name, width, height")
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []) as MediaItem[];
}

/** Hanya menghapus dari library (file di Cloudinary tetap, agar artikel lama tidak rusak). */
export async function deleteMedia(id: string) {
  const { supabase } = await requireBlogAdmin();
  const { error } = await supabase.from("blog_media").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
