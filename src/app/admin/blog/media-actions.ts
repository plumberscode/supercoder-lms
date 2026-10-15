"use server";

import { requireBlogAdmin } from "@/lib/blog/auth";
import { uploadImage } from "@/lib/cloudinary";

export type MediaItem = {
  id: string;
  url: string;
  name: string | null;
  width: number | null;
  height: number | null;
};

export async function uploadMedia(
  formData: FormData,
): Promise<{ success: true; media: MediaItem } | { success: false; error: string }> {
  try {
    const { supabase } = await requireBlogAdmin();
    const file = formData.get("file") as File;
    const result = await uploadImage(file, "supercoder-blog");

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
