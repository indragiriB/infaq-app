-- =========================================================
-- Migration: Kas Kelompok + Nomor WA Laporan
-- =========================================================

-- -------------------------------
-- Tabel: kas_kelompok
-- Mencatat mutasi kas kelompok (manual maupun otomatis dari
-- hasil pembagian infaq bulanan).
-- -------------------------------
create table if not exists kas_kelompok (
  id uuid primary key default gen_random_uuid(),
  jenis text not null check (jenis in ('masuk', 'keluar')),
  jumlah numeric not null check (jumlah >= 0),
  keterangan text,
  sumber text not null default 'manual' check (sumber in ('manual', 'otomatis_infaq')),
  periode_terkait text, -- 'YYYY-MM', diisi kalau sumber = 'otomatis_infaq'
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create index if not exists idx_kas_kelompok_created_at on kas_kelompok (created_at desc);

-- Cegah bagian kelompok infaq periode yang sama ditambahkan ke kas dua kali
create unique index if not exists idx_kas_otomatis_unique
  on kas_kelompok (periode_terkait)
  where sumber = 'otomatis_infaq';

alter table kas_kelompok enable row level security;

create policy "kas_kelompok_select_authenticated"
  on kas_kelompok for select
  using (auth.role() = 'authenticated');

create policy "kas_kelompok_insert_authenticated"
  on kas_kelompok for insert
  with check (auth.role() = 'authenticated');

create policy "kas_kelompok_delete_authenticated"
  on kas_kelompok for delete
  using (auth.role() = 'authenticated');

-- -------------------------------
-- Tambah kolom nomor WA tujuan laporan ke tabel pengaturan
-- (supaya nomor bisa diganti tanpa ubah kode)
-- -------------------------------
alter table pengaturan
  add column if not exists nomor_wa_laporan text not null default '6288216175883';
