import type { Metadata } from "next";

// page.tsx adalah Client Component, jadi metadata didefinisikan di layout ini.
// noindex (bukan Disallow di robots.ts) agar Google tetap bisa membaca direktifnya.
export const metadata: Metadata = {
  title: "Masuk",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
