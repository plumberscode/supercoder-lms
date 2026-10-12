import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Clock, MessageCircle, CreditCard, SearchX } from "lucide-react";
import { createAdminClient } from "@/utils/supabase/admin";
import { markRegistrationPaid } from "@/lib/payments";
import { formatRupiah } from "@/lib/pricing";
import { BUSINESS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Status Pembayaran",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ id?: string }>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Registration = {
  student_name: string;
  selected_class: string;
  payment_status: string | null;
  payment_amount: number | null;
  mayar_payment_id: string | null;
  mayar_payment_link: string | null;
};

async function loadRegistration(id: string): Promise<Registration | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("registrations")
    .select("student_name, selected_class, payment_status, payment_amount, mayar_payment_id, mayar_payment_link")
    .eq("id", id)
    .maybeSingle();
  return data;
}

// Halaman tujuan redirect Mayar setelah bayar. Jika webhook belum masuk, status dicek langsung
// ke Mayar supaya siswa tidak melihat "belum dibayar" padahal sudah.
export default async function PaymentStatusPage({ searchParams }: { searchParams: SearchParams }) {
  const { id } = await searchParams;
  let reg = id && UUID_RE.test(id) ? await loadRegistration(id) : null;

  if (reg?.payment_status === "unpaid" && reg.mayar_payment_id) {
    const result = await markRegistrationPaid(reg.mayar_payment_id);
    if (result.status === "marked" || result.status === "already_paid") {
      reg = { ...reg, payment_status: "paid" };
    }
  }

  const firstName = reg?.student_name.split(" ")[0] ?? "";
  const waUrl = reg
    ? `${BUSINESS.whatsappUrl}?text=${encodeURIComponent(
        `Halo Supercoder, saya ${reg.student_name} sudah mendaftar ${reg.selected_class}. Mohon info jadwal kelasnya.`,
      )}`
    : BUSINESS.whatsappUrl;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100/70 py-12 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center mb-10 sm:mb-12">
          <Link href="/" className="inline-block transition-transform hover:scale-105">
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

        <div className="bg-white rounded-[32px] border border-slate-200/90 shadow-xl p-8 sm:p-14 text-center">
          {!reg ? (
            <>
              <div className="w-20 h-20 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-slate-50">
                <SearchX className="w-10 h-10" />
              </div>
              <h1 className="font-poppins text-2xl sm:text-3xl font-black text-slate-900 mb-4 tracking-tight">
                Pendaftaran Tidak Ditemukan
              </h1>
              <p className="text-slate-600 text-base sm:text-lg mb-8 leading-relaxed">
                Link ini tidak valid. Silakan daftar ulang atau hubungi kami via WhatsApp.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/daftar"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-poppins font-semibold"
                >
                  Ke Formulir Pendaftaran
                </Link>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-poppins font-semibold transition-colors"
                >
                  WhatsApp {BUSINESS.phoneDisplay}
                </a>
              </div>
            </>
          ) : reg.payment_status === "paid" ? (
            <>
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-emerald-50">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h1 className="font-poppins text-2xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">
                Pembayaran Berhasil, {firstName}!
              </h1>
              <p className="text-slate-600 text-base sm:text-lg mb-8 leading-relaxed">
                Pembayaran bulan pertama{" "}
                <strong className="text-slate-900">{reg.selected_class}</strong>
                {reg.payment_amount ? ` sebesar ${formatRupiah(reg.payment_amount)}` : ""} sudah kami
                terima. Tim Supercoder akan menghubungi Anda via WhatsApp untuk konfirmasi jadwal kelas.
              </p>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-poppins font-semibold shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02]"
              >
                <MessageCircle className="w-5 h-5" />
                Chat WhatsApp Sekarang
              </a>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-amber-50">
                <Clock className="w-10 h-10" />
              </div>
              <h1 className="font-poppins text-2xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">
                Menunggu Pembayaran
              </h1>
              <p className="text-slate-600 text-base sm:text-lg mb-8 leading-relaxed">
                Pendaftaran <strong className="text-slate-900">{reg.selected_class}</strong> atas nama{" "}
                {reg.student_name} sudah tercatat, tetapi pembayaran
                {reg.payment_amount ? ` ${formatRupiah(reg.payment_amount)}` : ""} belum kami terima.
                Jika Anda baru saja membayar, muat ulang halaman ini dalam beberapa saat.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {reg.mayar_payment_link && (
                  <a
                    href={reg.mayar_payment_link}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-poppins font-semibold shadow-lg shadow-red-500/25 transition-all"
                  >
                    <CreditCard className="w-5 h-5" />
                    Bayar Sekarang
                  </a>
                )}
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-poppins font-semibold transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Tanya via WhatsApp
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
