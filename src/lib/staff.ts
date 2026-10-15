import { createClient } from "@/utils/supabase/server";
import { isStaff } from "@/lib/student-access";

// Untuk server action yang memakai service role (createAdminClient, awardXp):
// pemanggilnya wajib admin/guru, karena service role melewati RLS.
export async function currentUserIsStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return isStaff(profile?.role);
}
