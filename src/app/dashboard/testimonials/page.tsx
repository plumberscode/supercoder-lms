import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquareHeart } from "lucide-react";
import TestimonialForm from "./TestimonialForm";

export const metadata = {
  title: "Testimoni & Feedback Belajar | Supercoder",
  description: "Beri tahu kami pengalaman dan masukan belajarmu di Supercoder.",
};

export default async function StudentTestimonialsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, status")
    .eq("id", user.id)
    .single();

  if (!profile || profile.status !== "approved") {
    redirect("/pending-approval");
  }

  // Check if student has already submitted testimonials
  const { data: existingTestimonials } = await supabase
    .from("testimonials")
    .select("id, rating, created_at, what_learned, overall_impression")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  const studentName = profile.full_name || user.email?.split("@")[0] || "Siswa";

  return (
    <div
      className="container"
      style={{ padding: "40px 20px 80px", maxWidth: "860px" }}
    >
      {/* Top Breadcrumb / Back Link */}
      <div style={{ marginBottom: "28px" }}>
        <Link
          href="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            color: "#6366F1",
            fontWeight: 600,
            fontSize: "0.9rem",
            textDecoration: "none",
          }}
          className="hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
        </Link>
      </div>

      {/* Header Title */}
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "#FEF3C7",
            color: "#B45309",
            padding: "6px 16px",
            borderRadius: "999px",
            fontSize: "0.85rem",
            fontWeight: 700,
            marginBottom: "16px",
          }}
        >
          <MessageSquareHeart className="w-4 h-4 text-amber-500" />
          <span>Suara Siswa Supercoder</span>
        </div>
        <h1
          style={{
            fontSize: "2.25rem",
            fontWeight: 800,
            color: "#0F172A",
            fontFamily: "var(--font-poppins)",
            marginBottom: "12px",
          }}
        >
          Bagikan Pengalaman Belajarmu 🚀
        </h1>
        <p
          style={{
            color: "#64748B",
            fontSize: "1rem",
            maxWidth: "600px",
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          Halo <strong>{studentName}</strong>, pendapat dan masukanmu sangat
          berharga bagi kami untuk terus meningkatkan kualitas kurikulum,
          mentor, dan teknologi LMS di Supercoder.
        </p>
      </div>

      {/* Form Testimoni */}
      <TestimonialForm
        studentName={studentName}
        existingCount={existingTestimonials?.length || 0}
      />
    </div>
  );
}
