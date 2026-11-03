import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}

/**
 * Identitas pengguna untuk render halaman. Memakai `getClaims()` yang memverifikasi
 * JWT secara lokal (dengan kunci JWKS yang di-cache) bila proyek memakai asymmetric
 * signing key, jadi tidak perlu bolak-balik ke server Auth seperti `getUser()`.
 * Server action yang mengubah data tetap memakai `getUser()`.
 */
export async function getSessionUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<{ id: string; email?: string } | null> {
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: claims.email };
}
