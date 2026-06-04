-- Run this in your Supabase SQL Editor to add test cases for "Aplikasi Bioskop" (HTML+JS Challenge)
-- The challenge ID is '551db1b1-7c0e-41e1-b6e8-ebbe66431e60'

INSERT INTO test_cases (challenge_id, title, input, expected_output, is_hidden, order_index)
VALUES 
  (
    '551db1b1-7c0e-41e1-b6e8-ebbe66431e60', 
    'Anak-anak (Usia 10) harus mendapat potongan harga', 
    'return typeof hitungHargaTiket === "function" ? hitungHargaTiket(10) : "hitungHargaTiket tidak didefinisikan";', 
    '35000', 
    false, 
    1
  ),
  (
    '551db1b1-7c0e-41e1-b6e8-ebbe66431e60', 
    'Dewasa (Usia 20) membayar tarif normal', 
    'return typeof hitungHargaTiket === "function" ? hitungHargaTiket(20) : "hitungHargaTiket tidak didefinisikan";', 
    '50000', 
    false, 
    2
  ),
  (
    '551db1b1-7c0e-41e1-b6e8-ebbe66431e60', 
    'Batas Usia (Usia 15) membayar tarif normal', 
    'return typeof hitungHargaTiket === "function" ? hitungHargaTiket(15) : "hitungHargaTiket tidak didefinisikan";', 
    '50000', 
    true, 
    3
  );
