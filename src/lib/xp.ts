import { createAdminClient } from "@/utils/supabase/admin";

// increment_xp hanya bisa dipanggil service role (migration_xp_integrity.sql), jadi XP
// tidak bisa ditambah langsung dari browser. Pemanggil bertanggung jawab memastikan
// XP ini memang berhak diberikan (lulus pertama kali, dinilai guru, dst.).
export async function awardXp(userId: string, amount: number) {
  const xp = Math.round(amount);
  if (!(xp > 0)) return;
  const { error } = await createAdminClient().rpc("increment_xp", {
    user_id: userId,
    amount: xp,
  });
  if (error) console.error("increment_xp error:", error);
}
