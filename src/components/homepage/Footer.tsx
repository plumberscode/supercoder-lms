import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock, Phone } from "lucide-react";
import { BUSINESS, BUSINESS_MAPS_EMBED_URL } from "@/lib/site";

export default function Footer() {
  return (
    <footer
      className="bg-slate-50 border-t border-slate-200/80 pt-16 pb-16 px-5 relative overflow-hidden"
    >
      {/* Giant Background Watermark Text */}
      <div
        aria-hidden="true"
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 select-none pointer-events-none font-poppins font-black text-[90px] sm:text-[150px] lg:text-[210px] text-slate-200/50 tracking-tighter leading-none whitespace-nowrap z-0"
      >
        SUPERCODER
      </div>

      {/* Main Content - Full max-w-6xl Width, Flush with Sections Above */}
      <div className="footer-content relative z-10 max-w-6xl mx-auto">
        {/* Top Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 pb-12">
          {/* Left Column: Brand, Desc, Socials */}
          <div className="lg:col-span-5 flex flex-col items-start text-left">
            <Link href="/" className="inline-block mb-5">
              <Image
                src="/images/Logo transparent orange.webp"
                alt="Supercoder Logo"
                width={150}
                height={40}
                className="h-9 w-auto object-contain"
              />
            </Link>

            <p className="font-sans text-sm text-slate-500 leading-relaxed max-w-sm mb-6">
              SuperCoder adalah tempat bagi generasi muda untuk memahami
              teknologi, menguasai coding fundamentals, dan menggunakan AI untuk
              mengubah ide menjadi produk digital nyata.
            </p>

            {/* NAP: harus identik dengan Google Business Profile */}
            <address className="not-italic font-sans text-sm text-slate-600 space-y-2.5 max-w-sm mb-6">
              <p className="font-poppins font-bold text-slate-900">
                Kursus Coding Balikpapan
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-orange-500" />
                <span>
                  {BUSINESS.streetAddress}, {BUSINESS.city}, {BUSINESS.region}
                </span>
              </p>
              {BUSINESS.schedule.map((item) => (
                <p key={item.label} className="flex items-start gap-2">
                  <Clock className="w-4 h-4 mt-0.5 shrink-0 text-orange-500" />
                  <span>
                    {item.label}: {item.value}
                  </span>
                </p>
              ))}
              <p className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 shrink-0 text-orange-500" />
                <a
                  href={BUSINESS.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-red-600 transition-colors"
                >
                  {BUSINESS.phoneDisplay} (WhatsApp)
                </a>
              </p>
            </address>

            <div className="w-full max-w-sm mb-6">
              <iframe
                src={BUSINESS_MAPS_EMBED_URL}
                title="Lokasi Supercoder di Google Maps"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-40 rounded-xl border border-slate-200"
              />
              <a
                href={BUSINESS.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 font-sans text-sm font-medium text-orange-600 hover:text-red-600 transition-colors"
              >
                Buka di Google Maps &rarr;
              </a>
            </div>

            {/* Social Icons Row */}
            <div className="flex items-center justify-start gap-3 w-full">
              {/* Instagram */}
              <a
                href={BUSINESS.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 text-slate-700 hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-2xs"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            </div>
          </div>

          {/* Right Column: Multi-Column Nav Links */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 text-left">
            {/* Column 1: Product / Program */}
            <div>
              <h4 className="font-poppins font-bold text-sm text-slate-900 mb-4 tracking-wide">
                Program
              </h4>
              <ul className="space-y-2.5 font-sans text-sm text-slate-600">
                <li>
                  <Link
                    href="/#program"
                    className="hover:text-red-600 transition-colors"
                  >
                    Weekend Class
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#program"
                    className="hover:text-red-600 transition-colors"
                  >
                    Online Class
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#journey"
                    className="hover:text-red-600 transition-colors"
                  >
                    Junior Level
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#journey"
                    className="hover:text-red-600 transition-colors"
                  >
                    Builder Level
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#journey"
                    className="hover:text-red-600 transition-colors"
                  >
                    Elite Level
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Resources */}
            <div>
              <h4 className="font-poppins font-bold text-sm text-slate-900 mb-4 tracking-wide">
                Resources
              </h4>
              <ul className="space-y-2.5 font-sans text-sm text-slate-600">
                <li>
                  <Link
                    href="/#bahasa"
                    className="hover:text-red-600 transition-colors"
                  >
                    HTML5 &amp; CSS3
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#bahasa"
                    className="hover:text-red-600 transition-colors"
                  >
                    JavaScript
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#bahasa"
                    className="hover:text-red-600 transition-colors"
                  >
                    VS Code &amp; Figma
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#bahasa"
                    className="hover:text-red-600 transition-colors"
                  >
                    Antigravity AI
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#faq"
                    className="hover:text-red-600 transition-colors"
                  >
                    FAQ / Bantuan
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Company */}
            <div>
              <h4 className="font-poppins font-bold text-sm text-slate-900 mb-4 tracking-wide">
                Supercoder
              </h4>
              <ul className="space-y-2.5 font-sans text-sm text-slate-600">
                <li>
                  <Link
                    href="/#manfaat"
                    className="hover:text-red-600 transition-colors"
                  >
                    Tentang Kami
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#galeri"
                    className="hover:text-red-600 transition-colors"
                  >
                    Suasana Kelas
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#testimoni"
                    className="hover:text-red-600 transition-colors"
                  >
                    Testimoni Siswa
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="hover:text-red-600 transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="hover:text-red-600 transition-colors font-medium"
                  >
                    Portal LMS
                  </Link>
                </li>
                <li>
                  <a
                    href="https://wa.me/62816331126"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-red-600 transition-colors"
                  >
                    Kontak &amp; Lokasi
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Divider, Copyright & Legal Links */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-slate-500">
          <p className="font-sans text-sm text-center sm:text-left">
            &copy; {new Date().getFullYear()} Supercoder. Hak Cipta Dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}
