-- =========================================================
-- Migration: Setoran Berbasis "Belum Disetor" (bukan per bulan kalender)
--
-- Masalah yang difix: sebelumnya Rincian Pembagian/Laporan WA/Kas
-- otomatis dihitung ketat per satu `bulan`. Akibatnya kalau ada yang
-- bayar telat setelah periode itu sudah disetor, pembayaran itu malah
-- ketarik masuk hitungan bulan berikutnya alih-alih "menyusul" nutup
-- kekurangan bulan yang sudah disetor.
--
-- Fix: pembayaran & kas_kelompok (khusus barang_barokah) sekarang
-- punya penanda "sudah disetor/dilaporkan apa belum" yang lepas dari
-- kolom `bulan`/`periode_terkait`. Rincian Pembagian & Laporan WA
-- dihitung dari SEMUA yang belum disetor, mau itu numpuk dari
-- beberapa bulan sekalipun.
-- =========================================================

alter table pembayaran
  add column if not exists sudah_disetor boolean not null default false,
  add column if not exists setoran_id uuid references setoran_periode(id);

create index if not exists idx_pembayaran_belum_disetor
  on pembayaran (sudah_disetor)
  where sudah_disetor = false;

alter table kas_kelompok
  add column if not exists dilaporkan boolean not null default false,
  add column if not exists setoran_id uuid references setoran_periode(id);

-- setoran_periode sekarang mewakili SATU KALI aksi setor yang bisa
-- mencakup rentang beberapa bulan, bukan lagi 1 baris per 1 bulan.
alter table setoran_periode drop constraint if exists setoran_periode_periode_key;
alter table setoran_periode
  add column if not exists periode_awal text,
  add column if not exists periode_akhir text;

update setoran_periode
set periode_awal = coalesce(periode_awal, periode),
    periode_akhir = coalesce(periode_akhir, periode)
where periode_awal is null;

alter table setoran_periode alter column periode drop not null;

-- -------------------------------
-- Backfill: kalau sebelumnya sudah ada setoran_periode dari sistem LAMA
-- (1 baris = 1 bulan, ditandai dengan periode_awal = periode_akhir hasil
-- migrasi di atas), tandai pembayaran & Barang Barokah bulan itu sebagai
-- SUDAH disetor juga. Tanpa ini, data yang sudah pernah dilaporkan lewat
-- sistem lama bakal ketarik lagi jadi "belum disetor" di sistem baru dan
-- kehitung dobel.
-- -------------------------------
update pembayaran p
set sudah_disetor = true,
    setoran_id = sp.id
from setoran_periode sp
where p.bulan = sp.periode_awal
  and sp.periode_awal = sp.periode_akhir
  and p.sudah_disetor = false;

update kas_kelompok k
set dilaporkan = true,
    setoran_id = sp.id
from setoran_periode sp
where k.sumber = 'barang_barokah'
  and k.periode_terkait = sp.periode_awal
  and sp.periode_awal = sp.periode_akhir
  and k.dilaporkan = false;

