-- =========================================================
-- Migration: Master Data Anggota & Opsi Nominal Infaq
-- =========================================================

-- -------------------------------
-- Tabel: anggota (daftar nama pembayar untuk dropdown)
-- -------------------------------
create table if not exists anggota (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

alter table anggota enable row level security;

create policy "anggota_select_authenticated"
  on anggota for select
  using (auth.role() = 'authenticated');

create policy "anggota_insert_authenticated"
  on anggota for insert
  with check (auth.role() = 'authenticated');

create policy "anggota_delete_authenticated"
  on anggota for delete
  using (auth.role() = 'authenticated');

-- -------------------------------
-- Tabel: opsi_infaq (pilihan nominal siap pakai di dropdown)
-- -------------------------------
create table if not exists opsi_infaq (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  nominal numeric not null check (nominal >= 0),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

alter table opsi_infaq enable row level security;

create policy "opsi_infaq_select_authenticated"
  on opsi_infaq for select
  using (auth.role() = 'authenticated');

create policy "opsi_infaq_insert_authenticated"
  on opsi_infaq for insert
  with check (auth.role() = 'authenticated');

create policy "opsi_infaq_delete_authenticated"
  on opsi_infaq for delete
  using (auth.role() = 'authenticated');

-- Seed beberapa nominal umum supaya dropdown tidak kosong di awal
insert into opsi_infaq (label, nominal)
select * from (values
  ('Rp5.000', 5000),
  ('Rp10.000', 10000),
  ('Rp15.000', 15000),
  ('Rp20.000', 20000),
  ('Rp25.000', 25000),
  ('Rp50.000', 50000)
) as seed(label, nominal)
where not exists (select 1 from opsi_infaq);
