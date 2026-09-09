import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { supabase } from '../lib/supabaseClient';
import type { Anggota, KasTransaksi, Pembayaran, Pengaturan, SetoranPeriode } from '../lib/types';
import { hitungPembagianInfaq, isHasilPembagianError, formatRupiah, formatAngka } from '../lib/hitungInfaq';
import { periodeSekarang, labelPeriode, namaBulanSaja, opsiPeriode, NAMA_BULAN_SINGKAT, labelRentangPeriode } from '../lib/bulan';
import { hitungSaldoKas } from '../lib/kas';
import { hitungBarokah } from '../lib/barokah';
import { buatTeksLaporanWa, buatUrlWa } from '../lib/waTemplate';
import AppHeader from '../components/AppHeader';
import AppSelect from '../components/AppSelect';
import RingkasanCard from '../components/RingkasanCard';
import TabelPembayaran from '../components/TabelPembayaran';
import RekapTahunan, { type BarisRekapTahunan } from '../components/RekapTahunan';
import PaginationControls from '../components/PaginationControls';
import { useAdminMap } from '../lib/useAdminMap';
import { namaAdmin, formatWaktu } from '../lib/adminProfiles';
import { useAuth } from '../lib/AuthContext';

export default function Rekap() {
  const { session } = useAuth();
  const adminMap = useAdminMap();
  const [bulan, setBulan] = useState(periodeSekarang());
  const [data, setData] = useState<Pembayaran[]>([]);
  const [pengaturan, setPengaturan] = useState<Pengaturan | null>(null);
  const [trenBulanan, setTrenBulanan] = useState<{ bulan: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- Kas Kelompok ---
  const [kasTransaksi, setKasTransaksi] = useState<KasTransaksi[]>([]);
  const [kasLoading, setKasLoading] = useState(true);
  const [kasJenis, setKasJenis] = useState<'masuk' | 'keluar'>('masuk');
  const [kasJumlah, setKasJumlah] = useState('');
  const [kasKeterangan, setKasKeterangan] = useState('');
  const [kasSaving, setKasSaving] = useState(false);
  const [kasError, setKasError] = useState<string | null>(null);
  const [showDetailHitung, setShowDetailHitung] = useState(false);
  const [editingKasId, setEditingKasId] = useState<string | null>(null);
  const [kasPage, setKasPage] = useState(1);
  const KAS_PAGE_SIZE = 6;

  // --- Barang Barokah (total dipecah otomatis: sebagian kas, sebagian laporan) ---
  const [showFormBarokah, setShowFormBarokah] = useState(false);
  const [barokahTotal, setBarokahTotal] = useState('');
  const [barokahKeterangan, setBarokahKeterangan] = useState('');
  const [editingBarokahId, setEditingBarokahId] = useState<string | null>(null);
  const [barokahSaving, setBarokahSaving] = useState(false);

  // --- Setoran: berbasis "semua yang BELUM disetor", lepas dari batas
  // bulan kalender — biar pembayaran telat dari bulan mana pun otomatis
  // ikut nyusul di setoran berikutnya, bukan malah nyangkut ke bulan lain. ---
  const [belumSetor, setBelumSetor] = useState<{
    totalInfaq: number;
    jumlahPembayaran: number;
    periodeAwal: string | null;
    periodeAkhir: string | null;
  }>({ totalInfaq: 0, jumlahPembayaran: 0, periodeAwal: null, periodeAkhir: null });
  const [belumSetorLoading, setBelumSetorLoading] = useState(true);
  const [riwayatSetoran, setRiwayatSetoran] = useState<SetoranPeriode[]>([]);
  const [showFormSetoran, setShowFormSetoran] = useState(false);
  const [tanggalSetorInput, setTanggalSetorInput] = useState('');
  const [setoranSaving, setSetoranSaving] = useState(false);
  const [setoranError, setSetoranError] = useState<string | null>(null);

  // --- Rekap Tahunan ---
  const [tahunRekap, setTahunRekap] = useState(new Date().getFullYear());
  const [rekapTahunanData, setRekapTahunanData] = useState<BarisRekapTahunan[]>([]);
  const [totalPerBulanTahunan, setTotalPerBulanTahunan] = useState<Record<number, number>>({});
  const [rekapTahunanLoading, setRekapTahunanLoading] = useState(true);

  // --- Partisipasi (persentase anggota yang sudah bayar periode ini) ---
  const [daftarAnggota, setDaftarAnggota] = useState<Anggota[]>([]);
  const [showBelumBayar, setShowBelumBayar] = useState(false);

  async function fetchPengaturan() {
    const { data: row, error } = await supabase
      .from('pengaturan')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      setErrorMsg('Gagal memuat pengaturan pembagian infaq.');
      return;
    }
    setPengaturan(row as Pengaturan);
  }

  async function fetchPembayaran(periode: string) {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from('pembayaran')
      .select('*')
      .eq('bulan', periode)
      .order('nama_pembayar', { ascending: true });

    if (error) {
      setErrorMsg('Gagal memuat data pembayaran.');
    } else {
      setData(rows as Pembayaran[]);
    }
    setLoading(false);
  }

  async function fetchBelumDisetor() {
    setBelumSetorLoading(true);
    const { data: rows, error } = await supabase
      .from('pembayaran')
      .select('jumlah_bayar, bulan')
      .eq('sudah_disetor', false);

    if (!error && rows) {
      const totalInfaq = rows.reduce((sum, r) => sum + r.jumlah_bayar, 0);
      const bulanList = rows.map((r) => r.bulan).sort();
      setBelumSetor({
        totalInfaq,
        jumlahPembayaran: rows.length,
        periodeAwal: bulanList[0] ?? null,
        periodeAkhir: bulanList[bulanList.length - 1] ?? null,
      });
    }
    setBelumSetorLoading(false);
  }

  async function fetchRiwayatSetoran() {
    const { data: rows } = await supabase
      .from('setoran_periode')
      .select('*')
      .order('tanggal_setor', { ascending: false })
      .limit(20);

    if (rows) setRiwayatSetoran(rows as SetoranPeriode[]);
  }

  async function fetchTren() {
    const periodeList = opsiPeriode(6).map((o) => o.value).reverse();
    const { data: rows, error } = await supabase
      .from('pembayaran')
      .select('bulan, jumlah_bayar')
      .in('bulan', periodeList);

    if (error) return;

    const totals = new Map<string, number>(periodeList.map((p) => [p, 0]));
    for (const row of rows as { bulan: string; jumlah_bayar: number }[]) {
      totals.set(row.bulan, (totals.get(row.bulan) ?? 0) + row.jumlah_bayar);
    }

    setTrenBulanan(
      periodeList.map((p) => ({ bulan: labelPeriode(p), total: totals.get(p) ?? 0 }))
    );
  }

  async function fetchKas() {
    setKasLoading(true);
    const { data: rows, error } = await supabase
      .from('kas_kelompok')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      setKasError('Gagal memuat data kas kelompok.');
    } else {
      setKasTransaksi(rows as KasTransaksi[]);
    }
    setKasLoading(false);
  }

  async function fetchRekapTahunan(tahun: number) {
    setRekapTahunanLoading(true);
    const prefix = `${tahun}-`;
    const { data: rows, error } = await supabase
      .from('pembayaran')
      .select('nama_pembayar, bulan, jumlah_bayar')
      .gte('bulan', `${prefix}01`)
      .lte('bulan', `${prefix}12`);

    if (error) {
      setRekapTahunanLoading(false);
      return;
    }

    const perNama = new Map<string, { bulanTerisi: Record<number, number>; total: number }>();
    const perBulan: Record<number, number> = {};

    for (const row of rows as { nama_pembayar: string; bulan: string; jumlah_bayar: number }[]) {
      const bulanKe = Number(row.bulan.split('-')[1]);
      const key = row.nama_pembayar.trim();

      if (!perNama.has(key)) perNama.set(key, { bulanTerisi: {}, total: 0 });
      const entry = perNama.get(key)!;
      entry.bulanTerisi[bulanKe] = (entry.bulanTerisi[bulanKe] ?? 0) + row.jumlah_bayar;
      entry.total += row.jumlah_bayar;

      perBulan[bulanKe] = (perBulan[bulanKe] ?? 0) + row.jumlah_bayar;
    }

    const hasil: BarisRekapTahunan[] = Array.from(perNama.entries())
      .map(([nama, v]) => ({ nama, bulanTerisi: v.bulanTerisi, total: v.total }))
      .sort((a, b) => a.nama.localeCompare(b.nama));

    setRekapTahunanData(hasil);
    setTotalPerBulanTahunan(perBulan);
    setRekapTahunanLoading(false);
  }

  async function fetchAnggota() {
    const { data: rows } = await supabase.from('anggota').select('*').order('nama');
    if (rows) setDaftarAnggota(rows as Anggota[]);
  }

  useEffect(() => {
    fetchPengaturan();
    fetchTren();
    fetchKas();
    fetchAnggota();
    fetchBelumDisetor();
    fetchRiwayatSetoran();
  }, []);

  useEffect(() => {
    fetchPembayaran(bulan);
  }, [bulan]);

  useEffect(() => {
    fetchRekapTahunan(tahunRekap);
  }, [tahunRekap]);

  const totalInfaq = useMemo(
    () => data.reduce((sum, item) => sum + item.jumlah_bayar, 0),
    [data]
  );
  const jumlahPembayaran = data.length;

  const namaSudahBayar = useMemo(
    () => new Set(data.map((d) => d.nama_pembayar.trim())),
    [data]
  );
  const totalAnggota = daftarAnggota.length;
  const jumlahSudahBayar = useMemo(
    () => daftarAnggota.filter((a) => namaSudahBayar.has(a.nama.trim())).length,
    [daftarAnggota, namaSudahBayar]
  );
  const persentasePartisipasi = totalAnggota > 0 ? Math.round((jumlahSudahBayar / totalAnggota) * 100) : 0;
  const daftarBelumBayar = useMemo(
    () => daftarAnggota.filter((a) => !namaSudahBayar.has(a.nama.trim())),
    [daftarAnggota, namaSudahBayar]
  );

  // Partisipasi tiap bulan dalam satu tahun (pakai data yang sama dengan
  // Rekap Tahunan, jadi tidak perlu fetch ulang ke Supabase).
  const partisipasiPerBulan = useMemo(() => {
    if (totalAnggota === 0) return [];
    return Array.from({ length: 12 }, (_, i) => {
      const bulanKe = i + 1;
      const namaBayarBulanIni = new Set(
        rekapTahunanData
          .filter((r) => r.bulanTerisi[bulanKe] !== undefined)
          .map((r) => r.nama.trim())
      );
      const jumlahBayar = daftarAnggota.filter((a) => namaBayarBulanIni.has(a.nama.trim())).length;
      const persen = Math.round((jumlahBayar / totalAnggota) * 100);
      return { bulanKe, persen, jumlahBayar };
    });
  }, [rekapTahunanData, daftarAnggota, totalAnggota]);

  const hasilPembagian = useMemo(() => {
    if (!pengaturan || belumSetor.jumlahPembayaran === 0) return null;
    return hitungPembagianInfaq(belumSetor.totalInfaq, belumSetor.jumlahPembayaran, pengaturan);
  }, [pengaturan, belumSetor]);

  // Infaq ABC = Bagian Daerah (hasil bagi 50% dari sisa). Laporan ini merangkum
  // apa yang dikirim/dilaporkan keluar dari Kelompok (Daerah + Desa + Iuran Rutin
  // + Barang Barokah) — bagian Kelompok yang ditahan sendiri tidak termasuk di sini.
  const waInfaq2000 =
    hasilPembagian && !isHasilPembagianError(hasilPembagian) ? hasilPembagian.desaTotal : 0;
  const waIuranDesa =
    hasilPembagian && !isHasilPembagianError(hasilPembagian) ? hasilPembagian.sodaqohRutin : 0;
  const waInfaqAbc =
    hasilPembagian && !isHasilPembagianError(hasilPembagian) ? hasilPembagian.daerahTotal : 0;

  // Barang Barokah: jumlah yang "dilaporkan" (bukan yang masuk kas) dari SEMUA
  // entri Barang Barokah yang belum pernah ikut setoran manapun — lepas dari
  // bulan berapa dia dicatat.
  const waBarangBarokah = useMemo(
    () =>
      kasTransaksi
        .filter((t) => t.sumber === 'barang_barokah' && !t.dilaporkan)
        .reduce((sum, t) => sum + (t.jumlah_asli != null ? t.jumlah_asli - t.jumlah : 0), 0),
    [kasTransaksi]
  );

  const saldoKas = useMemo(() => hitungSaldoKas(kasTransaksi), [kasTransaksi]);

  async function handleTambahKasManual(e: FormEvent) {
    e.preventDefault();
    setKasError(null);

    const jumlah = Number(kasJumlah);
    if (!jumlah || jumlah <= 0) {
      setKasError('Jumlah harus diisi dengan angka lebih dari 0.');
      return;
    }

    setKasSaving(true);

    if (editingKasId) {
      const { error } = await supabase
        .from('kas_kelompok')
        .update({
          jenis: kasJenis,
          jumlah,
          keterangan: kasKeterangan.trim() || null,
          updated_by: session?.user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingKasId);

      setKasSaving(false);

      if (error) {
        setKasError('Gagal mengubah transaksi kas.');
        return;
      }
    } else {
      const { error } = await supabase.from('kas_kelompok').insert({
        jenis: kasJenis,
        jumlah,
        keterangan: kasKeterangan.trim() || null,
        sumber: 'manual',
        created_by: session?.user.id,
      });

      setKasSaving(false);

      if (error) {
        setKasError('Gagal menyimpan transaksi kas.');
        return;
      }
    }

    setEditingKasId(null);
    setKasJenis('masuk');
    setKasJumlah('');
    setKasKeterangan('');
    fetchKas();
  }

  function startEditKas(t: KasTransaksi) {
    setEditingKasId(t.id);
    setKasJenis(t.jenis);
    setKasJumlah(String(t.jumlah));
    setKasKeterangan(t.keterangan ?? '');
  }

  function cancelEditKas() {
    setEditingKasId(null);
    setKasJenis('masuk');
    setKasJumlah('');
    setKasKeterangan('');
  }

  async function handleDeleteKas(t: KasTransaksi) {
    const konfirmasi = window.confirm(
      `Hapus transaksi "${t.keterangan || (t.jenis === 'masuk' ? 'Kas masuk' : 'Kas keluar')}" senilai ${formatRupiah(
        t.jumlah
      )}?\n\nData tidak benar-benar hilang, cuma disembunyikan dari daftar (soft delete) dan tetap tercatat siapa yang menghapus.`
    );
    if (!konfirmasi) return;

    const { error } = await supabase
      .from('kas_kelompok')
      .update({ deleted_by: session?.user.id, deleted_at: new Date().toISOString() })
      .eq('id', t.id);

    if (error) {
      setKasError('Gagal menghapus transaksi kas.');
      return;
    }
    fetchKas();
  }

  const previewBarokah = pengaturan ? hitungBarokah(Number(barokahTotal) || 0, pengaturan.rasio_setor_barokah) : null;

  async function handleSubmitBarokah(e: FormEvent) {
    e.preventDefault();
    setKasError(null);

    const total = Number(barokahTotal);
    if (!pengaturan || !total || total <= 0) {
      setKasError('Total Barang Barokah harus diisi dengan angka lebih dari 0.');
      return;
    }

    const hasil = hitungBarokah(total, pengaturan.rasio_setor_barokah);
    setBarokahSaving(true);

    if (editingBarokahId) {
      const { error } = await supabase
        .from('kas_kelompok')
        .update({
          jumlah: hasil.jumlahKas,
          jumlah_asli: hasil.total,
          keterangan: barokahKeterangan.trim() || `Barang Barokah ${labelPeriode(bulan)}`,
          updated_by: session?.user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingBarokahId);

      setBarokahSaving(false);
      if (error) {
        setKasError('Gagal mengubah Barang Barokah.');
        return;
      }
    } else {
      const { error } = await supabase.from('kas_kelompok').insert({
        jenis: 'masuk',
        jumlah: hasil.jumlahKas,
        jumlah_asli: hasil.total,
        keterangan: barokahKeterangan.trim() || `Barang Barokah ${labelPeriode(bulan)}`,
        sumber: 'barang_barokah',
        periode_terkait: bulan,
        created_by: session?.user.id,
      });

      setBarokahSaving(false);
      if (error) {
        setKasError('Gagal menyimpan Barang Barokah.');
        return;
      }
    }

    setEditingBarokahId(null);
    setBarokahTotal('');
    setBarokahKeterangan('');
    setShowFormBarokah(false);
    fetchKas();
  }

  function startEditBarokah(t: KasTransaksi) {
    setEditingBarokahId(t.id);
    setBarokahTotal(String(t.jumlah_asli ?? t.jumlah));
    setBarokahKeterangan(t.keterangan ?? '');
    setShowFormBarokah(true);
  }

  function cancelEditBarokah() {
    setEditingBarokahId(null);
    setBarokahTotal('');
    setBarokahKeterangan('');
    setShowFormBarokah(false);
  }

  function kirimLaporanWa() {
    if (!pengaturan) return;
    const teks = buatTeksLaporanWa({
      sumber: namaBulanSaja(bulan),
      infaqAbc: waInfaqAbc,
      infaq2000: waInfaq2000,
      iuranDesa: waIuranDesa,
      barangBarokah: waBarangBarokah,
    });
    const url = buatUrlWa(pengaturan.nomor_wa_laporan, teks);
    window.open(url, '_blank');
  }

  const totalLaporan = waInfaqAbc + waInfaq2000 + waIuranDesa + waBarangBarokah;

  const labelPeriodeBelumSetor =
    belumSetor.periodeAwal && belumSetor.periodeAkhir
      ? labelRentangPeriode(belumSetor.periodeAwal, belumSetor.periodeAkhir)
      : '';

  function bukaFormSetoran() {
    setSetoranError(null);
    setTanggalSetorInput(new Date().toISOString().slice(0, 10));
    setShowFormSetoran(true);
  }

  async function handleSubmitSetoran(e: FormEvent) {
    e.preventDefault();
    if (!tanggalSetorInput) {
      setSetoranError('Tanggal setor harus diisi.');
      return;
    }
    if (!belumSetor.periodeAwal || !belumSetor.periodeAkhir) {
      setSetoranError('Tidak ada pembayaran yang perlu disetor.');
      return;
    }

    setSetoranSaving(true);
    setSetoranError(null);

    // 1. Catat baris setoran dulu (biar dapet id buat nge-link semua data terkait)
    const { data: setoranRow, error: errSetoran } = await supabase
      .from('setoran_periode')
      .insert({
        periode_awal: belumSetor.periodeAwal,
        periode_akhir: belumSetor.periodeAkhir,
        tanggal_setor: tanggalSetorInput,
        jumlah: totalLaporan,
        created_by: session?.user.id,
      })
      .select()
      .single();

    if (errSetoran || !setoranRow) {
      setSetoranSaving(false);
      setSetoranError('Gagal menyimpan status setoran.');
      return;
    }

    // 2. Kalau ada bagian Kelompok yang harus ditahan, masukkan ke Kas Kelompok
    if (hasilPembagian && !isHasilPembagianError(hasilPembagian) && hasilPembagian.kelompokTotal > 0) {
      await supabase.from('kas_kelompok').insert({
        jenis: 'masuk',
        jumlah: hasilPembagian.kelompokTotal,
        keterangan: `Bagian kelompok infaq ${labelPeriodeBelumSetor}`,
        sumber: 'otomatis_infaq',
        created_by: session?.user.id,
        setoran_id: setoranRow.id,
      });
    }

    // 3. Tandai SEMUA pembayaran yang baru dihitung sebagai sudah disetor
    await supabase
      .from('pembayaran')
      .update({ sudah_disetor: true, setoran_id: setoranRow.id })
      .eq('sudah_disetor', false);

    // 4. Tandai Barang Barokah yang belum dilaporkan sebagai sudah dilaporkan
    await supabase
      .from('kas_kelompok')
      .update({ dilaporkan: true, setoran_id: setoranRow.id })
      .eq('sumber', 'barang_barokah')
      .eq('dilaporkan', false);

    setSetoranSaving(false);
    setShowFormSetoran(false);

    fetchBelumDisetor();
    fetchKas();
    fetchRiwayatSetoran();
    fetchPembayaran(bulan);
  }

  async function handleBatalSetoran(setoran: SetoranPeriode) {
    const konfirmasi = window.confirm(
      `Batalkan setoran tanggal ${new Date(setoran.tanggal_setor).toLocaleDateString('id-ID')} senilai ${formatRupiah(
        setoran.jumlah
      )}?\n\nSemua pembayaran & Barang Barokah yang tercakup akan dibalikin jadi "belum disetor", dan entri kas otomatis terkait akan dihapus.`
    );
    if (!konfirmasi) return;

    setSetoranError(null);

    await supabase
      .from('pembayaran')
      .update({ sudah_disetor: false, setoran_id: null })
      .eq('setoran_id', setoran.id);

    await supabase
      .from('kas_kelompok')
      .update({ dilaporkan: false, setoran_id: null })
      .eq('setoran_id', setoran.id)
      .eq('sumber', 'barang_barokah');

    await supabase
      .from('kas_kelompok')
      .update({ deleted_by: session?.user.id, deleted_at: new Date().toISOString() })
      .eq('setoran_id', setoran.id)
      .eq('sumber', 'otomatis_infaq');

    const { error } = await supabase.from('setoran_periode').delete().eq('id', setoran.id);
    if (error) {
      setSetoranError('Gagal membatalkan status setoran.');
      return;
    }

    fetchBelumDisetor();
    fetchKas();
    fetchRiwayatSetoran();
    fetchPembayaran(bulan);
  }

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-maroon-900">
      <AppHeader active="rekap" />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        {errorMsg && (
          <p className="mb-4 rounded-2xl bg-blush-100 px-4 py-3 text-sm text-blush-600 dark:bg-blush-600/20 dark:text-blush-200">
            {errorMsg}
          </p>
        )}

        {/* --- Hero: Belum Disetor (metrik utama sekarang, lintas bulan) --- */}
        <section className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RingkasanCard
              label={
                belumSetor.jumlahPembayaran > 0
                  ? `Belum Disetor — Mencakup ${labelPeriodeBelumSetor}`
                  : 'Belum Disetor'
              }
              value={formatRupiah(belumSetor.totalInfaq)}
              hint={
                belumSetor.jumlahPembayaran > 0
                  ? `${belumSetor.jumlahPembayaran} pembayaran menunggu disetor`
                  : 'Semua pembayaran sudah disetor ✓'
              }
              accent="dark"
              size="lg"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <RingkasanCard label="Saldo Kas Kelompok" value={formatRupiah(saldoKas)} accent="sage" />
            <RingkasanCard
              label="Pembayaran Menunggu"
              value={String(belumSetor.jumlahPembayaran)}
              hint="belum disetor"
              accent="lavender"
            />
          </div>
        </section>

        {/* --- Rincian pembagian: baris warna-warni seperti kategori --- */}
        {hasilPembagian && (
          <section className="mb-8 rounded-3xl border border-maroon-200/60 bg-cream-50 p-5 shadow-sm dark:border-maroon-700/60 dark:bg-maroon-800 sm:p-6">
            <h2 className="mb-1 font-display text-sm font-semibold text-maroon-900 dark:text-cream-50">
              Rincian Pembagian — Belum Disetor
            </h2>
            <p className="mb-4 text-xs text-maroon-400 dark:text-cream-100/40">
              Mencakup {labelPeriodeBelumSetor} · {belumSetor.jumlahPembayaran} pembayaran yang belum disetor
            </p>

            {isHasilPembagianError(hasilPembagian) ? (
              <p className="rounded-2xl bg-sand-100 px-4 py-3 text-sm text-sand-600 dark:bg-sand-600/20 dark:text-sand-200">
                {hasilPembagian.error}
              </p>
            ) : (
              <>
                <div className="space-y-2.5">
                  {[
                    { label: 'Kelompok', nilai: hasilPembagian.kelompokTotal, warna: 'bg-blush-100 dark:bg-blush-600/20', dot: 'bg-blush-600' },
                    { label: 'Desa', nilai: hasilPembagian.desaTotal, warna: 'bg-lavender-100 dark:bg-lavender-600/20', dot: 'bg-lavender-600' },
                    { label: 'Daerah', nilai: hasilPembagian.daerahTotal, warna: 'bg-sand-100 dark:bg-sand-600/20', dot: 'bg-sand-600' },
                    { label: 'Sodaqoh Rutin', nilai: hasilPembagian.sodaqohRutin, warna: 'bg-sage-100 dark:bg-sage-600/20', dot: 'bg-sage-600' },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ${row.warna}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${row.dot}`} />
                        <span className="text-sm font-medium text-maroon-800 dark:text-cream-50">{row.label}</span>
                      </div>
                      <span className="whitespace-nowrap font-display font-semibold text-maroon-900 dark:text-cream-50">
                        {formatRupiah(row.nilai)}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-3 text-xs text-maroon-400 dark:text-cream-100/40">
                  Bagian Kelompok otomatis masuk Kas Kelompok saat kamu klik "Tandai Sudah Disetor" di
                  section Laporan WhatsApp di bawah.
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowDetailHitung((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-maroon-300 px-4 py-2.5 text-sm font-medium text-maroon-700 transition hover:bg-maroon-100 dark:border-maroon-600 dark:text-cream-100/80 dark:hover:bg-maroon-800"
                  >
                    Detail Perhitungan
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                        showDetailHitung ? 'rotate-180' : ''
                      }`}
                    >
                      <path
                        d="M5 7.5L10 12.5L15 7.5"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>

                {showDetailHitung && (
                  <div className="mt-3 space-y-1.5 rounded-2xl bg-maroon-50 p-4 font-mono text-xs leading-relaxed text-maroon-700 dark:bg-maroon-900 dark:text-cream-100/80">
                    <p>Total Infaq&nbsp;&nbsp;&nbsp;&nbsp;= Rp{formatAngka(hasilPembagian.totalInfaq)}</p>
                    <p>Jumlah Pembayaran = {hasilPembagian.jumlahPembayaran}</p>
                    <p>
                      Potongan Kelompok = {formatAngka(hasilPembagian.potonganKelompokPerBayar)} ×{' '}
                      {hasilPembagian.jumlahPembayaran} = Rp{formatAngka(hasilPembagian.potonganKelompok)}
                    </p>
                    <p>
                      Potongan Desa&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= {formatAngka(hasilPembagian.potonganDesaPerBayar)} ×{' '}
                      {hasilPembagian.jumlahPembayaran} = Rp{formatAngka(hasilPembagian.potonganDesa)}
                    </p>
                    <p>Total Potongan&nbsp;&nbsp;&nbsp;= Rp{formatAngka(hasilPembagian.totalPotongan)}</p>
                    <p className="pt-1">
                      Sisa = {formatAngka(hasilPembagian.totalInfaq)} - {formatAngka(hasilPembagian.totalPotongan)} = Rp
                      {formatAngka(hasilPembagian.sisa)}
                    </p>
                    <p className="pt-1">
                      Bagian Daerah&nbsp;&nbsp; = {formatAngka(hasilPembagian.sisa)} × {hasilPembagian.rasioDaerah * 100}% = Rp
                      {formatAngka(hasilPembagian.bagianDaerahDariSisa)}
                    </p>
                    <p>
                      Bagian Kelompok = {formatAngka(hasilPembagian.sisa)} × {hasilPembagian.rasioKelompok * 100}% = Rp
                      {formatAngka(hasilPembagian.bagianKelompokDariSisa)} + Rp{formatAngka(hasilPembagian.potonganKelompok)}{' '}
                      (potongan kelompok) - Rp{formatAngka(hasilPembagian.sodaqohRutin)} (iuran rutin) = Rp
                      {formatAngka(hasilPembagian.kelompokTotal)}
                    </p>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* --- Kas Kelompok: riwayat & input manual --- */}
        <section className="mb-8 rounded-3xl border border-maroon-200/60 bg-cream-50 p-5 shadow-sm dark:border-maroon-700/60 dark:bg-maroon-800 sm:p-6">
          <h2 className="mb-4 font-display text-sm font-semibold text-maroon-900 dark:text-cream-50">
            Kas Kelompok
          </h2>

          <form onSubmit={handleTambahKasManual} className="mb-5 grid gap-3 sm:grid-cols-4">
            <div className="flex rounded-full bg-maroon-100 p-1 dark:bg-maroon-900">
              <button
                type="button"
                onClick={() => setKasJenis('masuk')}
                className={`flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  kasJenis === 'masuk'
                    ? 'bg-sage-600 text-white shadow-sm'
                    : 'text-maroon-600 hover:text-maroon-900 dark:text-cream-100/70 dark:hover:text-cream-50'
                }`}
              >
                Kas Masuk
              </button>
              <button
                type="button"
                onClick={() => setKasJenis('keluar')}
                className={`flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  kasJenis === 'keluar'
                    ? 'bg-blush-600 text-white shadow-sm'
                    : 'text-maroon-600 hover:text-maroon-900 dark:text-cream-100/70 dark:hover:text-cream-50'
                }`}
              >
                Kas Keluar
              </button>
            </div>
            <input
              type="number"
              min="0"
              placeholder="Jumlah (Rp)"
              value={kasJumlah}
              onChange={(e) => setKasJumlah(e.target.value)}
              className="rounded-full border border-maroon-200 bg-white px-4 py-2.5 text-sm text-maroon-900 focus:border-maroon-400 focus:outline-none focus:ring-1 focus:ring-maroon-300 dark:border-maroon-700 dark:bg-maroon-900 dark:text-cream-50"
            />
            <input
              type="text"
              placeholder="Keterangan (opsional)"
              value={kasKeterangan}
              onChange={(e) => setKasKeterangan(e.target.value)}
              className="rounded-full border border-maroon-200 bg-white px-4 py-2.5 text-sm text-maroon-900 focus:border-maroon-400 focus:outline-none focus:ring-1 focus:ring-maroon-300 dark:border-maroon-700 dark:bg-maroon-900 dark:text-cream-50"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={kasSaving}
                className="flex-1 rounded-full bg-maroon-800 px-4 py-2.5 text-sm font-medium text-cream-50 transition hover:bg-maroon-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cream-100 dark:text-maroon-900 dark:hover:bg-white"
              >
                {kasSaving ? 'Menyimpan...' : editingKasId ? 'Simpan' : 'Catat'}
              </button>
              {editingKasId && (
                <button
                  type="button"
                  onClick={cancelEditKas}
                  className="rounded-full border border-maroon-200 px-3 py-2.5 text-sm font-medium text-maroon-600 hover:bg-maroon-100 dark:border-maroon-700 dark:text-cream-100/70 dark:hover:bg-maroon-800"
                >
                  Batal
                </button>
              )}
            </div>
          </form>

          <div className="mb-5 rounded-2xl border border-dashed border-maroon-200 p-4 dark:border-maroon-700">
            <button
              type="button"
              onClick={() => (showFormBarokah ? cancelEditBarokah() : setShowFormBarokah(true))}
              className="text-sm font-medium text-lavender-600 hover:underline dark:text-lavender-200"
            >
              {showFormBarokah ? 'Batal tambah Barang Barokah' : '+ Tambah Barang Barokah'}
            </button>

            {showFormBarokah && (
              <form onSubmit={handleSubmitBarokah} className="mt-3 grid gap-3 sm:grid-cols-4">
                <input
                  type="number"
                  min="0"
                  placeholder="Total Barang Barokah (Rp)"
                  value={barokahTotal}
                  onChange={(e) => setBarokahTotal(e.target.value)}
                  className="rounded-full border border-maroon-200 bg-white px-4 py-2.5 text-sm text-maroon-900 focus:border-maroon-400 focus:outline-none focus:ring-1 focus:ring-maroon-300 dark:border-maroon-700 dark:bg-maroon-900 dark:text-cream-50 sm:col-span-2"
                />
                <input
                  type="text"
                  placeholder="Keterangan (opsional)"
                  value={barokahKeterangan}
                  onChange={(e) => setBarokahKeterangan(e.target.value)}
                  className="rounded-full border border-maroon-200 bg-white px-4 py-2.5 text-sm text-maroon-900 focus:border-maroon-400 focus:outline-none focus:ring-1 focus:ring-maroon-300 dark:border-maroon-700 dark:bg-maroon-900 dark:text-cream-50"
                />
                <button
                  type="submit"
                  disabled={barokahSaving}
                  className="rounded-full bg-maroon-800 px-4 py-2.5 text-sm font-medium text-cream-50 transition hover:bg-maroon-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cream-100 dark:text-maroon-900 dark:hover:bg-white"
                >
                  {barokahSaving ? 'Menyimpan...' : editingBarokahId ? 'Simpan' : 'Catat'}
                </button>

                {previewBarokah && previewBarokah.total > 0 && pengaturan && (
                  <p className="text-xs text-maroon-500 dark:text-cream-100/50 sm:col-span-4">
                    Dari {formatRupiah(previewBarokah.total)}: <strong>{formatRupiah(previewBarokah.jumlahKas)}</strong> masuk
                    Kas Kelompok, <strong>{formatRupiah(previewBarokah.jumlahLaporan)}</strong> (
                    {Math.round(pengaturan.rasio_setor_barokah * 100)}%) otomatis masuk hitungan Laporan WA sampai
                    disetorkan.
                  </p>
                )}
              </form>
            )}
          </div>

          {kasError && (
            <p className="mb-4 rounded-2xl bg-blush-100 px-4 py-3 text-sm text-blush-600 dark:bg-blush-600/20 dark:text-blush-200">
              {kasError}
            </p>
          )}

          {kasLoading ? (
            <p className="py-4 text-center text-sm text-maroon-400 dark:text-cream-100/40">
              Memuat riwayat kas...
            </p>
          ) : kasTransaksi.length === 0 ? (
            <p className="py-4 text-center text-sm text-maroon-400 dark:text-cream-100/40">
              Belum ada transaksi kas.
            </p>
          ) : (
            <>
              <ul className="divide-y divide-maroon-100 text-sm dark:divide-maroon-700/60">
                {kasTransaksi
                  .slice((kasPage - 1) * KAS_PAGE_SIZE, kasPage * KAS_PAGE_SIZE)
                  .map((t) => (
                    <li key={t.id} className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-maroon-800 dark:text-cream-50">
                          {t.keterangan || (t.jenis === 'masuk' ? 'Kas masuk' : 'Kas keluar')}
                        </p>
                        <p className="text-xs text-maroon-400 dark:text-cream-100/40">
                          {namaAdmin(adminMap, t.created_by)} · {formatWaktu(t.created_at)}
                          {t.sumber === 'otomatis_infaq' && ' · otomatis'}
                          {t.sumber === 'barang_barokah' && ' · barang barokah'}
                        </p>
                        {t.sumber === 'barang_barokah' && t.jumlah_asli != null && (
                          <p className="text-xs text-maroon-400 dark:text-cream-100/40">
                            Total {formatRupiah(t.jumlah_asli)} — {formatRupiah(t.jumlah)} kas /{' '}
                            {formatRupiah(t.jumlah_asli - t.jumlah)} laporan{' '}
                            {t.dilaporkan ? '· sudah dilaporkan ✓' : '· belum dilaporkan'}
                          </p>
                        )}
                        {t.updated_at && (
                          <p className="text-xs text-maroon-400 dark:text-cream-100/40">
                            Diubah {namaAdmin(adminMap, t.updated_by)} · {formatWaktu(t.updated_at)}
                          </p>
                        )}
                        <div className="mt-1 flex gap-3">
                          <button
                            onClick={() => (t.sumber === 'barang_barokah' ? startEditBarokah(t) : startEditKas(t))}
                            className="text-xs font-medium text-lavender-600 hover:underline dark:text-lavender-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteKas(t)}
                            className="text-xs font-medium text-blush-600 hover:underline dark:text-blush-200"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 whitespace-nowrap font-display font-semibold ${
                          t.jenis === 'masuk' ? 'text-sage-600' : 'text-blush-600'
                        }`}
                      >
                        {t.jenis === 'masuk' ? '+' : '-'}
                        {formatRupiah(t.jumlah)}
                      </span>
                    </li>
                  ))}
              </ul>
              <PaginationControls
                page={kasPage}
                totalPages={Math.max(1, Math.ceil(kasTransaksi.length / KAS_PAGE_SIZE))}
                onPageChange={setKasPage}
                totalItems={kasTransaksi.length}
                pageSize={KAS_PAGE_SIZE}
              />
            </>
          )}
        </section>

        {/* --- Laporan WhatsApp --- */}
        <section className="mb-8 rounded-3xl border border-maroon-200/60 bg-cream-50 p-5 shadow-sm dark:border-maroon-700/60 dark:bg-maroon-800 sm:p-6">
          <h2 className="mb-1 font-display text-sm font-semibold text-maroon-900 dark:text-cream-50">
            Laporan WhatsApp
          </h2>
          <p className="mb-5 text-xs text-maroon-500 dark:text-cream-100/50">
            Laporan ini merangkum yang dilaporkan/dikirim keluar dari Kelompok — semua field
            terisi otomatis dari hasil perhitungan periode ini: Infaq ABC (Bagian Daerah),
            Infaq 2000, Iuran Rutin, dan Barang Barokah (25% dari total yang dicatat di Kas
            Kelompok). Bagian Kelompok yang ditahan sendiri tidak ikut di sini.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-blush-100 px-4 py-3 dark:bg-blush-600/20">
              <p className="text-xs font-medium text-maroon-500 dark:text-cream-100/60">Infaq ABC</p>
              <p className="mt-0.5 whitespace-nowrap font-display text-lg font-semibold text-maroon-900 dark:text-cream-50">
                {formatRupiah(waInfaqAbc)}
              </p>
            </div>
            <div className="rounded-2xl bg-lavender-100 px-4 py-3 dark:bg-lavender-600/20">
              <p className="text-xs font-medium text-maroon-500 dark:text-cream-100/60">Infaq 2000</p>
              <p className="mt-0.5 whitespace-nowrap font-display text-lg font-semibold text-maroon-900 dark:text-cream-50">
                {formatRupiah(waInfaq2000)}
              </p>
            </div>
            <div className="rounded-2xl bg-sand-100 px-4 py-3 dark:bg-sand-600/20">
              <p className="text-xs font-medium text-maroon-500 dark:text-cream-100/60">Iuran Desa</p>
              <p className="mt-0.5 whitespace-nowrap font-display text-lg font-semibold text-maroon-900 dark:text-cream-50">
                {formatRupiah(waIuranDesa)}
              </p>
            </div>
            <div className="rounded-2xl bg-sage-100 px-4 py-3 dark:bg-sage-600/20">
              <p className="text-xs font-medium text-maroon-500 dark:text-cream-100/60">Barang Barokah</p>
              <p className="mt-0.5 whitespace-nowrap font-display text-lg font-semibold text-maroon-900 dark:text-cream-50">
                {formatRupiah(waBarangBarokah)}
              </p>
            </div>
          </div>

          <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-maroon-50 p-4 font-mono text-xs text-maroon-700 dark:bg-maroon-900 dark:text-cream-100/80">
            {buatTeksLaporanWa({
              sumber: namaBulanSaja(bulan),
              infaqAbc: waInfaqAbc,
              infaq2000: waInfaq2000,
              iuranDesa: waIuranDesa,
              barangBarokah: waBarangBarokah,
            })}
          </pre>

          <button
            onClick={kirimLaporanWa}
            disabled={!pengaturan}
            className="mt-4 rounded-full bg-sage-600 px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Kirim Laporan via WhatsApp
          </button>

          {/* --- Status Setoran: berbasis "belum disetor", TIDAK mempengaruhi saldo Kas Kelompok --- */}
          <div className="mt-4 border-t border-maroon-100 pt-4 dark:border-maroon-700/60">
            {belumSetorLoading ? (
              <p className="text-xs text-maroon-400 dark:text-cream-100/40">Memuat status setoran...</p>
            ) : showFormSetoran ? (
              <form onSubmit={handleSubmitSetoran} className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-maroon-500 dark:text-cream-100/60">
                    Tanggal setor aktual
                  </label>
                  <input
                    type="date"
                    value={tanggalSetorInput}
                    onChange={(e) => setTanggalSetorInput(e.target.value)}
                    className="rounded-full border border-maroon-200 bg-white px-4 py-2 text-sm text-maroon-900 focus:border-maroon-400 focus:outline-none focus:ring-1 focus:ring-maroon-300 dark:border-maroon-700 dark:bg-maroon-900 dark:text-cream-50"
                  />
                </div>
                <div className="text-xs text-maroon-500 dark:text-cream-100/50">
                  Jumlah: <strong>{formatRupiah(totalLaporan)}</strong> (mencakup {labelPeriodeBelumSetor},
                  otomatis dari laporan di atas)
                </div>
                <button
                  type="submit"
                  disabled={setoranSaving}
                  className="rounded-full bg-maroon-800 px-4 py-2 text-sm font-medium text-cream-50 hover:bg-maroon-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cream-100 dark:text-maroon-900"
                >
                  {setoranSaving ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowFormSetoran(false)}
                  className="rounded-full border border-maroon-200 px-4 py-2 text-sm font-medium text-maroon-600 hover:bg-maroon-100 dark:border-maroon-700 dark:text-cream-100/70 dark:hover:bg-maroon-800"
                >
                  Batal
                </button>
              </form>
            ) : belumSetor.jumlahPembayaran === 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-100 px-3 py-1.5 text-xs font-medium text-sage-600 dark:bg-sage-600/20 dark:text-sage-200">
                ✓ Semua pembayaran sudah disetor
              </span>
            ) : (
              <button
                onClick={bukaFormSetoran}
                className="rounded-full border border-maroon-300 px-4 py-2 text-sm font-medium text-maroon-700 hover:bg-maroon-100 dark:border-maroon-600 dark:text-cream-100/80 dark:hover:bg-maroon-800"
              >
                Tandai Sudah Disetor ({labelPeriodeBelumSetor})
              </button>
            )}

            {setoranError && (
              <p className="mt-2 rounded-2xl bg-blush-100 px-4 py-2 text-xs text-blush-600 dark:bg-blush-600/20 dark:text-blush-200">
                {setoranError}
              </p>
            )}

            {riwayatSetoran.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-maroon-500 dark:text-cream-100/50">
                  Riwayat Setoran
                </p>
                <ul className="space-y-2">
                  {riwayatSetoran.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-maroon-50 px-4 py-2.5 text-xs dark:bg-maroon-900"
                    >
                      <div>
                        <p className="font-medium text-maroon-800 dark:text-cream-50">
                          {formatRupiah(s.jumlah)} — {labelRentangPeriode(s.periode_awal, s.periode_akhir)}
                        </p>
                        <p className="text-maroon-400 dark:text-cream-100/40">
                          Disetor {new Date(s.tanggal_setor).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          · {namaAdmin(adminMap, s.created_by)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleBatalSetoran(s)}
                        className="text-xs font-medium text-blush-600 hover:underline dark:text-blush-200"
                      >
                        Batalkan
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* --- Tren 6 bulan --- */}
        <section className="mb-8 rounded-3xl border border-maroon-200/60 bg-cream-50 p-5 shadow-sm dark:border-maroon-700/60 dark:bg-maroon-800 sm:p-6">
          <h2 className="mb-3 font-display text-sm font-semibold text-maroon-900 dark:text-cream-50">
            Tren Infaq 6 Bulan Terakhir
          </h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trenBulanan}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4C7BE" opacity={0.4} />
                <XAxis dataKey="bulan" tick={{ fontSize: 12 }} stroke="#A66C6C" />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="#A66C6C"
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip formatter={(value: number) => formatRupiah(value)} />
                <Line type="monotone" dataKey="total" stroke="#D9607E" strokeWidth={3} dot={{ r: 4, fill: '#D9607E' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* --- Partisipasi per Bulan (satu tahun sekaligus) --- */}
        {totalAnggota > 0 && (
          <section className="mb-8 rounded-3xl border border-maroon-200/60 bg-cream-50 p-5 shadow-sm dark:border-maroon-700/60 dark:bg-maroon-800 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-sm font-semibold text-maroon-900 dark:text-cream-50">
                  Partisipasi per Bulan
                </h2>
                <p className="text-xs text-maroon-400 dark:text-cream-100/40">
                  Persentase anggota yang bayar tiap bulan — biar kelihatan siapa yang rajin vs bolong-bolong.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-maroon-100/70 px-1 py-1 dark:bg-maroon-900/60">
                <button
                  onClick={() => setTahunRekap((t) => t - 1)}
                  className="rounded-full px-2.5 py-1 text-sm text-maroon-600 hover:bg-cream-50 dark:text-cream-100/70 dark:hover:bg-maroon-800"
                  aria-label="Tahun sebelumnya"
                >
                  ‹
                </button>
                <span className="min-w-[3.5rem] text-center font-display text-sm font-semibold text-maroon-900 dark:text-cream-50">
                  {tahunRekap}
                </span>
                <button
                  onClick={() => setTahunRekap((t) => t + 1)}
                  className="rounded-full px-2.5 py-1 text-sm text-maroon-600 hover:bg-cream-50 dark:text-cream-100/70 dark:hover:bg-maroon-800"
                  aria-label="Tahun berikutnya"
                >
                  ›
                </button>
              </div>
            </div>

            {rekapTahunanLoading ? (
              <p className="py-4 text-center text-sm text-maroon-400 dark:text-cream-100/40">Memuat data...</p>
            ) : (
              <div className="space-y-2.5">
                {partisipasiPerBulan.map(({ bulanKe, persen, jumlahBayar }) => (
                  <div key={bulanKe} className="flex items-center gap-3">
                    <span className="w-9 shrink-0 text-xs font-medium text-maroon-500 dark:text-cream-100/50">
                      {NAMA_BULAN_SINGKAT[bulanKe - 1]}
                    </span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-maroon-100 dark:bg-maroon-900">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sand-600 to-blush-600 transition-all"
                        style={{ width: `${persen}%` }}
                      />
                    </div>
                    <span className="w-24 shrink-0 text-right text-xs text-maroon-500 dark:text-cream-100/50">
                      {jumlahBayar}/{totalAnggota} · {persen}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* --- Rekap Tahunan --- */}
        <section className="mb-8">
          <RekapTahunan
            tahun={tahunRekap}
            onTahunChange={setTahunRekap}
            data={rekapTahunanData}
            totalPerBulan={totalPerBulanTahunan}
            loading={rekapTahunanLoading}
          />
        </section>

        {/* --- Histori Bulanan: semua yang berbasis 1 bulan kalender, dikelompokkan di sini --- */}
        <section className="mb-8 rounded-3xl border border-maroon-200/60 bg-cream-50 p-5 shadow-sm dark:border-maroon-700/60 dark:bg-maroon-800 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-sm font-semibold text-maroon-900 dark:text-cream-50">
                Histori Bulanan
              </h2>
              <p className="text-xs text-maroon-400 dark:text-cream-100/40">
                Buat ngecek riwayat per bulan kalender — beda dari "Belum Disetor" di atas yang
                bisa mencakup beberapa bulan sekaligus.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="periode" className="shrink-0 text-sm font-medium text-maroon-700 dark:text-cream-100/80">
                Periode
              </label>
              <div className="w-44">
                <AppSelect
                  id="periode"
                  value={bulan}
                  onChange={setBulan}
                  isSearchable={false}
                  options={opsiPeriode(12).map((opsi) => ({ value: opsi.value, label: opsi.label }))}
                />
              </div>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <RingkasanCard label="Total Infaq" value={formatRupiah(totalInfaq)} accent="cream" />
            <RingkasanCard label="Jumlah Pembayaran" value={String(jumlahPembayaran)} accent="cream" />
            <RingkasanCard
              label="Partisipasi"
              value={`${persentasePartisipasi}%`}
              hint={`${jumlahSudahBayar} dari ${totalAnggota} anggota`}
              accent="cream"
            />
          </div>

          {totalAnggota > 0 && (
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-maroon-500 dark:text-cream-100/50">Progress Pembayaran</p>
                <span className="text-xs font-semibold text-maroon-800 dark:text-cream-50">{persentasePartisipasi}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-maroon-100 dark:bg-maroon-900">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sand-600 to-blush-600 transition-all"
                  style={{ width: `${persentasePartisipasi}%` }}
                />
              </div>

              {daftarBelumBayar.length > 0 && (
                <>
                  <button
                    onClick={() => setShowBelumBayar((v) => !v)}
                    className="mt-3 text-xs font-medium text-lavender-600 hover:underline dark:text-lavender-200"
                  >
                    {showBelumBayar
                      ? 'Sembunyikan daftar belum bayar ▲'
                      : `Lihat ${daftarBelumBayar.length} yang belum bayar ▼`}
                  </button>

                  {showBelumBayar && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {daftarBelumBayar.map((a) => (
                        <span
                          key={a.id}
                          className="rounded-full bg-blush-100 px-3 py-1.5 text-xs font-medium text-maroon-700 dark:bg-blush-600/20 dark:text-cream-50"
                        >
                          {a.nama}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <h3 className="mb-3 text-xs font-medium text-maroon-500 dark:text-cream-100/50">
            Daftar Pembayar {labelPeriode(bulan)}
          </h3>
          <TabelPembayaran data={data} loading={loading} adminMap={adminMap} resetKey={bulan} />
        </section>
      </main>
    </div>
  );
}
