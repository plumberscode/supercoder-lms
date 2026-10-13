import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, SITE_NAME } from "@/lib/site";
import { DAFTAR_DESCRIPTION, DAFTAR_PATH, DAFTAR_TITLE } from "./data";

// Metadata /daftar (juga berlaku untuk /daftar/status yang menimpanya sendiri).
export const metadata: Metadata = {
  title: DAFTAR_TITLE,
  description: DAFTAR_DESCRIPTION,
  alternates: {
    canonical: DAFTAR_PATH,
  },
  // openGraph milik child menimpa seluruh objek parent, jadi field penting diulang di sini
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: SITE_NAME,
    title: `${DAFTAR_TITLE} | Supercoder`,
    description: DAFTAR_DESCRIPTION,
    url: DAFTAR_PATH,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function DaftarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
