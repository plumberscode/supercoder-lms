import { createClient } from "@/utils/supabase/server";
import QuestionBankList from "./QuestionBankList";
import QuestionForm from "./QuestionForm";
import CSVImport from "./CSVImport";
import AITextImport from "./AITextImport";
import { getModuleOptions } from "@/lib/question-bank-summary";
import { MAX_SOURCE_TEXT_LENGTH } from "@/lib/ai-questions";

// Pengolahan soal oleh AI bisa makan waktu lebih dari batas default server action.
export const maxDuration = 120;

export default async function QuestionBankPage() {
  const supabase = await createClient();

  // Bank soal dikelompokkan per modul; modul diurutkan mengikuti mata pelajarannya.
  const [modules, { data: questions }] = await Promise.all([
    getModuleOptions(supabase),
    supabase
      .from("question_bank")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ marginBottom: "8px" }}>🧠 Bank Soal</h1>
        <p style={{ color: "#64748B" }}>
          Kelola koleksi pertanyaan untuk kuis dinamis.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 350px",
          gap: "32px",
          alignItems: "start",
        }}
      >
        <QuestionForm modules={modules} />
        <CSVImport modules={modules} />
      </div>

      <AITextImport modules={modules} maxLength={MAX_SOURCE_TEXT_LENGTH} />

      <hr
        style={{
          margin: "40px 0",
          border: "none",
          borderTop: "1px solid #E2E8F0",
        }}
      />

      <h2 style={{ marginBottom: "24px" }}>Daftar Soal</h2>
      <QuestionBankList questions={questions || []} modules={modules} />
    </div>
  );
}
