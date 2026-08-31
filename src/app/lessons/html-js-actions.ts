"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import OpenAI from "openai";

export async function submitHtmlJsSolution(params: {
  challengeId: string;
  lessonId: string;
  html: string;
  js: string;
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
    .eq("type", "code")
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

  const prompt = `Kamu adalah penilai kode HTML dan Javascript untuk siswa.

## Soal / Deskripsi
${params.description}

## Jawaban HTML Siswa
\`\`\`html
${params.html}
\`\`\`

## Jawaban Javascript Siswa
\`\`\`javascript
${params.js}
\`\`\`

## Instruksi Penilaian
1. Evaluasi kode HTML dan Javascript siswa berdasarkan deskripsi soal.
2. Periksa apakah logika Javascript benar dan menangani interaksi HTML sesuai soal.
3. Berikan skor 0-100:
   - 90-100: Sempurna atau hampir sempurna, logika jalan tanpa bug.
   - 70-89: Sebagian besar benar, fungsionalitas utama berjalan dengan sedikit kekurangan.
   - 50-69: Ada usaha yang relevan, tetapi ada error logika atau gagal mengimplementasikan bagian krusial.
   - 0-49: Salah, error parah, atau sangat tidak lengkap.

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
    console.error("HTML+JS grading AI error:", err);
    return { error: "Gagal memproses penilaian dengan AI. Silakan coba lagi." };
  }

  const now = new Date().toISOString();
  const newAttempts = [...existingAttempts, { score, feedback, at: now }];
  const bestScore = Math.max(score, existing?.score || 0);

  if (existing) {
    const { error } = await supabase
      .from("submissions")
      .update({
        data: { code: params.js, html: params.html, attempts: newAttempts },
        score: bestScore,
        graded_at: now,
      })
      .eq("id", existing.id);
    if (error) {
      console.error("Update submission failed:", error);
      return { error: "Gagal memperbarui: " + error.message };
    }
  } else {
    const { error } = await supabase.from("submissions").insert({
      student_id: user.id,
      content_id: params.lessonId,
      type: "code",
      data: { code: params.js, html: params.html, attempts: newAttempts },
      score: bestScore,
      status: "graded",
      submitted_at: now,
      graded_at: now,
    });
    if (error) {
      console.error("Insert submission failed:", error);
      return { error: "Gagal menyimpan: " + error.message };
    }
  }

  // Award XP ONCE: only when transitioning from below-70 to 70+
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

export async function getHtmlJsHint(params: {
  description: string;
  studentHtml: string;
  studentJs: string;
  attemptNumber: number;
}): Promise<string> {
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
        ? "Berikan petunjuk umum. Fokus pada logika atau konsep yang salah."
        : params.attemptNumber <= 3
          ? "Berikan petunjuk spesifik ke bagian mana di JS atau HTML yang error."
          : "Berikan petunjuk detail, hampir menunjukkan solusi kode.";

    const prompt = `Kamu adalah tutor Javascript & HTML untuk siswa pemula.

Soal: ${params.description}

Kode HTML siswa:
\`\`\`html
${params.studentHtml}
\`\`\`

Kode Javascript siswa:
\`\`\`javascript
${params.studentJs}
\`\`\`

Ini adalah percobaan ke-${params.attemptNumber} siswa.
${hintLevel}

Berikan hint SINGKAT (maksimal 2-3 kalimat) dalam Bahasa Indonesia. JANGAN berikan jawaban langsung.`;

    const result = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
    });
    return (
      result.choices[0].message.content ||
      "Tidak dapat menghasilkan hint saat ini."
    );
  } catch (err: any) {
    console.error("HTML+JS Hint error:", err);
    return "Maaf, terjadi kesalahan saat meminta bantuan AI. Silakan coba lagi.";
  }
}
