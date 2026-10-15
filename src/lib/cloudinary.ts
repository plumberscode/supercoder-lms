import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

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

/** Validasi lalu unggah gambar ke Cloudinary. Melempar Error berpesan ramah bila gagal. */
export async function uploadImage(file: unknown, folder: string): Promise<UploadApiResponse> {
  if (!(file instanceof File)) throw new Error("File tidak ditemukan.");
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Format tidak didukung. Gunakan JPG, PNG, WebP, GIF, atau AVIF.");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Ukuran file maksimal 4MB. Kompres gambar dulu (mis. ke WebP).");
  }
  configureCloudinary();

  const buffer = Buffer.from(await file.arrayBuffer());
  return new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: "image" }, (error, res) =>
        error || !res ? reject(error ?? new Error("Upload gagal")) : resolve(res),
      )
      .end(buffer);
  });
}
