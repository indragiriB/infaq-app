import type { Pengaturan, HasilPembagian, HasilPembagianError } from './types';

/**
 * Menghitung pembagian infaq bulanan ke pos Kelompok, Desa, Daerah,
 * dan Sodaqoh Rutin, berdasarkan konstanta dari tabel `pengaturan`.
 *
 * Langkah perhitungan (persis, dieksplisitkan supaya mudah diaudit):
 * 1. Setiap pembayaran kena potongan flat: Rp1.000 -> pos Kelompok,
 *    Rp2.000 -> pos Desa (dikalikan jumlah pembayaran bulan itu).
 * 2. Sisa = Total Infaq - (Potongan Kelompok + Potongan Desa).
 * 3. Sisa dibagi 2: 50% untuk Daerah, 50% untuk Kelompok.
 * 4. Bagian Kelompok final = Potongan Kelompok (langkah 1) + bagian
 *    50% dari sisa (langkah 3) - Rp10.000 flat untuk Sodaqoh Rutin bulanan.
 *
 * Invariant: totalInfaq === kelompokTotal + desaTotal + daerahTotal + sodaqohRutin
 */
export function hitungPembagianInfaq(
  totalInfaq: number,
  jumlahPembayaran: number,
  pengaturan: Pengaturan
): HasilPembagian | HasilPembagianError {
  const {
    potongan_kelompok_per_bayar,
    potongan_desa_per_bayar,
    rasio_daerah,
    rasio_kelompok,
    sodaqoh_rutin_bulanan,
  } = pengaturan;

  // Langkah 1: potongan flat per pembayaran
  const potonganKelompok = potongan_kelompok_per_bayar * jumlahPembayaran;
  const potonganDesa = potongan_desa_per_bayar * jumlahPembayaran;
  const totalPotongan = potonganKelompok + potonganDesa;

  // Langkah 2: sisa setelah potongan
  const sisa = totalInfaq - totalPotongan;
  if (sisa < 0) {
    return { error: 'Total infaq tidak cukup untuk menutupi potongan per pembayaran' };
  }

  // Langkah 3: bagi sisa antara Daerah & Kelompok sesuai rasio
  const bagianDaerahDariSisa = sisa * rasio_daerah;
  const bagianKelompokDariSisa = sisa * rasio_kelompok;

  // Langkah 4: bagian Kelompok = potongan awal + bagian sisa - sodaqoh rutin
  const kelompokTotal = potonganKelompok + bagianKelompokDariSisa - sodaqoh_rutin_bulanan;
  if (kelompokTotal < 0) {
    return { error: 'Bagian kelompok tidak cukup untuk sodaqoh rutin bulanan' };
  }

  return {
    totalInfaq,
    jumlahPembayaran,
    potonganKelompokPerBayar: potongan_kelompok_per_bayar,
    potonganDesaPerBayar: potongan_desa_per_bayar,
    potonganKelompok,
    potonganDesa,
    totalPotongan,
    sisa,
    rasioDaerah: rasio_daerah,
    rasioKelompok: rasio_kelompok,
    bagianDaerahDariSisa,
    bagianKelompokDariSisa,
    sodaqohRutin: sodaqoh_rutin_bulanan,
    kelompokTotal,
    desaTotal: potonganDesa,
    daerahTotal: bagianDaerahDariSisa,
  };
}

/**
 * Type guard untuk membedakan hasil sukses vs error.
 */
export function isHasilPembagianError(
  hasil: HasilPembagian | HasilPembagianError
): hasil is HasilPembagianError {
  return 'error' in hasil;
}

/**
 * Format angka ke Rupiah, mis. 15000 -> "Rp15.000".
 */
export function formatRupiah(angka: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(angka);
}

/** Format angka polos (tanpa "Rp"), mis. 15000 -> "15.000". Untuk teks rincian. */
export function formatAngka(angka: number): string {
  return new Intl.NumberFormat('id-ID').format(angka);
}
