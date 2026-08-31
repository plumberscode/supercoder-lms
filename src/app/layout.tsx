import type { Metadata } from "next";
import { Inter, Poppins, Geist } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://supercoder.id";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Supercoder - Belajar Coding & AI",
    template: "%s | Supercoder",
  },
  description:
    "Tempat generasi muda memahami teknologi, menguasai coding fundamentals, dan menggunakan AI untuk mengubah ide menjadi produk digital nyata di Balikpapan.",
  keywords: [
    "kursus coding balikpapan",
    "les coding anak balikpapan",
    "belajar coding dan ai",
    "coding class balikpapan",
    "kursus pemrograman anak dan remaja",
    "kursus web programming balikpapan",
    "supercoder",
    "supercoder balikpapan",
    "les programming balikpapan",
    "ai coding balikpapan",
  ],
  authors: [{ name: "Supercoder Team", url: siteUrl }],
  creator: "Supercoder",
  publisher: "Supercoder",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName: "Supercoder",
    title: "Supercoder - Belajar Coding & AI",
    description:
      "Tempat generasi muda memahami teknologi, menguasai coding fundamentals, dan menggunakan AI untuk mengubah ide menjadi produk digital nyata di Balikpapan.",
    images: [
      {
        url: "/images/hero-image-supercoder.webp",
        width: 1200,
        height: 630,
        alt: "Supercoder - Kelas Coding dan AI Balikpapan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Supercoder - Belajar Coding & AI",
    description:
      "Kuasai coding fundamentals dan manfaatkan modern AI workflow untuk membangun aplikasi web dan project digital nyata.",
    images: ["/images/hero-image-supercoder.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={cn("font-sans", geist.variable)}>
      <body className={`${inter.variable} ${poppins.variable}`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
