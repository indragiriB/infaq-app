-- =========================================================
-- Migration: Nama Admin + Tracking Edit/Hapus
-- =========================================================

-- -------------------------------
-- Tabel: admin_profiles (nama tampilan tiap akun admin)
-- -------------------------------
create table if not exists admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  created_at timestamptz not null default now()
);

alter table admin_profiles enable row level security;

create policy "admin_profiles_select_authenticated"
  on admin_profiles for select
  using (auth.role() = 'authenticated');

-- Admin cuma boleh isi/ubah nama miliknya sendiri
create policy "admin_profiles_insert_own"
  on admin_profiles for insert
  with check (auth.uid() = id);

create policy "admin_profiles_update_own"
  on admin_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- -------------------------------
-- pembayaran: kolom tracking siapa & kapan terakhir diubah
-- -------------------------------
alter table pembayaran
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists updated_at timestamptz;

-- -------------------------------
-- kas_kelompok: kolom tracking edit + soft-delete (biar histori
-- "siapa hapus, kapan" tetap ada, tidak benar-benar hilang dari DB)
-- -------------------------------
alter table kas_kelompok
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists updated_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id),
  add column if not exists deleted_at timestamptz;

-- kas_kelompok belum punya policy UPDATE — dibutuhkan buat edit & soft-delete
create policy "kas_kelompok_update_authenticated"
  on kas_kelompok for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Unique index otomatis_infaq per periode perlu diperbarui supaya baris
-- yang sudah di-soft-delete tidak ikut dihitung (biar bisa ditambahkan lagi)
drop index if exists idx_kas_otomatis_unique;
create unique index idx_kas_otomatis_unique
  on kas_kelompok (periode_terkait)
  where sumber = 'otomatis_infaq' and deleted_at is null;
