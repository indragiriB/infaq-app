-- =========================================================
-- Migration: Init skema Infaq (pembayaran + pengaturan)
-- =========================================================

-- Extension untuk gen_random_uuid()
create extension if not exists "pgcrypto";

-- -------------------------------
-- Tabel: pengaturan
-- -------------------------------
create table if not exists pengaturan (
  id int primary key default 1,
  potongan_kelompok_per_bayar numeric not null default 1000,
  potongan_desa_per_bayar numeric not null default 2000,
  rasio_daerah numeric not null default 0.5,
  rasio_kelompok numeric not null default 0.5,
  sodaqoh_rutin_bulanan numeric not null default 10000,
  constraint pengaturan_single_row check (id = 1)
);

-- Seed baris default (hanya kalau belum ada)
insert into pengaturan (id)
values (1)
on conflict (id) do nothing;

-- -------------------------------
-- Tabel: pembayaran
-- -------------------------------
create table if not exists pembayaran (
  id uuid primary key default gen_random_uuid(),
  nama_pembayar text not null,
  jumlah_bayar numeric not null check (jumlah_bayar >= 0),
  bulan text not null, -- format 'YYYY-MM'
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

-- Index untuk filter per bulan (dipakai terus di halaman Rekap)
create index if not exists idx_pembayaran_bulan on pembayaran (bulan);

-- -------------------------------
-- Row Level Security
-- -------------------------------
alter table pembayaran enable row level security;
alter table pengaturan enable row level security;

-- Policy: pembayaran — hanya user login yang boleh SELECT/INSERT/UPDATE/DELETE
create policy "pembayaran_select_authenticated"
  on pembayaran for select
  using (auth.role() = 'authenticated');

create policy "pembayaran_insert_authenticated"
  on pembayaran for insert
  with check (auth.role() = 'authenticated');

create policy "pembayaran_update_authenticated"
  on pembayaran for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "pembayaran_delete_authenticated"
  on pembayaran for delete
  using (auth.role() = 'authenticated');

-- Policy: pengaturan — hanya user login yang boleh SELECT/UPDATE
create policy "pengaturan_select_authenticated"
  on pengaturan for select
  using (auth.role() = 'authenticated');

create policy "pengaturan_update_authenticated"
  on pengaturan for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
