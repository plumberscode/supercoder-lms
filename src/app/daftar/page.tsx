"use client";

import { useState, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { submitRegistration, type RegistrationResult } from "./actions";
import {
  CheckCircle2,
  ArrowLeft,
  MessageCircle,
  Sparkles,
  Send,
  MapPin,
  Phone,
  Mail,
  User,
  BookOpen,
} from "lucide-react";

const CLASS_OPTIONS = [
  {
    id: "Weekend Coding Class",
    name: "Weekend Coding Class",
    tag: "Tatap Muka Balikpapan",
    badgeColor: "bg-orange-100 text-orange-700 border-orange-200",
    desc: "Belajar langsung tatap muka setiap weekend, fokus coding fundamentals dan pembuatan project digital nyata.",
  },
  {
    id: "Premium Online Class",
    name: "Premium Online Class",
    tag: "Online Interaktif 1-on-1",
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
    desc: "Bimbingan privat intensif via Google Meet dengan kurikulum adaptif dan jadwal belajar yang fleksibel.",
  },
  {
    id: "Custom Project Class",
    name: "Custom Project Class",
    tag: "Mentorship Project",
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    desc: "Wujudkan ide website atau aplikasimu sendiri, dibimbing step-by-step dari konsep hingga selesai.",
  },
];

function RegistrationFormContent() {
  const searchParams = useSearchParams();
  const initialClassParam =
    searchParams.get("class") || searchParams.get("program") || "";

  // Match initial class if provided in query params
  const matchedClass =
    CLASS_OPTIONS.find(
      (c) =>
        c.id.toLowerCase() === initialClassParam.toLowerCase() ||
        c.name.toLowerCase().includes(initialClassParam.toLowerCase()),
    )?.id || "Weekend Coding Class";

  const [studentName, setStudentName] = useState("");
  const [address, setAddress] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [email, setEmail] = useState("");
  const [selectedClass, setSelectedClass] = useState(matchedClass);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<
    RegistrationResult["data"] | null
  >(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("student_name", studentName);
    formData.append("address", address);
    formData.append("whatsapp_number", whatsappNumber);
    formData.append("email", email);
    formData.append("selected_class", selectedClass);

    startTransition(async () => {
      const res = await submitRegistration(null, formData);
      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.success && res.data) {
        setSubmittedData(res.data);
      }
    });
  };

  // Pre-generate WhatsApp direct chat link for post-submission
  const cleanPhone = submittedData?.whatsappNumber.replace(/\D/g, "") || "";
  const waContactUrl = `https://wa.me/6287788931919?text=${encodeURIComponent(
    `Halo Supercoder, saya telah mengisi form pendaftaran atas nama ${submittedData?.studentName || ""} untuk kelas ${submittedData?.selectedClass || ""}. Mohon informasinya.`,
  )}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100/70 py-12 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Top Bar Navigation */}
        <div className="flex items-center justify-between mb-10 sm:mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-red-600 transition-colors bg-white px-4 py-2.5 rounded-full border border-slate-200/90 shadow-xs hover:shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>

          <Link
            href="/"
            className="inline-block transition-transform hover:scale-105"
          >
            <Image
              src="/images/Logo transparent orange.webp"
              alt="Supercoder Logo"
              width={140}
              height={40}
              className="h-8 sm:h-9 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {submittedData ? (
          /* Thank You Confirmation Card */
          <div className="bg-white rounded-[32px] border border-slate-200/90 shadow-xl p-8 sm:p-14 text-center transition-all animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-emerald-50">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-200/60">
              <Sparkles className="w-3.5 h-3.5" />
              Pendaftaran Berhasil Diterima
            </div>

            <h1 className="font-poppins text-2xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">
              Terima Kasih, {submittedData.studentName}!
            </h1>

            <p className="text-slate-600 text-base sm:text-lg mb-8 leading-relaxed max-w-lg mx-auto">
              Pendaftaran Anda untuk program{" "}
              <span className="font-bold text-slate-900 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200 text-orange-950 inline-block my-1">
                {submittedData.selectedClass}
              </span>{" "}
              telah kami catat di sistem.
            </p>

            <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-6 sm:p-7 mb-10 text-left">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-emerald-950 text-base sm:text-lg mb-1.5">
                    Kami akan segera menghubungi Anda via WhatsApp
                  </h2>
                  <p className="text-emerald-800 text-sm sm:text-base leading-relaxed">
                    Kami akan segera menghubungi Anda melalui nomor WhatsApp:{" "}
                    <strong className="text-emerald-950 underline font-bold">
                      {submittedData.whatsappNumber}
                    </strong>{" "}
                    untuk konfirmasi detail jadwal dan informasi kelas.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={waContactUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-poppins font-semibold text-sm sm:text-base shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02]"
              >
                <MessageCircle className="w-5 h-5" />
                Chat WhatsApp Sekarang
              </a>

              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-poppins font-semibold text-sm sm:text-base transition-colors"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        ) : (
          /* Form Card with Generous Vertical Whitespace */
          <div className="bg-white rounded-[32px] border border-slate-200/90 shadow-xl overflow-hidden">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 p-8 sm:p-12 text-white relative">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-xs mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                Formulir Pendaftaran Siswa
              </div>
              <h1 className="font-poppins text-2xl sm:text-4xl font-black mb-3 tracking-tight">
                Daftar Kelas Supercoder
              </h1>
              <p className="text-white/90 text-sm sm:text-base leading-relaxed max-w-xl">
                Lengkapi data di bawah ini untuk memulai langkah belajarmu. Kami
                akan segera menghubungi Anda untuk konfirmasi jadwal dan
                konsultasi.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-8 sm:p-12 lg:p-14 space-y-10"
            >
              {errorMsg && (
                <div className="p-4 sm:p-5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                  {errorMsg}
                </div>
              )}

              {/* SECTION 1: DATA SISWA */}
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    1. Data Diri Calon Siswa
                  </h3>
                </div>

                {/* Nama Calon Siswa */}
                <div className="space-y-2.5">
                  <label
                    htmlFor="student_name"
                    className="block text-sm font-bold text-slate-800 flex items-center gap-2"
                  >
                    <User className="w-4 h-4 text-orange-500" />
                    <span>Nama Calon Siswa</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="student_name"
                    name="student_name"
                    type="text"
                    required
                    placeholder="Contoh: Muhammad Kevin"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-900 text-base placeholder:text-slate-400 transition-all bg-slate-50/50 focus:bg-white"
                  />
                </div>

                {/* Alamat */}
                <div className="space-y-2.5">
                  <label
                    htmlFor="address"
                    className="block text-sm font-bold text-slate-800 flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <span>Alamat Tempat Tinggal</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    required
                    rows={2}
                    placeholder="Contoh: Jl. MT Haryono No. 12, Ringroad, Balikpapan"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-900 text-base placeholder:text-slate-400 transition-all resize-none bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>

              {/* SECTION 2: KONTAK */}
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    2. Kontak & Komunikasi
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* WhatsApp */}
                  <div className="space-y-2.5">
                    <label
                      htmlFor="whatsapp_number"
                      className="block text-sm font-bold text-slate-800 flex items-center gap-2"
                    >
                      <Phone className="w-4 h-4 text-emerald-500" />
                      <span>Nomor WhatsApp Aktif</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="whatsapp_number"
                      name="whatsapp_number"
                      type="tel"
                      required
                      placeholder="Contoh: 081234567890"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 text-base placeholder:text-slate-400 transition-all bg-slate-50/50 focus:bg-white"
                    />
                    <span className="text-xs text-slate-500 block pt-0.5">
                      Kami akan menghubungi Anda via WhatsApp ini.
                    </span>
                  </div>

                  {/* Email */}
                  <div className="space-y-2.5">
                    <label
                      htmlFor="email"
                      className="block text-sm font-bold text-slate-800 flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4 text-blue-500" />
                      <span>Alamat Email</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 text-base placeholder:text-slate-400 transition-all bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: PILIHAN KELAS */}
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    3. Pilihan Program Kelas
                  </h3>
                </div>

                <div className="space-y-3.5">
                  {CLASS_OPTIONS.map((item) => {
                    const isChecked = selectedClass === item.id;

                    return (
                      <label
                        key={item.id}
                        className={`relative flex items-start gap-4 p-5 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                          isChecked
                            ? "border-orange-500 bg-orange-50/50 shadow-sm ring-1 ring-orange-500/30"
                            : "border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="selected_class"
                          value={item.id}
                          checked={isChecked}
                          onChange={() => setSelectedClass(item.id)}
                          className="mt-1 h-5 w-5 text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                            <span className="font-poppins font-bold text-slate-900 text-base sm:text-lg">
                              {item.name}
                            </span>
                            <span
                              className={`text-xs font-semibold px-3 py-1 rounded-full border ${item.badgeColor}`}
                            >
                              {item.tag}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-6 sm:pt-8 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-4 sm:py-4.5 px-8 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-poppins font-bold text-base sm:text-lg shadow-xl shadow-red-500/25 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isPending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Memproses Pendaftaran...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Kirim Pendaftaran</span>
                    </>
                  )}
                </button>

                <p className="text-center text-xs sm:text-sm text-slate-500 mt-5 leading-relaxed">
                  Setelah mengirim pendaftaran, data Anda tersimpan aman dan
                  kami akan segera menghubungi Anda via WhatsApp.
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RegistrationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RegistrationFormContent />
    </Suspense>
  );
}
