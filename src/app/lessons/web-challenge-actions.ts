"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import OpenAI from "openai";

type WebMode = "html" | "html-css" | "html-css-js";

export async function submitWebChallengeSolution(params: {
  challengeId: string;
  lessonId: string;
  mode: WebMode;
  html: string;
  css: string;
  js: string;
  referenceHtml: string;
  referenceCss: string;
  referenceJs: string;
  description: string;
  maxScore: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Fetch existing submission
  const { data: existing } = await supabase
    .from("submissions")
    .select("id, score, data")
    .eq("student_id", user.id)
    .eq("content_id", params.lessonId)
    .eq("type", "web")
    .maybeSingle();

  const existingAttempts: any[] = existing?.data?.attempts || [];
  if (existingAttempts.length >= 3) {
    return { error: "Batas submit sudah tercapai (3/3)" };
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey)
    return { error: "AI grading belum dikonfigurasi. Hubungi admin." };

  const openai = new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: apiKey,
  });

  const includeCss = params.mode === "html-css" || params.mode === "html-css-js";
  const includeJs = params.mode === "html-css-js";

  const modeLabel =
    params.mode === "html"
      ? "HTML saja"
      : params.mode === "html-css"
        ? "HTML + CSS"
        : "HTML + CSS + JavaScript";

  const prompt = `Kamu adalah penilai proyek Web (HTML${includeCss ? "[+ CSS]" : ""}${includeJs ? "[+ JavaScript]" : ""}) untuk siswa pemula.

## Soal / Deskripsi
${params.description}

## Mode Soal
${modeLabel}

## Jawaban HTML Siswa
\`\`\`html
${params.html}
\`\`\`
${
  includeCss
    ? `
## Jawaban CSS Siswa
\`\`\`css
${params.css}
\`\`\`
`
    : ""
}${
  includeJs
    ? `
## Jawaban JavaScript Siswa
\`\`\`javascript
${params.js}
\`\`\`
`
    : ""
}
## Referensi Jawaban HTML (dari guru)
\`\`\`html
${params.referenceHtml}
\`\`\`
${
  includeCss
    ? `
## Referensi Jawaban CSS (dari guru)
\`\`\`css
${params.referenceCss}
\`\`\`
`
    : ""
}${
  includeJs
    ? `
## Referensi Jawaban JavaScript (dari guru)
\`\`\`javascript
${params.referenceJs}
\`\`\`
`
    : ""
}
## Instruksi Penilaian
1. HANYA nilai bagian yang sesuai mode soal (${params.mode}). Jangan kurangi nilai karena CSS/JS tidak ada jika mode tidak memintanya.
2. Bandingkan jawaban siswa dengan referensi guru dari sisi hasil visual dan/atau fungsional, bukan kesamaan kode literal.
3. Untuk HTML: struktur elemen dan semantik yang relevan dengan soal.
${includeCss ? "4. Untuk CSS: fokus pada apakah CSS MENGHASILKAN VISUAL YANG SAMA, bukan kode identik.\n" : ""}${includeJs ? "5. Untuk JavaScript: periksa apakah logika benar dan interaksi berjalan sesuai soal.\n" : ""}6. Berikan skor 0-100:
   - 90-100: Sempurna atau hampir sempurna
   - 70-89: Sebagian besar benar, ada minor issue
   - 50-69: Konsep dasar benar tapi ada error signifikan
   - 0-49: Jawaban salah atau sangat tidak lengkap

Balas HANYA dengan JSON valid:
{"score": <number>, "feedback": "<feedback mendidik dalam Bahasa Indonesia>"}`;

  let score = 0;
  let feedback = "Tidak dapat menilai jawaban saat ini.";

  try {
    const result = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    const responseText = result.choices[0].message.content || "{}";

    try {
      const parsed = JSON.parse(responseText);
      score = typeof parsed.score === "number" ? parsed.score : 0;
      feedback = parsed.feedback || "Tidak ada feedback.";
    } catch (parseErr) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        score = typeof parsed.score === "number" ? parsed.score : 0;
        feedback = parsed.feedback || "Tidak ada feedback.";
      } else {
        return { error: "Format respons AI tidak dikenali." };
      }
    }
  } catch (err: any) {
    console.error("Web challenge grading AI error:", err);
    return { error: "Gagal memproses penilaian dengan AI. Silakan coba lagi." };
  }

  const now = new Date().toISOString();
  const newAttempts = [...existingAttempts, { score, feedback, at: now }];
  const bestScore = Math.max(score, existing?.score || 0);

  const data = {
    html: params.html,
    css: includeCss ? params.css : "",
    js: includeJs ? params.js : "",
    attempts: newAttempts,
  };

  if (existing) {
    const { error } = await supabase
      .from("submissions")
      .update({
        data,
        score: bestScore,
        graded_at: now,
      })
      .eq("id", existing.id);
    if (error) {
      console.error("Update web challenge submission failed:", error);
      return { error: "Gagal memperbarui: " + error.message };
    }
  } else {
    const { error } = await supabase.from("submissions").insert({
      student_id: user.id,
      content_id: params.lessonId,
      type: "web",
      data,
      score: bestScore,
      status: "graded",
      submitted_at: now,
      graded_at: now,
    });
    if (error) {
      console.error("Insert web challenge submission failed:", error);
      return { error: "Gagal menyimpan: " + error.message };
    }
  }

  // Award XP if score >= 70 and first time passing
  if (score >= 70 && (!existing || (existing.score || 0) < 70)) {
    await supabase.rpc("increment_xp", {
      user_id: user.id,
      amount: params.maxScore,
    });
  }

  revalidatePath(`/lessons/${params.lessonId}`);
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
  revalidatePath("/admin/gradebook");

  return { score, feedback, bestScore, attemptsUsed: newAttempts.length };
}

export async function getWebChallengeHint(params: {
  description: string;
  mode: WebMode;
  studentHtml: string;
  studentCss: string;
  studentJs: string;
  attemptNumber: number;
}): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return "Fitur AI Hint belum dikonfigurasi. Hubungi admin untuk mengaktifkan.";
  }

  const includeCss = params.mode === "html-css" || params.mode === "html-css-js";
  const includeJs = params.mode === "html-css-js";

  try {
    const openai = new OpenAI({
      baseURL: "https://api.deepseek.com",
      apiKey: apiKey,
    });

    const hintLevel =
      params.attemptNumber <= 1
        ? "Berikan petunjuk yang SANGAT umum, hanya arahkan siswa ke konsep yang benar."
        : params.attemptNumber <= 3
          ? "Berikan petunjuk yang lebih spesifik, tunjukkan bagian kode mana yang mungkin salah."
          : "Berikan petunjuk yang cukup detail, hampir menunjukkan solusi tapi jangan berikan jawaban langsung.";

    const prompt = `Kamu adalah tutor Web (HTML${includeCss ? "/CSS" : ""}${includeJs ? "/JS" : ""}) yang ramah dan sabar untuk siswa pemula.

Soal: ${params.description}

## Jawaban HTML Siswa
\`\`\`html
${params.studentHtml}
\`\`\`
${
  includeCss
    ? `
## Jawaban CSS Siswa
\`\`\`css
${params.studentCss}
\`\`\`
`
    : ""
}${
  includeJs
    ? `
## Jawaban JavaScript Siswa
\`\`\`javascript
${params.studentJs}
\`\`\`
`
    : ""
}
Ini adalah percobaan ke-${params.attemptNumber} siswa.

${hintLevel}

Berikan hint SINGKAT (maksimal 2-3 kalimat) dalam Bahasa Indonesia. JANGAN berikan jawaban langsung. Bantu siswa menemukan solusinya sendiri.`;

    const result = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
    });
    return (
      result.choices[0].message.content ||
      "Tidak dapat menghasilkan hint saat ini."
    );
  } catch (err: any) {
    console.error("Web challenge hint error:", err);
    return "Maaf, terjadi kesalahan saat meminta bantuan AI. Silakan coba lagi.";
  }
}
