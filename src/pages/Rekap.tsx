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
import type { KasTransaksi, Pembayaran, Pengaturan } from '../lib/types';
import { hitungPembagianInfaq, isHasilPembagianError, formatRupiah, formatAngka } from '../lib/hitungInfaq';
import { periodeSekarang, labelPeriode, namaBulanSaja, opsiPeriode } from '../lib/bulan';
import { hitungSaldoKas } from '../lib/kas';
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
  const [otomatisSaving, setOtomatisSaving] = useState(false);
  const [showDetailHitung, setShowDetailHitung] = useState(false);
  const [editingKasId, setEditingKasId] = useState<string | null>(null);
  const [kasPage, setKasPage] = useState(1);
  const KAS_PAGE_SIZE = 6;

  // --- Laporan WhatsApp (otomatis dari hasil pembagian, kecuali Barang Barokah) ---
  const [waBarangBarokah, setWaBarangBarokah] = useState(0);

  // --- Rekap Tahunan ---
  const [tahunRekap, setTahunRekap] = useState(new Date().getFullYear());
  const [rekapTahunanData, setRekapTahunanData] = useState<BarisRekapTahunan[]>([]);
  const [totalPerBulanTahunan, setTotalPerBulanTahunan] = useState<Record<number, number>>({});
  const [rekapTahunanLoading, setRekapTahunanLoading] = useState(true);

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

  useEffect(() => {
    fetchPengaturan();
    fetchTren();
    fetchKas();
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

  const hasilPembagian = useMemo(() => {
    if (!pengaturan || jumlahPembayaran === 0) return null;
    return hitungPembagianInfaq(totalInfaq, jumlahPembayaran, pengaturan);
  }, [pengaturan, totalInfaq, jumlahPembayaran]);

  // Infaq ABC = Bagian Daerah (hasil bagi 50% dari sisa). Laporan ini merangkum
  // apa yang dikirim/dilaporkan keluar dari Kelompok (Daerah + Desa + Iuran Rutin
  // + Barang Barokah) — bagian Kelompok yang ditahan sendiri tidak termasuk di sini.
  const waInfaq2000 =
    hasilPembagian && !isHasilPembagianError(hasilPembagian) ? hasilPembagian.desaTotal : 0;
  const waIuranDesa =
    hasilPembagian && !isHasilPembagianError(hasilPembagian) ? hasilPembagian.sodaqohRutin : 0;
  const waInfaqAbc =
    hasilPembagian && !isHasilPembagianError(hasilPembagian) ? hasilPembagian.daerahTotal : 0;

  const saldoKas = useMemo(() => hitungSaldoKas(kasTransaksi), [kasTransaksi]);

  const sudahDitambahkanOtomatis = useMemo(
    () => kasTransaksi.some((t) => t.sumber === 'otomatis_infaq' && t.periode_terkait === bulan),
    [kasTransaksi, bulan]
  );

  async function tambahOtomatisKeKas() {
    if (!hasilPembagian || isHasilPembagianError(hasilPembagian)) return;

    const konfirmasi = window.confirm(
      `Tambahkan ${formatRupiah(hasilPembagian.kelompokTotal)} ke Kas Kelompok untuk periode ${labelPeriode(
        bulan
      )}?\n\nSetelah ditambahkan, periode ini tidak bisa ditambahkan lagi ke kas secara otomatis.`
    );
    if (!konfirmasi) return;

    setOtomatisSaving(true);
    setKasError(null);

    const { error } = await supabase.from('kas_kelompok').insert({
      jenis: 'masuk',
      jumlah: hasilPembagian.kelompokTotal,
      keterangan: `Bagian kelompok infaq ${labelPeriode(bulan)}`,
      sumber: 'otomatis_infaq',
      periode_terkait: bulan,
      created_by: session?.user.id,
    });

    setOtomatisSaving(false);

    if (error) {
      setKasError(
        error.code === '23505'
          ? 'Bagian kelompok periode ini sudah pernah ditambahkan ke kas.'
          : 'Gagal menambahkan ke kas kelompok.'
      );
      return;
    }
    fetchKas();
  }

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

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-maroon-900">
      <AppHeader active="rekap" />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <label htmlFor="periode" className="shrink-0 text-sm font-medium text-maroon-700 dark:text-cream-100/80">
            Periode
          </label>
          <div className="w-48">
            <AppSelect
              id="periode"
              value={bulan}
              onChange={setBulan}
              isSearchable={false}
              options={opsiPeriode(12).map((opsi) => ({ value: opsi.value, label: opsi.label }))}
            />
          </div>
        </div>

        {errorMsg && (
          <p className="mb-4 rounded-2xl bg-blush-100 px-4 py-3 text-sm text-blush-600 dark:bg-blush-600/20 dark:text-blush-200">
            {errorMsg}
          </p>
        )}

        {/* --- Kartu saldo utama, lega, tidak kepotong --- */}
        <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RingkasanCard
              label={`Total Infaq — ${labelPeriode(bulan)}`}
              value={formatRupiah(totalInfaq)}
              hint={`${jumlahPembayaran} pembayaran tercatat`}
              accent="dark"
              size="lg"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <RingkasanCard label="Saldo Kas Kelompok" value={formatRupiah(saldoKas)} accent="sage" />
            <RingkasanCard label="Jumlah Pembayaran" value={String(jumlahPembayaran)} accent="lavender" />
          </div>
        </section>

        {/* --- Rincian pembagian: baris warna-warni seperti kategori --- */}
        {hasilPembagian && (
          <section className="mb-8 rounded-3xl border border-maroon-200/60 bg-cream-50 p-5 shadow-sm dark:border-maroon-700/60 dark:bg-maroon-800 sm:p-6">
            <h2 className="mb-4 font-display text-sm font-semibold text-maroon-900 dark:text-cream-50">
              Rincian Pembagian
            </h2>

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

                <button
                  onClick={() => setShowDetailHitung((v) => !v)}
                  className="mt-4 text-xs font-medium text-lavender-600 hover:underline dark:text-lavender-200"
                >
                  {showDetailHitung ? 'Sembunyikan rincian perhitungan ▲' : 'Lihat rincian perhitungan ▼'}
                </button>

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

                <button
                  onClick={tambahOtomatisKeKas}
                  disabled={sudahDitambahkanOtomatis || otomatisSaving}
                  className="mt-5 w-full rounded-full bg-maroon-800 px-5 py-3 text-sm font-medium text-cream-50 transition hover:bg-maroon-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-cream-100 dark:text-maroon-900 dark:hover:bg-white sm:w-auto"
                >
                  {sudahDitambahkanOtomatis
                    ? 'Sudah ditambahkan ke kas ✓'
                    : otomatisSaving
                    ? 'Menambahkan...'
                    : `+ Tambahkan bagian Kelompok ke Kas`}
                </button>
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
            <AppSelect
              value={kasJenis}
              onChange={(v) => setKasJenis(v as 'masuk' | 'keluar')}
              isSearchable={false}
              options={[
                { value: 'masuk', label: 'Kas Masuk' },
                { value: 'keluar', label: 'Kas Keluar' },
              ]}
            />
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
                        </p>
                        {t.updated_at && (
                          <p className="text-xs text-maroon-400 dark:text-cream-100/40">
                            Diubah {namaAdmin(adminMap, t.updated_by)} · {formatWaktu(t.updated_at)}
                          </p>
                        )}
                        <div className="mt-1 flex gap-3">
                          <button
                            onClick={() => startEditKas(t)}
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
            Laporan ini merangkum yang dilaporkan/dikirim keluar dari Kelompok — Infaq ABC
            (Bagian Daerah), Infaq 2000, dan Iuran terisi otomatis dari hasil perhitungan
            periode ini. Bagian Kelompok yang ditahan sendiri tidak ikut di sini. Hanya
            Barang Barokah yang perlu diisi manual.
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
              <label className="block text-xs font-medium text-maroon-500 dark:text-cream-100/60">
                Barang Barokah
              </label>
              <input
                type="number"
                min="0"
                value={waBarangBarokah}
                onChange={(e) => setWaBarangBarokah(Number(e.target.value))}
                className="mt-0.5 w-full bg-transparent font-display text-lg font-semibold text-maroon-900 focus:outline-none dark:text-cream-50"
                placeholder="0"
              />
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

        {/* --- Daftar pembayar periode terpilih --- */}
        <section>
          <h2 className="mb-3 font-display text-sm font-semibold text-maroon-900 dark:text-cream-50">
            Daftar Pembayar {labelPeriode(bulan)}
          </h2>
          <TabelPembayaran data={data} loading={loading} adminMap={adminMap} resetKey={bulan} />
        </section>
      </main>
    </div>
  );
}
