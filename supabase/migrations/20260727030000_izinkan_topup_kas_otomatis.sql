-- =========================================================
-- Migration: Izinkan top-up kas kelompok otomatis per periode
-- (sebelumnya dikunci 1x per periode lewat unique index, sekarang
-- boleh ditambahkan berkali-kali sebagai "selisih" kalau ada infaq
-- susulan yang masuk setelah kas pertama kali ditambahkan)
-- =========================================================

drop index if exists idx_kas_otomatis_unique;
