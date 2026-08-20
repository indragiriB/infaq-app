-- =========================================================
-- Migration: Barang Barokah (75% masuk kas, 25% dilaporkan via WA)
-- =========================================================

-- Kolom buat simpan nilai TOTAL sebelum dipecah (khusus sumber = 'barang_barokah').
-- kolom `jumlah` yang sudah ada tetap dipakai buat porsi 75% yang masuk kas.
alter table kas_kelompok
  add column if not exists jumlah_asli numeric;

-- Perluas pilihan sumber supaya bisa menandai baris sebagai 'barang_barokah'
alter table kas_kelompok drop constraint if exists kas_kelompok_sumber_check;
alter table kas_kelompok
  add constraint kas_kelompok_sumber_check
  check (sumber in ('manual', 'otomatis_infaq', 'barang_barokah'));

-- Rasio yang disetorkan lewat Laporan WA (default 25%, sisanya masuk kas),
-- diambil dari pengaturan supaya bisa diubah tanpa ubah kode.
alter table pengaturan
  add column if not exists rasio_setor_barokah numeric not null default 0.25;
