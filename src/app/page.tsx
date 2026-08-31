import Navbar from "@/components/homepage/Navbar";
import HeroSection from "@/components/homepage/HeroSection";
import ManifestoSection from "@/components/homepage/ManifestoSection";
import ProgramSection from "@/components/homepage/ProgramSection";
import ManfaatSection from "@/components/homepage/ManfaatSection";
import BerkembangSection from "@/components/homepage/BerkembangSection";
import BahasaSection from "@/components/homepage/BahasaSection";
import JourneySection from "@/components/homepage/JourneySection";
import TestimoniSection from "@/components/homepage/TestimoniSection";
import GallerySection from "@/components/homepage/GallerySection";
import FAQSection from "@/components/homepage/FAQSection";
import CTASection from "@/components/homepage/CTASection";
import Footer from "@/components/homepage/Footer";
import JsonLd from "@/components/seo/JsonLd";

export const metadata = {
  title:
    "Supercoder - Kelas Coding & AI Balikpapan | Learn the Fundamentals. Build with AI.",
  description:
    "Tempat generasi muda memahami teknologi, menguasai coding fundamentals, dan menggunakan AI untuk mengubah ide menjadi produk digital nyata di Balikpapan.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <>
      <JsonLd />
      <Navbar />
      <main>
        <HeroSection />
        <ManifestoSection />
        <ProgramSection />
        <ManfaatSection />
        <BerkembangSection />
        <BahasaSection />
        <JourneySection />
        <TestimoniSection />
        <GallerySection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
