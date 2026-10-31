const PAGE_SIZE = 1000;

// Supabase memotong hasil query di 1.000 baris; ambil halaman demi halaman sampai habis.
// Query harus diurutkan stabil (mis. berdasarkan id) agar halaman tidak tumpang tindih.
export async function fetchAllRows<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}
