// Indonesian numbers: strip non-digits, leading 0 -> 62. Returns "" when nothing usable is left.
export function normalizeWaNumber(phone: string | null | undefined) {
  let clean = (phone || "").replace(/\D/g, "");
  if (clean.startsWith("0")) {
    clean = "62" + clean.substring(1);
  } else if (clean.startsWith("8")) {
    clean = "62" + clean;
  }
  return clean;
}

export function buildWaLink(phone: string | null | undefined, text: string) {
  return `https://wa.me/${normalizeWaNumber(phone)}?text=${encodeURIComponent(text)}`;
}
