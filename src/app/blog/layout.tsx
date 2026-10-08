import "highlight.js/styles/github-dark.css";
import Navbar from "@/components/homepage/Navbar";
import Footer from "@/components/homepage/Footer";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main
        className="bg-white min-h-screen"
        style={{ paddingTop: "calc(var(--promo-bar-height, 0px) + 88px)" }}
      >
        {children}
      </main>
      <Footer showLocalLinks />
    </>
  );
}
