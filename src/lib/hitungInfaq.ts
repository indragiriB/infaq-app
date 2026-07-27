import type { Pengaturan, HasilPembagian, HasilPembagianError } from './types';

/**
 * Menghitung pembagian infaq bulanan ke pos Kelompok, Desa, Daerah,
 * dan Sodaqoh Rutin, berdasarkan konstanta dari tabel `pengaturan`.
 *
 * Alur perhitungan:
 * 1. Setiap transaksi kena potongan flat: masuk pos Kelompok & pos Desa.
 * 2. Sisa (total infaq - total potongan) dibagi antara Daerah & Kelompok
 *    sesuai rasio yang diset.
 * 3. Total bagian Kelompok (potongan awal + bagian sisa) dikurangi lagi
 *    flat untuk pos Sodaqoh Rutin bulanan.
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

  const potonganKelompok = potongan_kelompok_per_bayar * jumlahPembayaran;
  const potonganDesa = potongan_desa_per_bayar * jumlahPembayaran;
  const totalPotongan = potonganKelompok + potonganDesa;

  const sisa = totalInfaq - totalPotongan;
  if (sisa < 0) {
    return { error: 'Total infaq tidak cukup untuk menutupi potongan per pembayaran' };
  }

  const bagianDaerah = sisa * rasio_daerah;
  const bagianKelompok = sisa * rasio_kelompok;

  const kelompokFinal = potonganKelompok + bagianKelompok - sodaqoh_rutin_bulanan;
  if (kelompokFinal < 0) {
    return { error: 'Bagian kelompok tidak cukup untuk sodaqoh rutin bulanan' };
  }

  return {
    totalInfaq,
    jumlahPembayaran,
    kelompokTotal: kelompokFinal,
    desaTotal: potonganDesa,
    daerahTotal: bagianDaerah,
    sodaqohRutin: sodaqoh_rutin_bulanan,
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
