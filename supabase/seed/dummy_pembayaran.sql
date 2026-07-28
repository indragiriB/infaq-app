-- =========================================================
-- Data Dummy: Anggota + Pembayaran (mix nominal 5k / 10k / 15k)
-- Jalankan di Supabase SQL Editor setelah semua migration diterapkan.
-- Aman dijalankan berkali-kali (pakai ON CONFLICT / cek duplikat sederhana).
-- =========================================================

-- -------------------------------
-- 1. Anggota (nama pembayar)
-- -------------------------------
insert into anggota (nama)
values
  ('Ahmad Fauzi'),
  ('Siti Aminah'),
  ('Budi Santoso'),
  ('Dewi Lestari'),
  ('Rudi Hartono'),
  ('Nur Kholifah'),
  ('Agus Salim'),
  ('Wati Suryani'),
  ('Hendra Wijaya'),
  ('Ika Puspita')
on conflict (nama) do nothing;

-- -------------------------------
-- 2. Pembayaran — mix nominal 5.000 / 10.000 / 15.000
--    dengan beberapa pola berbeda buat nge-tes Rekap Tahunan:
-- -------------------------------

-- Ahmad Fauzi: bayar rutin tiap bulan, nominal 10.000
insert into pembayaran (nama_pembayar, jumlah_bayar, bulan) values
  ('Ahmad Fauzi', 10000, '2026-01'),
  ('Ahmad Fauzi', 10000, '2026-02'),
  ('Ahmad Fauzi', 10000, '2026-03'),
  ('Ahmad Fauzi', 10000, '2026-04'),
  ('Ahmad Fauzi', 10000, '2026-05'),
  ('Ahmad Fauzi', 10000, '2026-06'),
  ('Ahmad Fauzi', 10000, '2026-07');

-- Siti Aminah: langsung bayar 12 bulan sekaligus (nominal 5.000/bulan)
insert into pembayaran (nama_pembayar, jumlah_bayar, bulan) values
  ('Siti Aminah', 5000, '2026-01'),
  ('Siti Aminah', 5000, '2026-02'),
  ('Siti Aminah', 5000, '2026-03'),
  ('Siti Aminah', 5000, '2026-04'),
  ('Siti Aminah', 5000, '2026-05'),
  ('Siti Aminah', 5000, '2026-06'),
  ('Siti Aminah', 5000, '2026-07'),
  ('Siti Aminah', 5000, '2026-08'),
  ('Siti Aminah', 5000, '2026-09'),
  ('Siti Aminah', 5000, '2026-10'),
  ('Siti Aminah', 5000, '2026-11'),
  ('Siti Aminah', 5000, '2026-12');

-- Budi Santoso: bayar sporadis, nominal campur
insert into pembayaran (nama_pembayar, jumlah_bayar, bulan) values
  ('Budi Santoso', 15000, '2026-02'),
  ('Budi Santoso', 5000, '2026-04'),
  ('Budi Santoso', 10000, '2026-06');

-- Dewi Lestari: bayar 3 bulan pertama saja lalu berhenti
insert into pembayaran (nama_pembayar, jumlah_bayar, bulan) values
  ('Dewi Lestari', 15000, '2026-01'),
  ('Dewi Lestari', 15000, '2026-02'),
  ('Dewi Lestari', 15000, '2026-03');

-- Rudi Hartono: rutin, nominal 15.000
insert into pembayaran (nama_pembayar, jumlah_bayar, bulan) values
  ('Rudi Hartono', 15000, '2026-01'),
  ('Rudi Hartono', 15000, '2026-02'),
  ('Rudi Hartono', 15000, '2026-03'),
  ('Rudi Hartono', 15000, '2026-04'),
  ('Rudi Hartono', 15000, '2026-05'),
  ('Rudi Hartono', 15000, '2026-06'),
  ('Rudi Hartono', 15000, '2026-07');

-- Nur Kholifah: rutin, nominal 5.000
insert into pembayaran (nama_pembayar, jumlah_bayar, bulan) values
  ('Nur Kholifah', 5000, '2026-01'),
  ('Nur Kholifah', 5000, '2026-02'),
  ('Nur Kholifah', 5000, '2026-03'),
  ('Nur Kholifah', 5000, '2026-04'),
  ('Nur Kholifah', 5000, '2026-05'),
  ('Nur Kholifah', 5000, '2026-06'),
  ('Nur Kholifah', 5000, '2026-07');

-- Agus Salim: baru mulai bayar pertengahan tahun, nominal naik turun
insert into pembayaran (nama_pembayar, jumlah_bayar, bulan) values
  ('Agus Salim', 10000, '2026-04'),
  ('Agus Salim', 15000, '2026-05'),
  ('Agus Salim', 5000, '2026-06'),
  ('Agus Salim', 10000, '2026-07');

-- Wati Suryani: rutin, nominal 10.000, sempat bolong bulan Maret
insert into pembayaran (nama_pembayar, jumlah_bayar, bulan) values
  ('Wati Suryani', 10000, '2026-01'),
  ('Wati Suryani', 10000, '2026-02'),
  ('Wati Suryani', 10000, '2026-04'),
  ('Wati Suryani', 10000, '2026-05'),
  ('Wati Suryani', 10000, '2026-06'),
  ('Wati Suryani', 10000, '2026-07');

-- Hendra Wijaya: cuma bayar 2 kali, nominal besar
insert into pembayaran (nama_pembayar, jumlah_bayar, bulan) values
  ('Hendra Wijaya', 15000, '2026-03'),
  ('Hendra Wijaya', 15000, '2026-07');

-- Ika Puspita: rutin, nominal campur tiap bulan
insert into pembayaran (nama_pembayar, jumlah_bayar, bulan) values
  ('Ika Puspita', 5000, '2026-01'),
  ('Ika Puspita', 10000, '2026-02'),
  ('Ika Puspita', 15000, '2026-03'),
  ('Ika Puspita', 5000, '2026-04'),
  ('Ika Puspita', 10000, '2026-05'),
  ('Ika Puspita', 15000, '2026-06'),
  ('Ika Puspita', 5000, '2026-07');
