"use server";

import { DEEPSEEK_DEFAULTS } from "@/lib/deepseek";
import { KAKAK_STYLE, KAKAK_STYLE_JSON } from "@/lib/ai-persona";
import { descriptionToPlainText } from "@/lib/challenge-description";

import {
  checkHintAllowed,
  getLessonAccess,
  LESSON_ACCESS_DENIED,
} from "@/lib/lesson-access";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { awardXp } from "@/lib/xp";
import OpenAI from "openai";

export async function submitCssSolution(params: {
  challengeId: string;
  lessonId: string;
  css: string;
}) {
  const access = await getLessonAccess(params.lessonId);
  if (!access) return { error: LESSON_ACCESS_DENIED };
  const { supabase, user } = access;

  // Soal, kunci jawaban & bobot XP dibaca dari database, bukan dari browser.
  const admin = createAdminClient();
  const { data: challenge } = await admin
    .from("css_challenges")
    .select("id, description, starter_html, reference_css, max_score")
    .eq("lesson_id", params.lessonId)
    .single();
  if (!challenge || challenge.id !== params.challengeId) {
    return { error: "Soal tidak ditemukan." };
  }

  // Fetch existing submission
  const { data: existing } = await supabase
    .from("submissions")
    .select("id, score, data")
    .eq("student_id", user.id)
    .eq("content_id", params.lessonId)
    .eq("type", "css")
    .maybeSingle();

  const existingAttempts: any[] = existing?.data?.attempts || [];
  if (existingAttempts.length >= 3) {
    return { error: "Batas submit sudah tercapai (3/3)" };
  }

  // Call Gemini API for grading
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey)
    return { error: "AI grading belum dikonfigurasi. Hubungi admin." };

  const openai = new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: apiKey,
  });

  const prompt = `Kamu adalah penilai CSS untuk siswa pemula.

## Soal
${descriptionToPlainText(challenge.description)}

## Referensi Jawaban CSS (dari guru)
\`\`\`css
${challenge.reference_css}
\`\`\`

## Jawaban CSS Siswa
\`\`\`css
${params.css}
\`\`\`

## HTML Template
\`\`\`html
${challenge.starter_html}
\`\`\`

## Instruksi Penilaian
1. Bandingkan CSS siswa dengan referensi jawaban guru
2. Fokus pada apakah CSS siswa MENGHASILKAN VISUAL YANG SAMA, bukan kode identik
3. Properti CSS berbeda tapi efek serupa bisa diterima (misal: flex vs inline-block untuk layout sejajar)
4. Berikan skor 0-100:
   - 90-100: Sempurna atau hampir sempurna
   - 70-89: Sebagian besar benar, ada minor issue  
   - 50-69: Konsep dasar benar tapi ada error signifikan
   - 0-49: Jawaban salah atau sangat tidak lengkap

Balas HANYA dengan JSON valid:
{"score": <number>, "feedback": "<feedback mendidik dalam Bahasa Indonesia>"}

Aturan untuk isi "feedback":
${KAKAK_STYLE_JSON}`;

  let score = 0;
  let feedback = "Tidak dapat menilai jawaban saat ini.";

  try {
    const result = await openai.chat.completions.create({
      ...DEEPSEEK_DEFAULTS,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    const responseText = result.choices[0].message.content || "{}";

    try {
      const parsed = JSON.parse(responseText);
      score = typeof parsed.score === "number" ? parsed.score : 0;
      feedback = parsed.feedback || "Tidak ada feedback.";
    } catch (parseErr) {
      // Try to extract JSON from response if parse failed (e.g. markdown block)
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
    console.error("CSS grading AI error:", err);
    return { error: "Gagal memproses penilaian dengan AI. Silakan coba lagi." };
  }

  const now = new Date().toISOString();
  const newAttempts = [...existingAttempts, { score, feedback, at: now }];
  const bestScore = Math.max(score, existing?.score || 0);

  if (existing) {
    const { error } = await admin
      .from("submissions")
      .update({
        data: { css: params.css, attempts: newAttempts },
        score: bestScore,
        graded_at: now,
      })
      .eq("id", existing.id);
    if (error) {
      console.error("Update CSS submission failed:", error);
      return { error: "Gagal memperbarui: " + error.message };
    }
  } else {
    const { error } = await admin.from("submissions").insert({
      student_id: user.id,
      content_id: params.lessonId,
      type: "css",
      data: { css: params.css, attempts: newAttempts },
      score: bestScore,
      status: "graded",
      submitted_at: now,
      graded_at: now,
    });
    if (error) {
      console.error("Insert CSS submission failed:", error);
      return { error: "Gagal menyimpan: " + error.message };
    }
  }

  // Award XP if score >= 70 and first time passing
  let xpEarned = 0;
  if (score >= 70 && (!existing || (existing.score || 0) < 70)) {
    xpEarned = await awardXp(user.id, challenge.max_score ?? 100);
  }

  revalidatePath(`/lessons/${params.lessonId}`);
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
  revalidatePath("/admin/gradebook");

  return {
    score,
    feedback,
    bestScore,
    attemptsUsed: newAttempts.length,
    xpEarned,
  };
}

export async function getCssHint(params: {
  lessonId: string;
  description: string;
  studentCss: string;
  starterHtml: string;
  attemptNumber: number;
}): Promise<string> {
  const hintBlocked = await checkHintAllowed(params.lessonId);
  if (hintBlocked) return hintBlocked;

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return "Fitur AI Hint belum dikonfigurasi. Hubungi admin untuk mengaktifkan.";
  }

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

    const prompt = `Kamu adalah tutor CSS yang ramah dan sabar untuk siswa pemula.

Soal: ${descriptionToPlainText(params.description)}

HTML Template:
\`\`\`html
${params.starterHtml}
\`\`\`

CSS siswa:
\`\`\`css
${params.studentCss}
\`\`\`

Ini adalah percobaan ke-${params.attemptNumber} siswa.

${hintLevel}

Berikan hint SINGKAT (maksimal 4 kalimat pendek) dalam Bahasa Indonesia. JANGAN berikan jawaban langsung. Bantu siswa menemukan solusinya sendiri.

${KAKAK_STYLE}`;

    const result = await openai.chat.completions.create({
      ...DEEPSEEK_DEFAULTS,
      messages: [{ role: "user", content: prompt }],
    });
    return (
      result.choices[0].message.content ||
      "Tidak dapat menghasilkan hint saat ini."
    );
  } catch (err: any) {
    console.error("CSS Hint error:", err);
    return "Maaf, terjadi kesalahan saat meminta bantuan AI. Silakan coba lagi.";
  }
}
