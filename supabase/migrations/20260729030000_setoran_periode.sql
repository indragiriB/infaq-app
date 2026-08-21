-- =========================================================
-- Migration: Status Setoran per Periode
-- Penanda "sudah disetor" buat total yang dilaporkan lewat WA
-- (Infaq ABC + Infaq 2000 + Iuran Desa + Barang Barokah).
-- Sengaja TERPISAH dari kas_kelompok karena uang ini bukan milik
-- kelompok (cuma lewat, dikirim ke Daerah/Desa) — jadi tidak boleh
-- ikut mempengaruhi saldo Kas Kelompok.
-- =========================================================

create table if not exists setoran_periode (
  id uuid primary key default gen_random_uuid(),
  periode text not null unique, -- 'YYYY-MM', satu status per periode
  tanggal_setor date not null,
  jumlah numeric not null,
  keterangan text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  updated_at timestamptz
);

alter table setoran_periode enable row level security;

create policy "setoran_periode_select_authenticated"
  on setoran_periode for select
  using (auth.role() = 'authenticated');

create policy "setoran_periode_insert_authenticated"
  on setoran_periode for insert
  with check (auth.role() = 'authenticated');

create policy "setoran_periode_update_authenticated"
  on setoran_periode for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "setoran_periode_delete_authenticated"
  on setoran_periode for delete
  using (auth.role() = 'authenticated');
