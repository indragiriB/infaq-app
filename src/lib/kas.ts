import type { KasTransaksi } from './types';

/** Hitung saldo kas dari daftar transaksi (masuk - keluar). */
export function hitungSaldoKas(transaksi: KasTransaksi[]): number {
  return transaksi.reduce((saldo, item) => {
    return item.jenis === 'masuk' ? saldo + item.jumlah : saldo - item.jumlah;
  }, 0);
}
