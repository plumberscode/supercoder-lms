// Model & opsi default untuk semua panggilan DeepSeek.
// Mode berpikir dimatikan: tugas kita (hint, penilaian, pengolahan soal) tidak
// butuh penalaran panjang, dan mode berpikir (default aktif) membuat respons lebih
// lambat dan mahal. Di-spread ke params karena `thinking` bukan field bawaan SDK OpenAI.
export const DEEPSEEK_DEFAULTS = {
  model: "deepseek-flash",
  thinking: { type: "disabled" },
};
