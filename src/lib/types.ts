export interface Pembayaran {
  id: string;
  nama_pembayar: string;
  jumlah_bayar: number;
  bulan: string; // format 'YYYY-MM'
  created_at: string;
  created_by: string | null;
}

export interface Pengaturan {
  id: number;
  potongan_kelompok_per_bayar: number;
  potongan_desa_per_bayar: number;
  rasio_daerah: number;
  rasio_kelompok: number;
  sodaqoh_rutin_bulanan: number;
  nomor_wa_laporan: string;
}

export type JenisKas = 'masuk' | 'keluar';
export type SumberKas = 'manual' | 'otomatis_infaq';

export interface KasTransaksi {
  id: string;
  jenis: JenisKas;
  jumlah: number;
  keterangan: string | null;
  sumber: SumberKas;
  periode_terkait: string | null;
  created_at: string;
  created_by: string | null;
}

export interface HasilPembagian {
  totalInfaq: number;
  jumlahPembayaran: number;
  kelompokTotal: number;
  desaTotal: number;
  daerahTotal: number;
  sodaqohRutin: number;
}

export interface HasilPembagianError {
  error: string;
}
