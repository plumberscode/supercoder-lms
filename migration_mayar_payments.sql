-- Migration: Pembayaran online Mayar untuk pendaftaran (Weekend & Premium, bulan pertama)
-- Kolom `status` tetap untuk follow-up admin; pembayaran dicatat terpisah.
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS payment_status TEXT,          -- NULL (tidak bayar online), 'unpaid', 'paid'
  ADD COLUMN IF NOT EXISTS payment_amount INTEGER,       -- rupiah
  ADD COLUMN IF NOT EXISTS mayar_payment_id TEXT UNIQUE, -- id Single Payment Request Mayar
  ADD COLUMN IF NOT EXISTS mayar_payment_link TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.registrations.payment_status IS
  'Status pembayaran Mayar: NULL (Custom Project / tidak bayar online), unpaid, paid. Diubah oleh webhook /api/webhooks/mayar (service role).';
