import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
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
import { hitungPembagianInfaq, isHasilPembagianError, formatRupiah } from '../lib/hitungInfaq';
import { periodeSekarang, labelPeriode, namaBulanSaja, opsiPeriode } from '../lib/bulan';
import { hitungSaldoKas } from '../lib/kas';
import { buatTeksLaporanWa, buatUrlWa } from '../lib/waTemplate';
import RingkasanCard from '../components/RingkasanCard';
import TabelPembayaran from '../components/TabelPembayaran';
import ThemeToggle from '../components/ThemeToggle';

export default function Rekap() {
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

  // --- Laporan WhatsApp ---
  const [waInfaqAbc, setWaInfaqAbc] = useState(0);
  const [waInfaq2000, setWaInfaq2000] = useState(0);
  const [waIuranDesa, setWaIuranDesa] = useState(0);
  const [waBarangBarokah, setWaBarangBarokah] = useState(0);

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
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      setKasError('Gagal memuat data kas kelompok.');
    } else {
      setKasTransaksi(rows as KasTransaksi[]);
    }
    setKasLoading(false);
  }

  useEffect(() => {
    fetchPengaturan();
    fetchTren();
    fetchKas();
  }, []);

  useEffect(() => {
    fetchPembayaran(bulan);
  }, [bulan]);

  const totalInfaq = useMemo(
    () => data.reduce((sum, item) => sum + item.jumlah_bayar, 0),
    [data]
  );
  const jumlahPembayaran = data.length;

  const hasilPembagian = useMemo(() => {
    if (!pengaturan || jumlahPembayaran === 0) return null;
    return hitungPembagianInfaq(totalInfaq, jumlahPembayaran, pengaturan);
  }, [pengaturan, totalInfaq, jumlahPembayaran]);

  // Sinkronkan draft "Infaq ABC" di form WA setiap kali total infaq periode berubah
  useEffect(() => {
    setWaInfaqAbc(totalInfaq);
  }, [totalInfaq]);

  const saldoKas = useMemo(() => hitungSaldoKas(kasTransaksi), [kasTransaksi]);

  const sudahDitambahkanOtomatis = useMemo(
    () => kasTransaksi.some((t) => t.sumber === 'otomatis_infaq' && t.periode_terkait === bulan),
    [kasTransaksi, bulan]
  );

  async function tambahOtomatisKeKas() {
    if (!hasilPembagian || isHasilPembagianError(hasilPembagian)) return;
    setOtomatisSaving(true);
    setKasError(null);

    const { error } = await supabase.from('kas_kelompok').insert({
      jenis: 'masuk',
      jumlah: hasilPembagian.kelompokTotal,
      keterangan: `Bagian kelompok infaq ${labelPeriode(bulan)}`,
      sumber: 'otomatis_infaq',
      periode_terkait: bulan,
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
    const { error } = await supabase.from('kas_kelompok').insert({
      jenis: kasJenis,
      jumlah,
      keterangan: kasKeterangan.trim() || null,
      sumber: 'manual',
    });
    setKasSaving(false);

    if (error) {
      setKasError('Gagal menyimpan transaksi kas.');
      return;
    }

    setKasJumlah('');
    setKasKeterangan('');
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Rekap Infaq</h1>
          <nav className="flex flex-wrap items-center gap-3 text-sm sm:gap-4">
            <Link to="/input" className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100">
              Input
            </Link>
            <Link to="/rekap" className="font-medium text-blue-600 dark:text-blue-400">
              Rekap
            </Link>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
            >
              Keluar
            </button>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
        <div className="mb-6 flex items-center gap-3">
          <label htmlFor="periode" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Periode
          </label>
          <select
            id="periode"
            value={bulan}
            onChange={(e) => setBulan(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {opsiPeriode(12).map((opsi) => (
              <option key={opsi.value} value={opsi.value}>
                {opsi.label}
              </option>
            ))}
          </select>
        </div>

        {errorMsg && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
            {errorMsg}
          </p>
        )}

        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <RingkasanCard label="Total Infaq" value={formatRupiah(totalInfaq)} accent="positive" />
          <RingkasanCard label="Jumlah Pembayaran" value={String(jumlahPembayaran)} />
          {hasilPembagian && !isHasilPembagianError(hasilPembagian) ? (
            <>
              <RingkasanCard label="Bagian Kelompok" value={formatRupiah(hasilPembagian.kelompokTotal)} />
              <RingkasanCard label="Bagian Desa" value={formatRupiah(hasilPembagian.desaTotal)} />
            </>
          ) : (
            <div className="col-span-2 flex items-center rounded-xl border border-dashed border-slate-300 px-4 text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
              Belum ada data untuk dihitung pembagiannya.
            </div>
          )}
        </section>

        {hasilPembagian && (
          <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
              Rincian Pembagian
            </h2>
            {isHasilPembagianError(hasilPembagian) ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                {hasilPembagian.error}
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Kelompok</p>
                    <p className="font-medium text-slate-900 dark:text-slate-50">
                      {formatRupiah(hasilPembagian.kelompokTotal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Desa</p>
                    <p className="font-medium text-slate-900 dark:text-slate-50">
                      {formatRupiah(hasilPembagian.desaTotal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Daerah</p>
                    <p className="font-medium text-slate-900 dark:text-slate-50">
                      {formatRupiah(hasilPembagian.daerahTotal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Sodaqoh Rutin</p>
                    <p className="font-medium text-slate-900 dark:text-slate-50">
                      {formatRupiah(hasilPembagian.sodaqohRutin)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    onClick={tambahOtomatisKeKas}
                    disabled={sudahDitambahkanOtomatis || otomatisSaving}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sudahDitambahkanOtomatis
                      ? 'Sudah ditambahkan ke kas'
                      : otomatisSaving
                      ? 'Menambahkan...'
                      : `+ Tambahkan ${formatRupiah(hasilPembagian.kelompokTotal)} ke Kas Kelompok`}
                  </button>
                </div>
              </>
            )}
          </section>
        )}

        {/* --- Kas Kelompok --- */}
        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Kas Kelompok</h2>
            <RingkasanCard label="Saldo Saat Ini" value={formatRupiah(saldoKas)} accent="muted" />
          </div>

          <form onSubmit={handleTambahKasManual} className="mb-4 grid gap-3 sm:grid-cols-4">
            <select
              value={kasJenis}
              onChange={(e) => setKasJenis(e.target.value as 'masuk' | 'keluar')}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="masuk">Kas Masuk</option>
              <option value="keluar">Kas Keluar</option>
            </select>
            <input
              type="number"
              min="0"
              placeholder="Jumlah (Rp)"
              value={kasJumlah}
              onChange={(e) => setKasJumlah(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <input
              type="text"
              placeholder="Keterangan (opsional)"
              value={kasKeterangan}
              onChange={(e) => setKasKeterangan(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:col-span-1"
            />
            <button
              type="submit"
              disabled={kasSaving}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              {kasSaving ? 'Menyimpan...' : 'Catat'}
            </button>
          </form>

          {kasError && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
              {kasError}
            </p>
          )}

          {kasLoading ? (
            <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">Memuat riwayat kas...</p>
          ) : kasTransaksi.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">Belum ada transaksi kas.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
              {kasTransaksi.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-slate-800 dark:text-slate-100">
                      {t.keterangan || (t.jenis === 'masuk' ? 'Kas masuk' : 'Kas keluar')}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(t.created_at).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {t.sumber === 'otomatis_infaq' && ' · otomatis'}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 font-medium ${
                      t.jenis === 'masuk'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {t.jenis === 'masuk' ? '+' : '-'}
                    {formatRupiah(t.jumlah)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* --- Laporan WhatsApp --- */}
        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <h2 className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Laporan WhatsApp</h2>
          <p className="mb-4 text-xs text-slate-400 dark:text-slate-500">
            "Infaq ABC" terisi otomatis dari total infaq periode ini. Field lain silakan isi manual sebelum kirim.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Infaq ABC
              </label>
              <input
                type="number"
                min="0"
                value={waInfaqAbc}
                onChange={(e) => setWaInfaqAbc(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Infaq 2000
              </label>
              <input
                type="number"
                min="0"
                value={waInfaq2000}
                onChange={(e) => setWaInfaq2000(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Iuran Desa
              </label>
              <input
                type="number"
                min="0"
                value={waIuranDesa}
                onChange={(e) => setWaIuranDesa(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Barang Barokah
              </label>
              <input
                type="number"
                min="0"
                value={waBarangBarokah}
                onChange={(e) => setWaBarangBarokah(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
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
            className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Kirim Laporan via WhatsApp
          </button>
        </section>

        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
            Tren Infaq 6 Bulan Terakhir
          </h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trenBulanan}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
                <XAxis dataKey="bulan" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="#94a3b8"
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip formatter={(value: number) => formatRupiah(value)} />
                <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
            Daftar Pembayar {labelPeriode(bulan)}
          </h2>
          <TabelPembayaran data={data} loading={loading} />
        </section>
      </main>
    </div>
  );
}
