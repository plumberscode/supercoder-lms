// Shared constants for the "Promo 9.9" registration campaign.
// Kept in a plain (non "use server") module so it can be imported from both
// server actions and client components without violating Next.js server-action
// export rules (a "use server" file may only export async functions).
export const PROMO_VOUCHER_CODE = "SUPERCODER99";
