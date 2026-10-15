"use server";

import { currentUserIsStaff } from "@/lib/staff";
import { uploadImage } from "@/lib/cloudinary";

/** Gambar untuk deskripsi soal (editor soal coding/CSS/web). Admin dan guru boleh. */
export async function uploadChallengeImage(
  formData: FormData,
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    if (!(await currentUserIsStaff())) {
      return { success: false, error: "Hanya admin atau guru yang bisa mengunggah gambar." };
    }
    const result = await uploadImage(formData.get("file"), "supercoder-challenges");
    return { success: true, url: result.secure_url };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Gagal mengunggah gambar." };
  }
}
