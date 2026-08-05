-- =========================================================
-- Migration: Lepas admin_profiles dari 1-akun-login = 1-orang
-- (kasus: 1 email dipakai lebih dari 1 orang secara bergantian)
-- =========================================================

-- -------------------------------
-- admin_profiles: jadi daftar nama independen, bukan 1:1 dengan auth.users
-- -------------------------------
alter table admin_profiles drop constraint if exists admin_profiles_id_fkey;
alter table admin_profiles alter column id set default gen_random_uuid();
alter table admin_profiles add constraint admin_profiles_nama_key unique (nama);

drop policy if exists "admin_profiles_insert_own" on admin_profiles;
drop policy if exists "admin_profiles_update_own" on admin_profiles;

create policy "admin_profiles_insert_authenticated"
  on admin_profiles for insert
  with check (auth.role() = 'authenticated');

create policy "admin_profiles_update_authenticated"
  on admin_profiles for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "admin_profiles_delete_authenticated"
  on admin_profiles for delete
  using (auth.role() = 'authenticated');

-- -------------------------------
-- pembayaran & kas_kelompok: created_by/updated_by/deleted_by sekarang
-- merujuk ke admin_profiles (nama yang dipilih manual), bukan lagi ke
-- auth.users (akun login). Nilai lama dikosongkan karena artinya sudah
-- tidak sama (dulu isinya id akun login, sekarang seharusnya id nama).
-- -------------------------------
alter table pembayaran drop constraint if exists pembayaran_created_by_fkey;
alter table pembayaran drop constraint if exists pembayaran_updated_by_fkey;
update pembayaran set created_by = null, updated_by = null;
alter table pembayaran
  add constraint pembayaran_created_by_fkey foreign key (created_by) references admin_profiles(id),
  add constraint pembayaran_updated_by_fkey foreign key (updated_by) references admin_profiles(id);

alter table kas_kelompok drop constraint if exists kas_kelompok_created_by_fkey;
alter table kas_kelompok drop constraint if exists kas_kelompok_updated_by_fkey;
alter table kas_kelompok drop constraint if exists kas_kelompok_deleted_by_fkey;
update kas_kelompok set created_by = null, updated_by = null, deleted_by = null;
alter table kas_kelompok
  add constraint kas_kelompok_created_by_fkey foreign key (created_by) references admin_profiles(id),
  add constraint kas_kelompok_updated_by_fkey foreign key (updated_by) references admin_profiles(id),
  add constraint kas_kelompok_deleted_by_fkey foreign key (deleted_by) references admin_profiles(id);
