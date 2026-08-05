-- =========================================================
-- Migration: Izinkan hapus user Supabase Auth
-- Sebelumnya kolom created_by/updated_by/deleted_by di beberapa tabel
-- menunjuk ke auth.users(id) tanpa aturan ON DELETE, jadi Supabase
-- menolak menghapus user selama masih ada data yang menunjuk ke dia.
--
-- Migration ini mengubahnya jadi ON DELETE SET NULL: kalau user-nya
-- dihapus, datanya (pembayaran, kas, dll) TETAP ada, cuma kolom
-- "siapa yang input/edit/hapus"-nya jadi kosong (bukan error).
-- =========================================================

alter table pembayaran drop constraint if exists pembayaran_created_by_fkey;
alter table pembayaran
  add constraint pembayaran_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

alter table pembayaran drop constraint if exists pembayaran_updated_by_fkey;
alter table pembayaran
  add constraint pembayaran_updated_by_fkey
  foreign key (updated_by) references auth.users(id) on delete set null;

alter table kas_kelompok drop constraint if exists kas_kelompok_created_by_fkey;
alter table kas_kelompok
  add constraint kas_kelompok_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

alter table kas_kelompok drop constraint if exists kas_kelompok_updated_by_fkey;
alter table kas_kelompok
  add constraint kas_kelompok_updated_by_fkey
  foreign key (updated_by) references auth.users(id) on delete set null;

alter table kas_kelompok drop constraint if exists kas_kelompok_deleted_by_fkey;
alter table kas_kelompok
  add constraint kas_kelompok_deleted_by_fkey
  foreign key (deleted_by) references auth.users(id) on delete set null;

alter table anggota drop constraint if exists anggota_created_by_fkey;
alter table anggota
  add constraint anggota_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

alter table opsi_infaq drop constraint if exists opsi_infaq_created_by_fkey;
alter table opsi_infaq
  add constraint opsi_infaq_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

-- admin_profiles.id memang sengaja ON DELETE CASCADE dari awal (kalau
-- user dihapus, profil namanya ikut kehapus juga) — tidak perlu diubah.
