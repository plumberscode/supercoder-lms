import { createClient } from "@supabase/supabase-js";

// Client service role: melewati RLS. HANYA untuk kode server (webhook Mayar, halaman status
// pembayaran) — jangan pernah di-import dari Client Component.
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
