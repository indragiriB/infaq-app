-- =========================================================
-- Migration: Kembalikan constraint "1x per periode" untuk kas otomatis
-- (revert dari migration 20260727030000 — balik ke behavior semula:
-- bagian Kelompok cuma bisa ditambahkan ke kas sekali per periode)
-- =========================================================

-- Langkah 1: kalau sempat ada lebih dari 1 baris "otomatis_infaq" untuk periode
-- yang sama (mis. karena fitur top-up dipakai sebelum constraint ini dibuat),
-- gabungkan dulu jadi satu baris (jumlahnya dijumlahkan, saldo kas tidak hilang)
-- supaya unique index di bawah bisa dibuat tanpa error duplikat.
with duplikat as (
  select periode_terkait, sum(jumlah) as total_jumlah, min(id) as id_pertama
  from kas_kelompok
  where sumber = 'otomatis_infaq'
  group by periode_terkait
  having count(*) > 1
)
update kas_kelompok k
set jumlah = d.total_jumlah,
    keterangan = 'Bagian kelompok infaq ' || d.periode_terkait || ' (digabung otomatis dari beberapa entri)'
from duplikat d
where k.id = d.id_pertama;

delete from kas_kelompok k
using (
  select periode_terkait, min(id) as id_pertama
  from kas_kelompok
  where sumber = 'otomatis_infaq'
  group by periode_terkait
  having count(*) > 1
) d
where k.sumber = 'otomatis_infaq'
  and k.periode_terkait = d.periode_terkait
  and k.id <> d.id_pertama;

-- Langkah 2: baru buat lagi unique index-nya
create unique index if not exists idx_kas_otomatis_unique
  on kas_kelompok (periode_terkait)
  where sumber = 'otomatis_infaq';
