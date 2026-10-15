// Akun MINAS login dengan username, tapi Supabase Auth wajib email. Setiap username
// dipetakan ke email buatan di domain ini. Email ini tidak pernah dikirimi apa pun
// (akun dibuat dengan email_confirm: true dan tidak ada fitur lupa password).
export const MINAS_EMAIL_DOMAIN = "minas.supercoder.id";

export function normalizeUsername(input: string) {
  return input.trim().toLowerCase();
}

export function minasEmail(username: string) {
  return `${normalizeUsername(username)}@${MINAS_EMAIL_DOMAIN}`;
}

// Satu nama per baris; baris kosong diabaikan. Nama kembar tetap dibuat (dua siswa bisa
// bernama sama) dan dibedakan oleh username.
export function parseNameList(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

// Kata depan nama, huruf kecil a-z saja: "Muhammad Ali" -> "muhammad", "Ça" -> "ca".
export function usernameBase(fullName: string) {
  const first = fullName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z]/g, ""))
    .find(Boolean);
  return (first || "siswa").slice(0, 12);
}

type Random = () => number;

function randomInt(min: number, max: number, random: Random) {
  return min + Math.floor(random() * (max - min + 1));
}

// base + 2 angka (mis. budi27); 3 angka jika kombinasi 2 angka sudah habis dipakai.
export function pickUsername(
  base: string,
  taken: Set<string>,
  random: Random = Math.random,
) {
  for (const [min, max] of [
    [10, 99],
    [100, 999],
  ]) {
    for (let attempt = 0; attempt < 200; attempt++) {
      const candidate = `${base}${randomInt(min, max, random)}`;
      if (!taken.has(candidate)) return candidate;
    }
  }
  throw new Error(`Tidak menemukan username kosong untuk "${base}"`);
}

// Kata yang mudah dieja anak + 2 angka, mis. "kucing47". Min. 8 karakter.
const PASSWORD_WORDS = [
  "apel", "awan", "bintang", "bulan", "buku", "gajah", "harimau", "jeruk",
  "kelinci", "kopi", "kucing", "kupu", "laut", "mangga", "matahari", "melati",
  "naga", "nanas", "pelangi", "pensil", "pinguin", "roket", "rusa", "salju",
  "semut", "singa", "tomat", "topi", "ular", "zebra",
];

export function generatePassword(random: Random = Math.random) {
  const word = PASSWORD_WORDS[randomInt(0, PASSWORD_WORDS.length - 1, random)];
  const digits = word.length >= 6 ? 2 : 4;
  const number = randomInt(10 ** (digits - 1), 10 ** digits - 1, random);
  return `${word}${number}`;
}
