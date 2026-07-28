import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import type { Anggota, OpsiInfaq, Pembayaran } from '../lib/types';
import { periodeSekarang, labelPeriode, opsiPeriode } from '../lib/bulan';
import { formatRupiah } from '../lib/hitungInfaq';
import TabelPembayaran from '../components/TabelPembayaran';
import AppHeader from '../components/AppHeader';

const JUMLAH_LAINNYA = '__lainnya__';

export default function InputPembayaran() {
  const { session } = useAuth();

  const [bulan, setBulan] = useState(periodeSekarang());
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- Master data: nama & pilihan nominal ---
  const [daftarAnggota, setDaftarAnggota] = useState<Anggota[]>([]);
  const [daftarOpsiInfaq, setDaftarOpsiInfaq] = useState<OpsiInfaq[]>([]);

  const [namaPembayar, setNamaPembayar] = useState('');
  const [jumlahMode, setJumlahMode] = useState<'preset' | 'manual'>('preset');
  const [selectedOpsiId, setSelectedOpsiId] = useState('');
  const [jumlahManual, setJumlahManual] = useState('');

  const [showTambahNama, setShowTambahNama] = useState(false);
  const [namaBaru, setNamaBaru] = useState('');
  const [showTambahNominal, setShowTambahNominal] = useState(false);
  const [labelNominalBaru, setLabelNominalBaru] = useState('');
  const [nominalBaru, setNominalBaru] = useState('');

  const [data, setData] = useState<Pembayaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function fetchAnggota() {
    const { data: rows } = await supabase.from('anggota').select('*').order('nama');
    if (rows) setDaftarAnggota(rows as Anggota[]);
  }

  async function fetchOpsiInfaq() {
    const { data: rows } = await supabase.from('opsi_infaq').select('*').order('nominal');
    if (rows) setDaftarOpsiInfaq(rows as OpsiInfaq[]);
  }

  async function fetchData(periode: string) {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from('pembayaran')
      .select('*')
      .eq('bulan', periode)
      .order('created_at', { ascending: false });

    if (error) {
      setErrorMsg('Gagal memuat data pembayaran.');
    } else {
      setData(rows as Pembayaran[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchAnggota();
    fetchOpsiInfaq();
  }, []);

  useEffect(() => {
    fetchData(bulan);
    resetForm();
  }, [bulan]);

  function resetForm() {
    setEditingId(null);
    setNamaPembayar('');
    setJumlahMode('preset');
    setSelectedOpsiId('');
    setJumlahManual('');
    setShowTambahNama(false);
    setShowTambahNominal(false);
  }

  function startEdit(item: Pembayaran) {
    setEditingId(item.id);
    setNamaPembayar(item.nama_pembayar);

    const opsiCocok = daftarOpsiInfaq.find((o) => o.nominal === item.jumlah_bayar);
    if (opsiCocok) {
      setJumlahMode('preset');
      setSelectedOpsiId(opsiCocok.id);
    } else {
      setJumlahMode('manual');
      setJumlahManual(String(item.jumlah_bayar));
    }
  }

  function cancelEdit() {
    resetForm();
  }

  async function handleDelete(item: Pembayaran) {
    const konfirmasi = window.confirm(`Hapus pembayaran atas nama "${item.nama_pembayar}"?`);
    if (!konfirmasi) return;

    const { error } = await supabase.from('pembayaran').delete().eq('id', item.id);
    if (error) {
      setErrorMsg('Gagal menghapus data.');
      return;
    }
    fetchData(bulan);
  }

  async function tambahNamaBaru() {
    const nama = namaBaru.trim();
    if (!nama) return;

    const { data: row, error } = await supabase
      .from('anggota')
      .insert({ nama })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        setNamaPembayar(nama); // sudah ada, langsung pilih
      } else {
        setErrorMsg('Gagal menambah nama baru.');
        return;
      }
    } else {
      setNamaPembayar((row as Anggota).nama);
    }

    setNamaBaru('');
    setShowTambahNama(false);
    fetchAnggota();
  }

  async function tambahNominalBaru() {
    const nominal = Number(nominalBaru);
    if (!nominal || nominal <= 0) return;

    const label = labelNominalBaru.trim() || formatRupiah(nominal);

    const { data: row, error } = await supabase
      .from('opsi_infaq')
      .insert({ label, nominal })
      .select()
      .single();

    if (error) {
      setErrorMsg('Gagal menambah pilihan nominal baru.');
      return;
    }

    setJumlahMode('preset');
    setSelectedOpsiId((row as OpsiInfaq).id);
    setLabelNominalBaru('');
    setNominalBaru('');
    setShowTambahNominal(false);
    fetchOpsiInfaq();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const jumlah =
      jumlahMode === 'preset'
        ? daftarOpsiInfaq.find((o) => o.id === selectedOpsiId)?.nominal ?? 0
        : Number(jumlahManual);

    if (!namaPembayar.trim() || !jumlah || jumlah <= 0) {
      setErrorMsg('Nama dan jumlah bayar harus diisi dengan benar.');
      return;
    }

    setSaving(true);

    if (editingId) {
      const { error } = await supabase
        .from('pembayaran')
        .update({ nama_pembayar: namaPembayar.trim(), jumlah_bayar: jumlah })
        .eq('id', editingId);

      if (error) setErrorMsg('Gagal mengubah data.');
    } else {
      const { error } = await supabase.from('pembayaran').insert({
        nama_pembayar: namaPembayar.trim(),
        jumlah_bayar: jumlah,
        bulan,
        created_by: session?.user.id,
      });

      if (error) setErrorMsg('Gagal menyimpan data.');
    }

    setSaving(false);
    resetForm();
    fetchData(bulan);
  }

  // Kalau nama/nominal sedang diedit ternyata sudah tidak ada di master data
  // (mis. dihapus admin), tetap tampilkan sebagai opsi supaya tidak hilang dari select.
  const opsiNamaGabungan =
    namaPembayar && !daftarAnggota.some((a) => a.nama === namaPembayar)
      ? [...daftarAnggota, { id: 'current', nama: namaPembayar, created_at: '', created_by: null }]
      : daftarAnggota;

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-maroon-900">
      <AppHeader active="input" />

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <label htmlFor="periode" className="text-sm font-medium text-maroon-700 dark:text-cream-100/80">
            Periode
          </label>
          <select
            id="periode"
            value={bulan}
            onChange={(e) => setBulan(e.target.value)}
            className="rounded-full border border-maroon-200 bg-cream-50 px-4 py-2 text-sm text-maroon-900 focus:border-maroon-400 focus:outline-none focus:ring-1 focus:ring-maroon-300 dark:border-maroon-700 dark:bg-maroon-800 dark:text-cream-50"
          >
            {opsiPeriode(12).map((opsi) => (
              <option key={opsi.value} value={opsi.value}>
                {opsi.label}
              </option>
            ))}
          </select>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-3xl border border-maroon-200/60 bg-cream-50 p-5 shadow-sm dark:border-maroon-700/60 dark:bg-maroon-800 sm:p-6"
        >
          <h2 className="mb-4 font-display text-sm font-semibold text-maroon-900 dark:text-cream-50">
            {editingId ? 'Ubah Pembayaran' : `Tambah Pembayaran — ${labelPeriode(bulan)}`}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* --- Nama Pembayar (dropdown) --- */}
            <div>
              <label htmlFor="nama" className="mb-1.5 block text-sm font-medium text-maroon-700 dark:text-cream-100/80">
                Nama Pembayar
              </label>
              <select
                id="nama"
                value={namaPembayar}
                onChange={(e) => setNamaPembayar(e.target.value)}
                className="w-full rounded-full border border-maroon-200 bg-white px-4 py-2.5 text-sm text-maroon-900 focus:border-maroon-400 focus:outline-none focus:ring-1 focus:ring-maroon-300 dark:border-maroon-700 dark:bg-maroon-900 dark:text-cream-50"
              >
                <option value="" disabled>
                  {opsiNamaGabungan.length === 0 ? 'Belum ada nama — tambah dulu' : 'Pilih nama'}
                </option>
                {opsiNamaGabungan.map((a) => (
                  <option key={a.id} value={a.nama}>
                    {a.nama}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowTambahNama((v) => !v)}
                className="mt-1.5 text-xs font-medium text-lavender-600 hover:underline dark:text-lavender-200"
              >
                {showTambahNama ? 'Batal tambah nama' : '+ Tambah nama baru'}
              </button>

              {showTambahNama && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={namaBaru}
                    onChange={(e) => setNamaBaru(e.target.value)}
                    placeholder="Nama anggota baru"
                    className="flex-1 rounded-full border border-maroon-200 bg-white px-3 py-1.5 text-sm text-maroon-900 focus:border-maroon-400 focus:outline-none focus:ring-1 focus:ring-maroon-300 dark:border-maroon-700 dark:bg-maroon-900 dark:text-cream-50"
                  />
                  <button
                    type="button"
                    onClick={tambahNamaBaru}
                    className="shrink-0 rounded-full bg-maroon-800 px-3 py-1.5 text-xs font-medium text-cream-50 hover:bg-maroon-900 dark:bg-cream-100 dark:text-maroon-900"
                  >
                    Simpan
                  </button>
                </div>
              )}
            </div>

            {/* --- Jumlah Bayar (dropdown nominal) --- */}
            <div>
              <label htmlFor="jumlah" className="mb-1.5 block text-sm font-medium text-maroon-700 dark:text-cream-100/80">
                Jumlah Bayar
              </label>
              <select
                id="jumlah"
                value={jumlahMode === 'manual' ? JUMLAH_LAINNYA : selectedOpsiId}
                onChange={(e) => {
                  if (e.target.value === JUMLAH_LAINNYA) {
                    setJumlahMode('manual');
                  } else {
                    setJumlahMode('preset');
                    setSelectedOpsiId(e.target.value);
                  }
                }}
                className="w-full rounded-full border border-maroon-200 bg-white px-4 py-2.5 text-sm text-maroon-900 focus:border-maroon-400 focus:outline-none focus:ring-1 focus:ring-maroon-300 dark:border-maroon-700 dark:bg-maroon-900 dark:text-cream-50"
              >
                <option value="" disabled>
                  Pilih nominal
                </option>
                {daftarOpsiInfaq.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
                <option value={JUMLAH_LAINNYA}>Lainnya (isi manual)</option>
              </select>

              {jumlahMode === 'manual' && (
                <input
                  type="number"
                  min="0"
                  value={jumlahManual}
                  onChange={(e) => setJumlahManual(e.target.value)}
                  placeholder="Contoh: 17500"
                  className="mt-2 w-full rounded-full border border-maroon-200 bg-white px-4 py-2.5 text-sm text-maroon-900 focus:border-maroon-400 focus:outline-none focus:ring-1 focus:ring-maroon-300 dark:border-maroon-700 dark:bg-maroon-900 dark:text-cream-50"
                />
              )}

              <button
                type="button"
                onClick={() => setShowTambahNominal((v) => !v)}
                className="mt-1.5 text-xs font-medium text-lavender-600 hover:underline dark:text-lavender-200"
              >
                {showTambahNominal ? 'Batal tambah nominal' : '+ Tambah pilihan nominal'}
              </button>

              {showTambahNominal && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    type="text"
                    value={labelNominalBaru}
                    onChange={(e) => setLabelNominalBaru(e.target.value)}
                    placeholder="Label (opsional)"
                    className="min-w-0 flex-1 rounded-full border border-maroon-200 bg-white px-3 py-1.5 text-sm text-maroon-900 focus:border-maroon-400 focus:outline-none focus:ring-1 focus:ring-maroon-300 dark:border-maroon-700 dark:bg-maroon-900 dark:text-cream-50"
                  />
                  <input
                    type="number"
                    min="0"
                    value={nominalBaru}
                    onChange={(e) => setNominalBaru(e.target.value)}
                    placeholder="Nominal (Rp)"
                    className="w-32 rounded-full border border-maroon-200 bg-white px-3 py-1.5 text-sm text-maroon-900 focus:border-maroon-400 focus:outline-none focus:ring-1 focus:ring-maroon-300 dark:border-maroon-700 dark:bg-maroon-900 dark:text-cream-50"
                  />
                  <button
                    type="button"
                    onClick={tambahNominalBaru}
                    className="shrink-0 rounded-full bg-maroon-800 px-3 py-1.5 text-xs font-medium text-cream-50 hover:bg-maroon-900 dark:bg-cream-100 dark:text-maroon-900"
                  >
                    Simpan
                  </button>
                </div>
              )}
            </div>
          </div>

          {errorMsg && (
            <p className="mt-3 rounded-2xl bg-blush-100 px-4 py-3 text-sm text-blush-600 dark:bg-blush-600/20 dark:text-blush-200">
              {errorMsg}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-maroon-800 px-5 py-2.5 text-sm font-medium text-cream-50 transition hover:bg-maroon-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cream-100 dark:text-maroon-900 dark:hover:bg-white"
            >
              {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Simpan'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-full border border-maroon-200 px-5 py-2.5 text-sm font-medium text-maroon-600 hover:bg-maroon-100 dark:border-maroon-700 dark:text-cream-100/70 dark:hover:bg-maroon-800"
              >
                Batal
              </button>
            )}
          </div>
        </form>

        <h2 className="mb-3 font-display text-sm font-semibold text-maroon-900 dark:text-cream-50">
          Pembayaran {labelPeriode(bulan)}
        </h2>
        <TabelPembayaran data={data} loading={loading} onEdit={startEdit} onDelete={handleDelete} />
      </main>
    </div>
  );
}
