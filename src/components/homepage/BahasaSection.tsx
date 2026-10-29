import Image from "next/image";

const stack = [
  { src: "/images/html-logo-transparent.webp", name: "HTML5", caption: "Struktur web" },
  { src: "/images/css-logo.webp", name: "CSS3", caption: "Desain visual" },
  { src: "/images/javascript-logo.webp", name: "JavaScript", caption: "Logika & interaksi" },
  { src: "/images/vs-code-logo.webp", name: "VS Code", caption: "Code editor" },
  { src: "/images/figma-logo.webp", name: "Figma", caption: "Desain UI" },
  { src: "/images/antigravity-logo.webp", name: "Antigravity", caption: "AI assistant" },
  { src: "/images/database-logo.webp", name: "Database", caption: "Database Postgres" },
];

export default function BahasaSection() {
  return (
    <section
      className="cv-auto py-20 sm:py-24 px-5 bg-slate-50 relative overflow-hidden"
      id="bahasa"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="tech-header text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="font-poppins text-xs font-bold text-slate-500 uppercase tracking-widest">
              Tech Stack &amp; Tools
            </span>
          </div>
          <h2 className="font-poppins text-3xl sm:text-4xl font-bold text-slate-900 mb-4 leading-tight">
            <span className="text-red-500">Fondasi</span> dan{" "}
            <span className="text-orange-500">Tools Modern</span> yang
            Digunakan
          </h2>
          <p className="font-sans text-base sm:text-lg text-slate-600">
            Siswa belajar langsung dengan teknologi standar industri dan
            workflow AI modern.
          </p>
        </div>

        {/* Logo grid: 2 kolom di HP, 4 di tablet, 7 sebaris di desktop */}
        <ul className="tech-container grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {stack.map((item) => (
            <li
              key={item.name}
              className="tech-card flex flex-col items-center text-center gap-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2">
                <Image
                  src={item.src}
                  alt={item.name}
                  width={48}
                  height={48}
                  sizes="48px"
                  className="object-contain max-h-12 w-auto"
                />
              </div>
              <div>
                <p className="font-poppins text-sm font-bold text-slate-900">
                  {item.name}
                </p>
                <p className="font-sans text-xs text-slate-500 mt-0.5">
                  {item.caption}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
