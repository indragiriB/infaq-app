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

Rumus ada di `src/lib/hitungInfaq.ts`, dipecah eksplisit jadi 4 langkah (potongan flat per pembayaran → sisa → bagi 50:50 Daerah/Kelompok → Kelompok final dikurangi iuran rutin), konstanta diambil dari tabel `pengaturan` (bukan hardcode), jadi kalau nominal potongan/rasio berubah, cukup update lewat Supabase dashboard/SQL — tidak perlu ubah kode maupun deploy ulang. Di halaman Rekap ada tombol "Lihat rincian perhitungan" yang menampilkan semua langkah ini beserta angkanya secara transparan.

Kalau infaq masih sedikit sehingga Bagian Kelompok jadi minus (belum cukup menutup Iuran
Rutin Rp10.000), bagian Rincian Pembagian akan menampilkan pesan error alih-alih angka —
ini disengaja supaya tidak ada kas yang tercatat minus.

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

## 5. Master Data: Nama Pembayar & Pilihan Nominal

Migration ketiga (`supabase/migrations/20260727020000_anggota_dan_opsi_infaq.sql`) menambah
dua tabel master data — jalankan juga file ini di SQL Editor:

- **`anggota`** — daftar nama yang muncul di dropdown "Nama Pembayar" pada halaman Input.
- **`opsi_infaq`** — daftar nominal siap pilih di dropdown "Jumlah Bayar" (di-seed dengan
  Rp5.000–Rp50.000 secara default).

Di halaman Input, kedua dropdown ini punya tombol **"+ Tambah nama baru"** dan
**"+ Tambah pilihan nominal"** supaya admin bisa menambah anggota/nominal baru langsung dari
form tanpa harus buka Supabase dashboard. Kalau nominal yang dibutuhkan tidak ada di daftar,
pilih **"Lainnya (isi manual)"** untuk input bebas.

Karena nama sekarang dipilih dari daftar yang sama (bukan diketik bebas per transaksi), baris
di **Rekap Tahunan per Pembayar** otomatis konsisten — tidak ada lagi satu orang kepecah jadi
beberapa baris gara-gara variasi penulisan nama.

## 6. Kas Kelompok

Tabel `kas_kelompok` mencatat mutasi kas (masuk/keluar), ditambahkan lewat migration kedua:
`supabase/migrations/20260727010000_kas_kelompok_dan_wa.sql` — jalankan juga file ini di SQL Editor.

- **Manual**: catat kas masuk/keluar lewat form di halaman Rekap. Setiap baris sekarang bisa
  **diedit** atau **dihapus** langsung dari daftar riwayatnya.
- **Hapus = soft delete**: baris yang dihapus tidak benar-benar hilang dari database, cuma
  ditandai `deleted_at`/`deleted_by` dan disembunyikan dari tampilan. Ini supaya histori
  "siapa menghapus apa, kapan" tetap bisa ditelusuri kalau suatu saat perlu diaudit.
- **Otomatis (sekali per periode)**: tombol "+ Tambahkan bagian Kelompok ke Kas" di bagian
  Rincian Pembagian memunculkan popup konfirmasi dulu sebelum benar-benar memasukkan hasil
  akhir bagian Kelompok bulan itu ke kas. Dijaga di dua level: cek di frontend maupun unique
  constraint di database, jadi periode yang sama tidak bisa ditambahkan dua kali.
- Saldo kas = total semua transaksi (yang belum dihapus) masuk dikurangi keluar, dihitung
  real-time di frontend (lihat `src/lib/kas.ts`).

## 7. Nama Admin & Jejak Aktivitas (Audit Trail)

Migration `supabase/migrations/20260729000000_admin_profiles_dan_tracking.sql` menambah:

- **Tabel `admin_profiles`** — nama tampilan tiap akun admin. Begitu seseorang login pertama
  kali, muncul layar "Siapa nama kamu?" yang wajib diisi sekali sebelum bisa pakai aplikasi
  (`src/components/AdminNameGate.tsx`). Nama ini yang dipakai di semua catatan aktivitas.
- **Kolom `updated_by` / `updated_at`** di tabel `pembayaran` dan `kas_kelompok` — otomatis
  terisi tiap kali sebuah baris diedit.
- **Kolom `deleted_by` / `deleted_at`** di `kas_kelompok` — untuk soft-delete (lihat bagian
  Kas Kelompok di atas).

Di halaman **Input** dan **Rekap**, tiap baris pembayaran menampilkan "Diinput oleh [nama] ·
[tanggal & jam]" dan "Diubah oleh [nama] · [tanggal & jam]" kalau pernah diedit. Baris kas
kelompok juga sama, plus tombol Edit/Hapus di tiap barisnya.

## 8. Laporan WhatsApp

Di halaman Rekap ada bagian "Laporan WhatsApp" yang membangun teks laporan otomatis
(lihat `src/lib/waTemplate.ts`) dan membuka `wa.me` dengan pesan sudah terisi ke nomor
yang diset di kolom `pengaturan.nomor_wa_laporan` (default `6288216175883`, bisa diganti
lewat SQL/Supabase dashboard tanpa perlu ubah kode):

```sql
update pengaturan set nomor_wa_laporan = '62xxxxxxxxxxx' where id = 1;
```

Field **"Infaq ABC"** otomatis terisi dari **Bagian Daerah** (hasil bagi 50% dari sisa).
**"Infaq 2000"** otomatis terisi dari bagian Desa (potongan Rp2.000/pembayaran).
**"Iuran Desa"** otomatis terisi dari Sodaqoh Rutin (default Rp10.000, mengikuti `pengaturan.sodaqoh_rutin_bulanan`).
Hanya **"Barang Barokah"** yang diisi manual karena belum ada sumber datanya di skema.

Laporan ini merangkum apa yang **dilaporkan/dikirim keluar dari Kelompok** — Bagian Kelompok
yang ditahan sendiri (potongan awal + bagian sisa − iuran rutin) tidak ikut dijumlahkan di sini,
jadi wajar totalnya lebih kecil dari Total Infaq periode itu.

## 9. Rekap Tahunan per Pembayar

Tabel matrix 12 bulan (`src/components/RekapTahunan.tsx`) menampilkan setiap nama pembayar
sebagai baris dan Januari–Desember sebagai kolom, untuk tahun yang bisa digeser maju/mundur
(default: tahun berjalan, otomatis berganti setiap tahun baru). Setiap kolom bulan punya warna
sendiri secara bergilir, jadi dua pola pembayaran langsung kelihatan:

- **Bayar 12 bulan sekaligus di Januari** → satu baris penuh warna dari Jan sampai Des.
- **Bayar sporadis di tengah tahun** → warna cuma muncul di bulan-bulan yang benar-benar dibayar.

Data diambil murni dari kolom `bulan` di tabel `pembayaran` (bukan dari kapan data itu
diinput), jadi hasilnya akurat walau entri untuk bulan-bulan mendatang diinput lebih awal.

## 10. Dark Mode & Responsivitas

- Semua dropdown (`select`) di aplikasi ini pakai `react-select`, dibungkus lewat
  `src/components/AppSelect.tsx` supaya gayanya konsisten dengan sistem desain (pill rounded,
  warna maroon/cream, dark mode) — bukan tampilan `<select>` bawaan browser yang polos.
- Toggle dark mode (☀️/🌙) ada di header tiap halaman, tersimpan di `localStorage`
  dan otomatis mengikuti preferensi sistem saat pertama kali dibuka.
- Kartu ringkasan (Total Infaq, Saldo Kas, dll) dirombak jadi lebih lega dengan ukuran teks
  besar (`RingkasanCard` varian `lg`) supaya nominal Rupiah tidak pernah terpotong/wrap aneh.
  Kartu "Saldo Kas Kelompok" dan "Jumlah Pembayaran" ikut stack vertikal di layar sempit,
  baru sejajar di layar lebih lebar.
- Daftar pembayaran diganti dari tabel sempit jadi list card dengan avatar inisial,
  lebih nyaman dibaca di layar HP.
- **Pagination** — daftar Pembayaran (halaman Input & Rekap) dan riwayat Kas Kelompok
  sekarang dipecah per halaman (`src/components/PaginationControls.tsx`), jadi halaman tidak
  makin memanjang ke bawah walau datanya sudah ratusan baris.
- Tabel Rekap Tahunan bisa di-scroll horizontal di layar kecil, dengan kolom nama yang
  sticky supaya tetap kebaca saat scroll ke bulan-bulan berikutnya.

## 11. Deploy ke GitHub Pages (manual, satu perintah)

Repo ini pakai package [`gh-pages`](https://www.npmjs.com/package/gh-pages) supaya deploy
cukup dengan satu perintah dari komputer kamu sendiri — tidak ada workflow otomatis, kamu
yang kontrol kapan build baru dikirim ke GitHub Pages.

**Setup sekali di awal:**

1. Buka `package.json`, cari baris berikut di bagian `"scripts"`:

   ```json
   "predeploy": "cross-env VITE_BASE_PATH=/GANTI-NAMA-REPO-DISINI/ npm run build",
   ```

   Ganti `GANTI-NAMA-REPO-DISINI` dengan **nama repo GitHub kamu persis** (yang muncul di
   URL repo, mis. kalau repo-nya `github.com/username/infaq-app` maka isi jadi `/infaq-app/`).
   Base path ini wajib benar supaya CSS/JS-nya kebaca di GitHub Pages.

   Kalau repo kamu adalah repo khusus `username.github.io` (user/organization page, bukan
   project page), ganti jadi `base: '/'` saja — hapus bagian `VITE_BASE_PATH=...` dari
   script tersebut.

2. Pastikan repo sudah ada di GitHub dan sudah di-`git push` minimal sekali (`git remote`
   sudah mengarah ke repo yang benar).

3. Buka **Settings → Pages** di repo, pada **Build and deployment → Source**, pilih
   **"Deploy from a branch"**, lalu pilih branch **`gh-pages`** dan folder **`/(root)`**.
   (Branch `gh-pages` ini akan otomatis dibuat oleh perintah deploy di langkah berikutnya,
   jadi kalau belum ada saat ini, wajar — deploy dulu baru muncul di pilihan branch.)

**Tiap kali mau update ke GitHub Pages:**

```bash
npm run deploy
```

Perintah ini otomatis: build ulang aplikasi (`predeploy`) lalu push isi folder `dist/` ke
branch `gh-pages` (`deploy`). Tunggu 1-2 menit, situsnya langsung ke-update di
`https://username.github.io/nama-repo/`.

**Kenapa sebelumnya isi Input beda antara lokal dan GitHub Pages:** karena GitHub Pages
menyajikan hasil build (`dist/`) yang sudah pernah di-upload, bukan source code secara
langsung. Kalau build itu tidak pernah diperbarui setelah ada perubahan kode (lupa jalankan
`npm run deploy` lagi), GitHub Pages akan terus menampilkan versi lama walau kode di repo
sudah ter-update. Jadi kuncinya: **setiap kali ada perubahan kode dan mau dipublikasikan,
jalankan `npm run deploy` lagi.**

Routing juga sudah dipindah dari `BrowserRouter` ke `HashRouter` (URL jadi mis.
`.../#/rekap`) supaya refresh langsung di halaman `/input` atau `/rekap` tidak berujung
404 — GitHub Pages adalah static hosting murni dan tidak tahu cara mengarahkan semua rute
balik ke `index.html` tanpa `HashRouter` atau konfigurasi tambahan.

## 12. Build Manual Biasa (tanpa deploy)

Kalau cuma mau lihat hasil build lokal tanpa upload ke GitHub Pages:

```bash
npm run build
npm run preview
```
