export interface Pembayaran {
  id: string;
  nama_pembayar: string;
  jumlah_bayar: number;
  bulan: string; // format 'YYYY-MM'
  created_at: string;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
}

export interface Pengaturan {
  id: number;
  potongan_kelompok_per_bayar: number;
  potongan_desa_per_bayar: number;
  rasio_daerah: number;
  rasio_kelompok: number;
  sodaqoh_rutin_bulanan: number;
  nomor_wa_laporan: string;
  rasio_setor_barokah: number;
}

export type JenisKas = 'masuk' | 'keluar';
export type SumberKas = 'manual' | 'otomatis_infaq' | 'barang_barokah';

export interface KasTransaksi {
  id: string;
  jenis: JenisKas;
  jumlah: number;
  keterangan: string | null;
  sumber: SumberKas;
  periode_terkait: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  jumlah_asli: number | null; // total sebelum dipecah, khusus sumber = 'barang_barokah'
}

export interface AdminProfile {
  id: string;
  nama: string;
  created_at: string;
}

export interface Anggota {
  id: string;
  nama: string;
  created_at: string;
  created_by: string | null;
}

export interface OpsiInfaq {
  id: string;
  label: string;
  nominal: number;
  created_at: string;
  created_by: string | null;
}

export interface HasilPembagian {
  totalInfaq: number;
  jumlahPembayaran: number;
  // --- rincian langkah perhitungan (untuk ditampilkan transparan di UI) ---
  potonganKelompokPerBayar: number;
  potonganDesaPerBayar: number;
  potonganKelompok: number; // potonganKelompokPerBayar x jumlahPembayaran
  potonganDesa: number; // potonganDesaPerBayar x jumlahPembayaran
  totalPotongan: number; // potonganKelompok + potonganDesa
  sisa: number; // totalInfaq - totalPotongan
  rasioDaerah: number;
  rasioKelompok: number;
  bagianDaerahDariSisa: number; // sisa x rasioDaerah
  bagianKelompokDariSisa: number; // sisa x rasioKelompok
  sodaqohRutin: number;
  // --- hasil akhir per pos ---
  kelompokTotal: number; // potonganKelompok + bagianKelompokDariSisa - sodaqohRutin
  desaTotal: number; // = potonganDesa
  daerahTotal: number; // = bagianDaerahDariSisa
}

export interface HasilPembagianError {
  error: string;
}

export interface SetoranPeriode {
  id: string;
  periode: string; // 'YYYY-MM'
  tanggal_setor: string; // 'YYYY-MM-DD'
  jumlah: number;
  keterangan: string | null;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
}
