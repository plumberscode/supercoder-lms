import type { SupabaseClient } from "@supabase/supabase-js";

export const TTL = {
  serp: 7 * 24 * 3600,
  crawl: 24 * 3600,
  gsc: 24 * 3600,
  pagespeed: 24 * 3600,
  autocomplete: 30 * 24 * 3600,
} as const;

/**
 * Ambil dari seo_cache bila masih berlaku, kalau tidak jalankan `fn` lalu simpan.
 * Kegagalan cache tidak pernah menggagalkan tool.
 */
export async function withCache<T>(
  supabase: SupabaseClient,
  key: string,
  provider: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    const { data } = await supabase
      .from("seo_cache")
      .select("payload")
      .eq("key", key)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (data) return data.payload as T;
  } catch {
    // abaikan
  }

  const value = await fn();

  try {
    await supabase.from("seo_cache").upsert({
      key,
      provider,
      payload: value,
      fetched_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    });
  } catch {
    // abaikan
  }
  return value;
}
