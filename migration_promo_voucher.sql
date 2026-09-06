-- Migration: Add voucher code support to registrations (Promo 9.9)
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS voucher_code TEXT;

COMMENT ON COLUMN public.registrations.voucher_code IS
  'Kode voucher promo yang dipakai saat pendaftaran, mis. SUPERCODER99 (Promo 9.9, diskon Rp50.000/bulan selamanya).';
