"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Trash2, Upload, X } from "lucide-react";
import {
  deleteMedia,
  listMedia,
  uploadMedia,
  type MediaItem,
} from "@/app/admin/blog/media-actions";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem) => void;
  title?: string;
};

export default function MediaLibraryModal({ isOpen, ...rest }: Props) {
  // Dimount ulang setiap kali dibuka agar daftar media selalu segar
  return isOpen ? <MediaLibraryDialog {...rest} /> : null;
}

function MediaLibraryDialog({ onClose, onSelect, title }: Omit<Props, "isOpen">) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listMedia()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat media."))
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadMedia(fd);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (!res.success) return setError(res.error);
    setItems((prev) => [res.media, ...prev]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus gambar ini dari library? (File di Cloudinary tidak dihapus)")) return;
    const res = await deleteMedia(id);
    if (res.success) setItems((prev) => prev.filter((m) => m.id !== id));
    else setError(res.error ?? "Gagal menghapus.");
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Media library"}
      >
        <div className="flex items-center gap-3 p-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900">{title ?? "Media Library (Cloudinary)"}</h3>
          <label className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold cursor-pointer">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "Mengunggah..." : "Upload Gambar"}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              className="hidden"
              disabled={uploading}
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
          </label>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer" aria-label="Tutup">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <p className="mx-4 mt-3 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</p>}

        <div className="p-4 overflow-y-auto">
          {loading ? (
            <div className="py-16 flex justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-16 text-center text-slate-500 text-sm">
              Belum ada gambar. Upload gambar pertama (disarankan 1200×630 untuk gambar unggulan).
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {items.map((m) => (
                <div key={m.id} className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <button type="button" onClick={() => onSelect(m)} className="block w-full aspect-video cursor-pointer" title="Pilih gambar ini">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt={m.name ?? ""} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                  <div className="px-2 py-1.5 text-[11px] text-slate-500 truncate">
                    {m.name}
                    {m.width && m.height ? ` · ${m.width}×${m.height}` : ""}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(m.id)}
                    className="absolute top-1.5 right-1.5 p-1.5 rounded-md bg-white/90 text-red-600 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    aria-label="Hapus dari library"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
