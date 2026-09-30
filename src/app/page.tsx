import Navbar from "@/components/homepage/Navbar";
import HeroSection from "@/components/homepage/HeroSection";
import ManifestoSection from "@/components/homepage/ManifestoSection";
import TestimoniSection from "@/components/homepage/TestimoniSection";
import KaryaSiswaSection from "@/components/homepage/KaryaSiswaSection";
import GallerySection from "@/components/homepage/GallerySection";
import ProgramSection from "@/components/homepage/ProgramSection";
import ManfaatSection from "@/components/homepage/ManfaatSection";
import BerkembangSection from "@/components/homepage/BerkembangSection";
import BahasaSection from "@/components/homepage/BahasaSection";
import JourneySection from "@/components/homepage/JourneySection";
import FAQSection from "@/components/homepage/FAQSection";
import CTASection from "@/components/homepage/CTASection";
import Footer from "@/components/homepage/Footer";
import JsonLd from "@/components/seo/JsonLd";
import { HOME_TITLE, HOME_DESCRIPTION } from "@/lib/site";

export const metadata = {
  // absolute: judul sudah memuat brand, jangan ditambah template "| Supercoder" lagi
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <>
      <JsonLd />
      <Navbar />
      <main style={{ paddingTop: "var(--promo-bar-height, 0px)" }}>
        <HeroSection />
        <ManifestoSection />
        <TestimoniSection />
        <KaryaSiswaSection />
        <GallerySection />
        <ProgramSection />
        <ManfaatSection />
        <BerkembangSection />
        <BahasaSection />
        <JourneySection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
