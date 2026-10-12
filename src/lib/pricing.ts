// Harga bulan pertama yang dibayar online lewat Mayar saat mendaftar.
// Kelas yang tidak ada di sini (Custom Project Class) tidak dibayar online.
export const CLASS_PRICES: Record<string, number> = {
  "Weekend Coding Class": 399000,
  "Premium Online Class": 449000,
};

export function getClassPrice(selectedClass: string): number | null {
  return CLASS_PRICES[selectedClass] ?? null;
}

export function formatRupiah(amount: number) {
  return `Rp${amount.toLocaleString("id-ID")}`;
}
