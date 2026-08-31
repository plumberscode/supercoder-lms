import { createClient } from "@/utils/supabase/server";
import styles from "../admin.module.css";
import DeleteButton from "./DeleteButton";
import { Star, MessageSquareHeart, Award, TrendingUp } from "lucide-react";

export const metadata = {
  title: "Testimoni Siswa | Admin Supercoder",
  description: "Daftar testimoni dan feedback dari siswa Supercoder.",
};

export default async function AdminTestimonialsPage() {
  const supabase = await createClient();

  const { data: testimonials, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div>
        <h1 className={styles.pageTitle}>Testimoni & Feedback Siswa</h1>
        <div
          style={{
            padding: "20px",
            backgroundColor: "#FEE2E2",
            color: "#991B1B",
            borderRadius: "12px",
          }}
        >
          Gagal memuat data testimoni: {error.message}
          <br />
          <small>
            Pastikan tabel <code>testimonials</code> telah dibuat di Supabase
            (jalankan file SQL <code>migration_testimonials.sql</code>).
          </small>
        </div>
      </div>
    );
  }

  const totalTestimonials = testimonials?.length || 0;
  const averageRating =
    totalTestimonials > 0
      ? (
          testimonials.reduce((acc, curr) => acc + (curr.rating || 5), 0) /
          totalTestimonials
        ).toFixed(1)
      : "5.0";

  const fiveStarCount = testimonials?.filter((t) => t.rating === 5).length || 0;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1 className={styles.pageTitle} style={{ margin: 0 }}>
            Testimoni & Feedback Siswa
          </h1>
          <p
            style={{ color: "#64748B", marginTop: "4px", fontSize: "0.925rem" }}
          >
            Seluruh ulasan, masukan, dan kepuasan belajar yang dikirimkan oleh
            siswa.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <div
          className="card"
          style={{
            padding: "20px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            borderLeft: "4px solid #6366F1",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "#EEF2FF",
              color: "#6366F1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MessageSquareHeart className="w-6 h-6" />
          </div>
          <div>
            <div
              style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: 600 }}
            >
              Total Testimoni
            </div>
            <div
              style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0F172A" }}
            >
              {totalTestimonials}
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "20px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            borderLeft: "4px solid #F59E0B",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "#FEF3C7",
              color: "#D97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <div
              style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: 600 }}
            >
              Rata-rata Rating
            </div>
            <div
              style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0F172A" }}
            >
              {averageRating}{" "}
              <span style={{ fontSize: "1rem", color: "#F59E0B" }}>/ 5.0</span>
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "20px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            borderLeft: "4px solid #10B981",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "#D1FAE5",
              color: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div
              style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: 600 }}
            >
              Rating 5 Bintang
            </div>
            <div
              style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0F172A" }}
            >
              {fiveStarCount}
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials List */}
      {totalTestimonials === 0 ? (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#64748B",
            borderRadius: "16px",
          }}
        >
          <MessageSquareHeart
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: "#CBD5E1" }}
          />
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#334155" }}>
            Belum Ada Testimoni
          </h3>
          <p
            style={{
              maxWidth: "450px",
              margin: "8px auto 0",
              fontSize: "0.925rem",
            }}
          >
            Siswa dapat mengisi form testimoni langsung dari halaman Dashboard
            siswa mereka.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {testimonials.map((t) => {
            const dateStr = new Date(t.created_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={t.id}
                className="card"
                style={{
                  padding: "24px",
                  borderRadius: "16px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                }}
              >
                {/* Header Card */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    paddingBottom: "16px",
                    borderBottom: "1px solid #F1F5F9",
                    marginBottom: "20px",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        backgroundColor: "#EEF2FF",
                        color: "#4F46E5",
                        fontWeight: 800,
                        fontSize: "1.1rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {t.student_name
                        ? t.student_name.charAt(0).toUpperCase()
                        : "S"}
                    </div>
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "1.1rem",
                          fontWeight: 700,
                          color: "#0F172A",
                        }}
                      >
                        {t.student_name}
                      </h3>
                      <div
                        style={{
                          fontSize: "0.825rem",
                          color: "#64748B",
                          marginTop: "2px",
                        }}
                      >
                        {t.student_email || "Email tidak dicatat"} • {dateStr}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    {/* Stars */}
                    <div style={{ display: "flex", gap: "2px" }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= (t.rating || 5)
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-200"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Delete action */}
                    <DeleteButton testimonialId={t.id} />
                  </div>
                </div>

                {/* Answers to the 5 questions */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {/* Q1 */}
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#F8FAFC",
                      borderRadius: "12px",
                      border: "1px solid #EDF2F7",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "#475569",
                        marginBottom: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                      }}
                    >
                      1. Materi yang Telah Dipelajari
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.925rem",
                        color: "#0F172A",
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {t.what_learned}
                    </p>
                  </div>

                  {/* Q2 */}
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#F8FAFC",
                      borderRadius: "12px",
                      border: "1px solid #EDF2F7",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "#475569",
                        marginBottom: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                      }}
                    >
                      2. Proses Belajar di Super Coder
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.925rem",
                        color: "#0F172A",
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {t.learning_process}
                    </p>
                  </div>

                  {/* Q3 */}
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#F8FAFC",
                      borderRadius: "12px",
                      border: "1px solid #EDF2F7",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "#475569",
                        marginBottom: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                      }}
                    >
                      3. Hal yang Membuat Semangat
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.925rem",
                        color: "#0F172A",
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {t.motivation}
                    </p>
                  </div>

                  {/* Q4 */}
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#FEF2F2",
                      borderRadius: "12px",
                      border: "1px solid #FEE2E2",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "#B91C1C",
                        marginBottom: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                      }}
                    >
                      4. Hal yang Masih Harus Diperbaiki
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.925rem",
                        color: "#7F1D1D",
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {t.improvement_suggestions}
                    </p>
                  </div>
                </div>

                {/* Q5 Full Width Overall Impression */}
                <div
                  style={{
                    marginTop: "16px",
                    padding: "16px",
                    backgroundColor: "#F0FDF4",
                    borderRadius: "12px",
                    border: "1px solid #DCFCE7",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#15803D",
                      marginBottom: "6px",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    5. Kesan Secara Umum
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.95rem",
                      color: "#14532D",
                      lineHeight: 1.5,
                      fontWeight: 500,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    &ldquo;{t.overall_impression}&rdquo;
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
