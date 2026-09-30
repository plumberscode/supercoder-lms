import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, SITE_NAME } from "@/lib/site";

// page.tsx adalah Client Component, jadi metadata /daftar didefinisikan di layout ini.
export const metadata: Metadata = {
  title: "Daftar Kelas Coding Balikpapan",
  description:
    "Daftar kelas coding & AI Supercoder di Balikpapan: Weekend Coding Class tatap muka, Premium Online Class 1-on-1, atau Custom Project Class. Isi formulir, tim kami segera menghubungi via WhatsApp.",
  alternates: {
    canonical: "/daftar",
  },
  // openGraph milik child menimpa seluruh objek parent, jadi field penting diulang di sini
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: SITE_NAME,
    title: "Daftar Kelas Coding Balikpapan | Supercoder",
    url: "/daftar",
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
