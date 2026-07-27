export interface LaporanWaInput {
  sumber: string; // nama bulan, mis. 'Juli'
  infaqAbc: number;
  infaq2000: number;
  iuranDesa: number;
  barangBarokah: number;
}

function formatBaris(nilai: number): string {
  return nilai > 0 ? new Intl.NumberFormat('id-ID').format(nilai) : '-';
}

/**
 * Bangun teks laporan dengan format rata kolom seperti contoh:
 *
 * Sumber : Juli
 * Infaq ABC      : 159.000
 * Infaq 2000     : 58.000
 * Iuran Desa     : 10.000
 * Barang Barokah : -
 * -------------------------------+
 * Jumlah : 227.000
 */
export function buatTeksLaporanWa(input: LaporanWaInput): string {
  const { sumber, infaqAbc, infaq2000, iuranDesa, barangBarokah } = input;
  const jumlah = infaqAbc + infaq2000 + iuranDesa + barangBarokah;

  const labelWidth = 'Barang Barokah'.length;
  const baris = (label: string, nilai: string) => `${label.padEnd(labelWidth)} : ${nilai}`;

  return [
    `Sumber : ${sumber}`,
    baris('Infaq ABC', formatBaris(infaqAbc)),
    baris('Infaq 2000', formatBaris(infaq2000)),
    baris('Iuran Desa', formatBaris(iuranDesa)),
    baris('Barang Barokah', formatBaris(barangBarokah)),
    '-------------------------------+',
    `Jumlah : ${new Intl.NumberFormat('id-ID').format(jumlah)}`,
  ].join('\n');
}

/** Bangun URL wa.me dengan nomor & teks yang sudah di-encode. */
export function buatUrlWa(nomor: string, teks: string): string {
  const nomorBersih = nomor.replace(/[^0-9]/g, '');
  return `https://wa.me/${nomorBersih}?text=${encodeURIComponent(teks)}`;
}
