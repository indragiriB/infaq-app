const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export const NAMA_BULAN_SINGKAT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

/** Format 'YYYY-MM' dari objek Date. */
export function toPeriode(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/** Periode bulan berjalan, mis. '2026-07'. */
export function periodeSekarang(): string {
  return toPeriode(new Date());
}

/** Label ramah-baca dari 'YYYY-MM', mis. '2026-07' -> 'Juli 2026'. */
export function labelPeriode(periode: string): string {
  const [year, month] = periode.split('-').map(Number);
  const namaBulan = NAMA_BULAN[month - 1] ?? periode;
  return `${namaBulan} ${year}`;
}

/** Nama bulan saja tanpa tahun, mis. '2026-07' -> 'Juli'. */
export function namaBulanSaja(periode: string): string {
  const [, month] = periode.split('-').map(Number);
  return NAMA_BULAN[month - 1] ?? periode;
}

/**
 * Generate daftar periode untuk dropdown, dari bulan berjalan mundur
 * sejumlah `jumlahBulan` (default 12 bulan terakhir).
 */
export function opsiPeriode(jumlahBulan = 12): { value: string; label: string }[] {
  const hasil: { value: string; label: string }[] = [];
  const now = new Date();

  for (let i = 0; i < jumlahBulan; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = toPeriode(d);
    hasil.push({ value, label: labelPeriode(value) });
  }

  return hasil;
}
