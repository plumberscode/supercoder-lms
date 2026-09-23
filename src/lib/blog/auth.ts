import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

async function getAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  return { supabase, user, profile };
}

/** Untuk server action blog: hanya role admin (teacher tidak). */
export async function requireBlogAdmin() {
  const { supabase, user, profile } = await getAdmin();
  if (!user || profile?.role !== "admin") {
    throw new Error("Hanya admin yang dapat mengelola blog.");
  }
  return { supabase, user, profile };
}

/** Untuk halaman admin blog: arahkan non-admin kembali ke /admin. */
export async function requireBlogAdminPage() {
  const { supabase, user, profile } = await getAdmin();
  if (!user) redirect("/login");
  if (profile?.role !== "admin") redirect("/admin/registrations");
  return { supabase, user, profile };
}
