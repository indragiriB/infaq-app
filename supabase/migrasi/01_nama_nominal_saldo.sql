-- =========================================================
-- Migrasi Data Kertas → Online (Tahap 1: Nama, Nominal, Saldo Kas)
-- Jalankan di Supabase SQL Editor.
-- =========================================================

-- -------------------------------
-- 1. Nominal Rp8.000 (kategori A / pra remaja) — belum ada di opsi_infaq
-- -------------------------------
insert into opsi_infaq (label, nominal)
select 'Rp8.000', 8000
where not exists (select 1 from opsi_infaq where nominal = 8000);

-- -------------------------------
-- 2. Anggota — PI (Putri) & PA (Putra), dari catatan "INFAQ ABC REMAJA SUMBER"
-- -------------------------------
insert into anggota (nama)
values
  -- PI (Putri)
  ('Almaira Zahwa Talita'),
  ('Arsinta Pramesti'),
  ('Bilqis Putri'),
  ('Cindy Agil Widyaningrum'),
  ('Fadhila Nur Cahyani'),
  ('Fauzia Nurlaila Rosyida'),
  ('Feyza Zahra Elvara'),
  ('Jasmine Ahmad Susetyo'),
  ('Joysha Anatasya'),
  ('Linta Aulia Hasanah'),
  ('Luluk Anna Firdaus'),
  ('Nabila Almaghfira'),
  ('Nashira Nareswari Nugroho'),
  ('Nasriya Anjanni Suci'),
  ('Noni Putri Zulaikah'),
  ('Rona Rifdah Parameswara'),
  ('Sabrina Saffa Bella'),
  ('Salwa Bunga Anggraeni'),
  ('Salsabilla Salma Almer'),
  ('Sheva Tithania Soraya'),
  ('Shifa Vika Azzahra'),
  ('Vina Faza Malika'),
  ('Yuliana Zaharani'),
  ('Zulfa Ainu Rosyida'),
  -- PA (Putra)
  ('Alfi Maulana Azzaki'),
  ('Ardian Rizky Firdaus'),
  ('Balhaqi Ahmad Khaizan'),
  ('Farhan Fathurrozi'),
  ('Imam Ferdinand'),
  ('Indragiri Bhakti'),
  ('Joan Giesar Tubis'),
  ('Mufti Hakim Ar-Rasyid'),
  ('Muhammad Ikhsan Choirudin'),
  ('Muhammad Yusuf'),
  ('Naufal Zaidan'),
  ('Rabbani Rimang Ramadhian'),
  ('Raihan Mahesa Putra'),
  ('Rayhan Khalilla Ridha Rabbani'),
  ('Ahmad Fais Farizal')
on conflict (nama) do nothing;

-- -------------------------------
-- 3. Saldo awal Kas Kelompok dari migrasi kertas
--    (sudah termasuk infaq ABC yang sudah dikirim ke Daerah)
-- -------------------------------
insert into kas_kelompok (jenis, jumlah, keterangan, sumber)
values (
  'masuk',
  1457700,
  'Saldo awal migrasi dari catatan kertas (termasuk infaq ABC yang sudah dikirim)',
  'manual'
);
