"use client";

import { useActionState, useState } from "react";
import { submitTestimonial, type TestimonialFormState } from "./actions";
import Link from "next/link";
import { Star, Send, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const initialState: TestimonialFormState = {
  success: false,
  error: null,
};

export default function TestimonialForm({
  studentName,
  existingCount = 0,
}: {
  studentName: string;
  existingCount?: number;
}) {
  const [state, formAction, isPending] = useActionState(
    submitTestimonial,
    initialState,
  );
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  if (state.success) {
    return (
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "20px",
          border: "1px solid #E2E8F0",
          padding: "48px 32px",
          textAlign: "center",
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)",
          maxWidth: "680px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            backgroundColor: "#DCFCE7",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            color: "#16A34A",
          }}
        >
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2
          style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            color: "#0F172A",
            marginBottom: "12px",
            fontFamily: "var(--font-poppins)",
          }}
        >
          Terima Kasih Banyak, {studentName}! 🎉
        </h2>
        <p
          style={{
            color: "#64748B",
            fontSize: "1rem",
            lineHeight: 1.6,
            marginBottom: "28px",
            maxWidth: "520px",
            margin: "0 auto 28px",
          }}
        >
          Testimoni dan masukan berhargamu telah berhasil dikirim ke tim
          Supercoder. Ulasanmu sangat membantu kami untuk terus berkembang dan
          menciptakan pengalaman belajar terbaik!
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <Button asChild className="rounded-xl px-6 h-11 bg-primary">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "20px",
        border: "1px solid #E2E8F0",
        padding: "36px",
        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.04)",
        maxWidth: "760px",
        margin: "0 auto",
      }}
    >
      {state.error && (
        <div
          style={{
            padding: "16px 20px",
            backgroundColor: "#FEE2E2",
            border: "1px solid #FCA5A5",
            borderRadius: "12px",
            color: "#991B1B",
            marginBottom: "28px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "0.925rem",
          }}
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {existingCount > 0 && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#EFF6FF",
            border: "1px solid #BFDBFE",
            borderRadius: "10px",
            color: "#1E40AF",
            marginBottom: "24px",
            fontSize: "0.875rem",
          }}
        >
          💡 Kamu sebelumnya sudah mengirimkan <strong>{existingCount}</strong>{" "}
          testimoni. Kamu tetap bisa mengirimkan testimoni atau masukan terbaru
          di bawah ini.
        </div>
      )}

      {/* Rating Selector */}
      <div style={{ marginBottom: "28px" }}>
        <label
          style={{
            display: "block",
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "#1E293B",
            marginBottom: "8px",
          }}
        >
          Rating Pengalaman Belajar Kamu ⭐
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = (hoverRating ?? rating) >= star;
            return (
              <button
                type="button"
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  color: isFilled ? "#F59E0B" : "#CBD5E1",
                  transition: "transform 0.15s ease",
                }}
                className="hover:scale-110"
                aria-label={`Beri bintang ${star}`}
              >
                <Star
                  className={`w-8 h-8 ${isFilled ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                />
              </button>
            );
          })}
          <span
            style={{
              marginLeft: "8px",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "#64748B",
            }}
          >
            {rating === 5 && "🤩 Luar Biasa (5/5)"}
            {rating === 4 && "😊 Sangat Bagus (4/5)"}
            {rating === 3 && "🙂 Cukup Baik (3/5)"}
            {rating === 2 && "😐 Perlu Ditingkatkan (2/5)"}
            {rating === 1 && "😞 Kurang Puas (1/5)"}
          </span>
        </div>
        <input type="hidden" name="rating" value={rating} />
      </div>

      {/* Pertanyaan 1 */}
      <div style={{ marginBottom: "24px" }}>
        <label
          htmlFor="what_learned"
          style={{
            display: "block",
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "#1E293B",
            marginBottom: "8px",
          }}
        >
          1. Apa yang sudah kamu pelajari?{" "}
          <span style={{ color: "#EF4444" }}>*</span>
        </label>
        <textarea
          id="what_learned"
          name="what_learned"
          rows={3}
          required
          placeholder="Contoh: Saya belajar dasar HTML, styling CSS modern, logika JavaScript, dan cara membuat proyek web interaktif..."
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "12px",
            border: "1px solid #CBD5E1",
            fontSize: "0.95rem",
            color: "#0F172A",
            backgroundColor: "#F8FAFC",
            outline: "none",
            resize: "vertical",
            fontFamily: "inherit",
          }}
          className="focus:bg-white focus:border-primary transition-colors"
        />
      </div>

      {/* Pertanyaan 2 */}
      <div style={{ marginBottom: "24px" }}>
        <label
          htmlFor="learning_process"
          style={{
            display: "block",
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "#1E293B",
            marginBottom: "8px",
          }}
        >
          2. Menurut kamu gimana proses belajar di Super Coder?{" "}
          <span style={{ color: "#EF4444" }}>*</span>
        </label>
        <textarea
          id="learning_process"
          name="learning_process"
          rows={3}
          required
          placeholder="Contoh: Materinya sangat terstruktur, praktiknya jelas, dan ada AI Tutor serta bimbingan mentor yang selalu membantu saat bingung..."
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "12px",
            border: "1px solid #CBD5E1",
            fontSize: "0.95rem",
            color: "#0F172A",
            backgroundColor: "#F8FAFC",
            outline: "none",
            resize: "vertical",
            fontFamily: "inherit",
          }}
          className="focus:bg-white focus:border-primary transition-colors"
        />
      </div>

      {/* Pertanyaan 3 */}
      <div style={{ marginBottom: "24px" }}>
        <label
          htmlFor="motivation"
          style={{
            display: "block",
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "#1E293B",
            marginBottom: "8px",
          }}
        >
          3. Apa hal yang membuat kamu semangat belajar disini?{" "}
          <span style={{ color: "#EF4444" }}>*</span>
        </label>
        <textarea
          id="motivation"
          name="motivation"
          rows={3}
          required
          placeholder="Contoh: Bisa langsung lihat hasil kode secara visual, ada coding challenge seru dengan sistem XP dan leaderboard..."
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "12px",
            border: "1px solid #CBD5E1",
            fontSize: "0.95rem",
            color: "#0F172A",
            backgroundColor: "#F8FAFC",
            outline: "none",
            resize: "vertical",
            fontFamily: "inherit",
          }}
          className="focus:bg-white focus:border-primary transition-colors"
        />
      </div>

      {/* Pertanyaan 4 */}
      <div style={{ marginBottom: "24px" }}>
        <label
          htmlFor="improvement_suggestions"
          style={{
            display: "block",
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "#1E293B",
            marginBottom: "8px",
          }}
        >
          4. Apa hal yang masih harus diperbaiki dari Super Coder?{" "}
          <span style={{ color: "#EF4444" }}>*</span>
        </label>
        <textarea
          id="improvement_suggestions"
          name="improvement_suggestions"
          rows={3}
          required
          placeholder="Contoh: Saran untuk menambahkan lebih banyak variasi mini project game atau memperpanjang waktu sesi tanya jawab..."
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "12px",
            border: "1px solid #CBD5E1",
            fontSize: "0.95rem",
            color: "#0F172A",
            backgroundColor: "#F8FAFC",
            outline: "none",
            resize: "vertical",
            fontFamily: "inherit",
          }}
          className="focus:bg-white focus:border-primary transition-colors"
        />
      </div>

      {/* Pertanyaan 5 */}
      <div style={{ marginBottom: "32px" }}>
        <label
          htmlFor="overall_impression"
          style={{
            display: "block",
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "#1E293B",
            marginBottom: "8px",
          }}
        >
          5. Kesan secara umum terhadap proses belajar di Super Coder?{" "}
          <span style={{ color: "#EF4444" }}>*</span>
        </label>
        <textarea
          id="overall_impression"
          name="overall_impression"
          rows={3}
          required
          placeholder="Contoh: Belajar coding di Supercoder seru banget dan sangat membuka wawasan saya tentang dunia teknologi dan AI!"
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "12px",
            border: "1px solid #CBD5E1",
            fontSize: "0.95rem",
            color: "#0F172A",
            backgroundColor: "#F8FAFC",
            outline: "none",
            resize: "vertical",
            fontFamily: "inherit",
          }}
          className="focus:bg-white focus:border-primary transition-colors"
        />
      </div>

      {/* Tombol Submit */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
        <Button
          asChild
          variant="outline"
          className="rounded-xl px-6 h-11 border-slate-300"
        >
          <Link href="/dashboard">Batal</Link>
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="rounded-xl px-8 h-11 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-poppins font-semibold shadow-md shadow-red-500/20"
        >
          {isPending ? (
            <>⏳ Mengirimkan Testimoni...</>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" /> Kirim Testimoni
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
