import OpenAI from "openai";

export const MAX_SOURCE_TEXT_LENGTH = 20000;

// Draf soal hasil olahan AI. Belum disimpan: admin/guru memeriksa dulu di pratinjau.
export interface DraftQuestion {
  category: string;
  question_text: string;
  options: string[];
  correct_option_index: number;
  points: number;
  // true bila kunci jawaban tidak ada di teks sumber dan ditentukan oleh AI
  answer_from_ai: boolean;
  // true bila pilihan jawaban (sebagian/semua) dibuat oleh AI
  options_from_ai: boolean;
}

export async function parseQuestionsWithAI(
  sourceText: string,
  defaultCategory: string,
): Promise<{ questions: DraftQuestion[] } | { error: string }> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return { error: "DEEPSEEK_API_KEY belum dikonfigurasi." };
  }

  const openai = new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey,
  });

  const prompt = `Kamu membantu guru menyusun bank soal pilihan ganda untuk siswa belajar coding.

Di bawah ini teks mentah dari guru. Teks bisa berisi campuran:
- soal pilihan ganda lengkap (dengan opsi dan kunci jawaban),
- soal pilihan ganda tanpa kunci jawaban,
- soal isian/esai singkat tanpa pilihan,
- nomor, judul bagian, catatan, atau teks lain yang BUKAN soal.

Tugasmu:
1. Pilah teks: ambil hanya bagian yang merupakan soal. Abaikan judul, instruksi umum, dan catatan.
2. Ubah setiap soal menjadi pilihan ganda dengan TEPAT 4 opsi.
   - Jika soal sudah punya opsi, pakai opsi aslinya (hapus label "A.", "b)", dll). Jika kurang dari 4, tambahkan pengecoh yang masuk akal. Jika lebih dari 4, pertahankan jawaban benar dan pilih 3 pengecoh terbaik.
   - Jika soal tidak punya opsi, buat 1 jawaban benar dan 3 pengecoh yang masuk akal, setara panjang dan gayanya.
3. Tentukan indeks jawaban benar (0-3). Gunakan kunci dari teks bila ada (mis. "Jawaban: B", "Kunci: c", tanda *, atau tebal). Jika tidak ada, tentukan sendiri jawaban yang benar.
4. Acak posisi jawaban benar untuk soal yang opsinya kamu buat sendiri, jangan selalu di posisi yang sama.
5. Pertahankan bahasa soal aslinya. Rapikan ejaan seperlunya tanpa mengubah makna. Kode program dalam soal pertahankan apa adanya (boleh dibungkus backtick).
6. Isi "category" dengan topik singkat soal (mis. "HTML Dasar", "Python Perulangan"). Jika ragu, pakai "${defaultCategory || "Umum"}".

Balas HANYA dengan JSON valid berbentuk:
{"questions": [{"category": "...", "question_text": "...", "options": ["...", "...", "...", "..."], "correct_option_index": 0, "answer_from_ai": false, "options_from_ai": false}]}

- "answer_from_ai": true jika kunci jawaban TIDAK tertulis di teks dan kamu yang menentukannya.
- "options_from_ai": true jika sebagian/semua opsi kamu yang membuat.
- Jika tidak ada soal sama sekali, balas {"questions": []}.

Teks dari guru:
"""
${sourceText}
"""`;

  let responseText: string;
  try {
    const result = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 8000,
    });
    responseText = result.choices[0].message.content || "{}";
  } catch (err) {
    console.error("AI question parsing error:", err);
    return { error: "Gagal menghubungi AI. Silakan coba lagi." };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { error: "Format respons AI tidak dikenali." };
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return {
        error:
          "Respons AI terpotong atau tidak valid. Coba kirim teks yang lebih pendek.",
      };
    }
  }

  const raw: any[] = Array.isArray(parsed?.questions) ? parsed.questions : [];
  const questions = raw
    .map((q) => normalizeDraft(q, defaultCategory))
    .filter((q): q is DraftQuestion => q !== null);

  return { questions };
}

function normalizeDraft(q: any, defaultCategory: string): DraftQuestion | null {
  const question_text = String(q?.question_text ?? "").trim();
  const options: string[] = Array.isArray(q?.options)
    ? q.options.map((o: unknown) => String(o ?? "").trim()).filter(Boolean)
    : [];
  const index = Number(q?.correct_option_index);

  if (!question_text || options.length !== 4) return null;
  if (!Number.isInteger(index) || index < 0 || index > 3) return null;

  const options_from_ai = Boolean(q?.options_from_ai);
  // AI cenderung menaruh jawaban benar di opsi pertama walau sudah diminta acak.
  // Opsi dari teks guru dibiarkan urut aslinya.
  const { shuffled, correctIndex } = options_from_ai
    ? shuffleOptions(options, index)
    : { shuffled: options, correctIndex: index };

  return {
    category:
      String(q?.category ?? "").trim() || defaultCategory.trim() || "Umum",
    question_text,
    options: shuffled,
    correct_option_index: correctIndex,
    points: 10,
    answer_from_ai: Boolean(q?.answer_from_ai),
    options_from_ai,
  };
}

function shuffleOptions(options: string[], correctIndex: number) {
  const order = options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    shuffled: order.map((i) => options[i]),
    correctIndex: order.indexOf(correctIndex),
  };
}
