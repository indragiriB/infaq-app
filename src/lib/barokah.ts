export interface HasilBarokah {
  total: number;
  jumlahKas: number; // masuk ke Kas Kelompok
  jumlahLaporan: number; // dilaporkan lewat Laporan WA
}

/**
 * Pecah total Barang Barokah jadi 2 bagian:
 * - jumlahLaporan = total x rasioSetor (default 25%), dilaporkan/disetorkan via WA
 * - jumlahKas = sisanya (total - jumlahLaporan), masuk ke Kas Kelompok
 *
 * jumlahLaporan dibulatkan dulu, jumlahKas = total - jumlahLaporan, supaya
 * dua-duanya selalu pas balik ke total (tidak ada selisih pembulatan).
 */
export function hitungBarokah(total: number, rasioSetor: number): HasilBarokah {
  const jumlahLaporan = Math.round(total * rasioSetor);
  const jumlahKas = total - jumlahLaporan;
  return { total, jumlahKas, jumlahLaporan };
}
