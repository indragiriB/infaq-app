# Rekap Infaq

Aplikasi pencatatan & rekap infaq bulanan komunitas. React (Vite + TypeScript) + Supabase.

## 1. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, jalankan isi file `supabase/migrations/20260727000000_init_infaq_schema.sql`.
   (Atau kalau pakai Supabase CLI: `supabase db push`.)
3. Buat akun pengurus secara manual lewat **Authentication → Users → Add user** (tidak ada halaman registrasi publik).
4. Ambil `Project URL` dan `anon public key` dari **Project Settings → API**.

## 2. Setup Project

```bash
npm install
cp .env.example .env
```

Isi `.env`:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=isi-anon-key-kamu
```

Jalankan dev server:

```bash
npm run dev
```

## 3. Struktur Folder

```
src/
  lib/
    supabaseClient.ts   -> koneksi ke Supabase
    hitungInfaq.ts       -> logic pembagian infaq
    bulan.ts             -> helper format periode 'YYYY-MM'
    types.ts             -> type definitions
    AuthContext.tsx       -> context session login
  pages/
    Login.tsx
    InputPembayaran.tsx
    Rekap.tsx
  components/
    ProtectedRoute.tsx
    RingkasanCard.tsx
    TabelPembayaran.tsx
supabase/
  migrations/            -> SQL schema + RLS policy
```

## 4. Catatan Logic Pembagian

Rumus ada di `src/lib/hitungInfaq.ts`, konstanta diambil dari tabel `pengaturan` (bukan hardcode), jadi kalau nominal potongan/rasio berubah, cukup update lewat Supabase dashboard/SQL — tidak perlu ubah kode maupun deploy ulang.

Ubah nilai default lewat SQL:

```sql
update pengaturan set
  potongan_kelompok_per_bayar = 1000,
  potongan_desa_per_bayar = 2000,
  rasio_daerah = 0.5,
  rasio_kelompok = 0.5,
  sodaqoh_rutin_bulanan = 10000
where id = 1;
```

## 5. Kas Kelompok

Tabel `kas_kelompok` mencatat mutasi kas (masuk/keluar), ditambahkan lewat migration kedua:
`supabase/migrations/20260727010000_kas_kelompok_dan_wa.sql` — jalankan juga file ini di SQL Editor.

- **Manual**: catat kas masuk/keluar lewat form di halaman Rekap.
- **Otomatis**: tombol "+ Tambahkan ... ke Kas Kelompok" di bagian Rincian Pembagian akan
  memasukkan hasil akhir bagian Kelompok bulan itu ke kas. Ada unique constraint di database
  supaya bagian kelompok periode yang sama tidak bisa ditambahkan dua kali.
- Saldo kas = total semua transaksi masuk dikurangi keluar (dihitung real-time di frontend,
  lihat `src/lib/kas.ts`).

## 6. Laporan WhatsApp

Di halaman Rekap ada bagian "Laporan WhatsApp" yang membangun teks laporan otomatis
(lihat `src/lib/waTemplate.ts`) dan membuka `wa.me` dengan pesan sudah terisi ke nomor
yang diset di kolom `pengaturan.nomor_wa_laporan` (default `6288216175883`, bisa diganti
lewat SQL/Supabase dashboard tanpa perlu ubah kode):

```sql
update pengaturan set nomor_wa_laporan = '62xxxxxxxxxxx' where id = 1;
```

Field **"Infaq ABC"** otomatis terisi dari total infaq periode yang dipilih.
**"Infaq 2000"** otomatis terisi dari bagian Desa hasil perhitungan (potongan Rp2.000/pembayaran).
**"Iuran Desa"** otomatis terisi dari Sodaqoh Rutin (default Rp10.000, mengikuti `pengaturan.sodaqoh_rutin_bulanan`).
Hanya **"Barang Barokah"** yang diisi manual karena belum ada sumber datanya di skema.

## 7. Rekap Tahunan per Pembayar

Tabel matrix 12 bulan (`src/components/RekapTahunan.tsx`) menampilkan setiap nama pembayar
sebagai baris dan Januari–Desember sebagai kolom, untuk tahun yang bisa digeser maju/mundur
(default: tahun berjalan, otomatis berganti setiap tahun baru). Setiap kolom bulan punya warna
sendiri secara bergilir, jadi dua pola pembayaran langsung kelihatan:

- **Bayar 12 bulan sekaligus di Januari** → satu baris penuh warna dari Jan sampai Des.
- **Bayar sporadis di tengah tahun** → warna cuma muncul di bulan-bulan yang benar-benar dibayar.

Data diambil murni dari kolom `bulan` di tabel `pembayaran` (bukan dari kapan data itu
diinput), jadi hasilnya akurat walau entri untuk bulan-bulan mendatang diinput lebih awal.

## 8. Dark Mode & Responsivitas

- Toggle dark mode (☀️/🌙) ada di header tiap halaman, tersimpan di `localStorage`
  dan otomatis mengikuti preferensi sistem saat pertama kali dibuka.
- Kartu ringkasan (Total Infaq, Saldo Kas, dll) dirombak jadi lebih lega dengan ukuran teks
  besar (`RingkasanCard` varian `lg`) supaya nominal Rupiah tidak pernah terpotong/wrap aneh.
- Daftar pembayaran diganti dari tabel sempit jadi list card dengan avatar inisial,
  lebih nyaman dibaca di layar HP.
- Tabel Rekap Tahunan bisa di-scroll horizontal di layar kecil, dengan kolom nama yang
  sticky supaya tetap kebaca saat scroll ke bulan-bulan berikutnya.

## 9. Build untuk Production

```bash
npm run build
npm run preview
```
