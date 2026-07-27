import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import type { Pembayaran } from '../lib/types';
import { periodeSekarang, labelPeriode, opsiPeriode } from '../lib/bulan';
import TabelPembayaran from '../components/TabelPembayaran';
import ThemeToggle from '../components/ThemeToggle';

export default function InputPembayaran() {
  const { session } = useAuth();

  const [bulan, setBulan] = useState(periodeSekarang());
  const [namaPembayar, setNamaPembayar] = useState('');
  const [jumlahBayar, setJumlahBayar] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [data, setData] = useState<Pembayaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    fetchData(bulan);
    setEditingId(null);
    setNamaPembayar('');
    setJumlahBayar('');
  }, [bulan]);

  function startEdit(item: Pembayaran) {
    setEditingId(item.id);
    setNamaPembayar(item.nama_pembayar);
    setJumlahBayar(String(item.jumlah_bayar));
  }

  function cancelEdit() {
    setEditingId(null);
    setNamaPembayar('');
    setJumlahBayar('');
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const jumlah = Number(jumlahBayar);
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
    cancelEdit();
    fetchData(bulan);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Input Pembayaran</h1>
          <nav className="flex flex-wrap items-center gap-3 text-sm sm:gap-4">
            <Link to="/input" className="font-medium text-blue-600 dark:text-blue-400">
              Input
            </Link>
            <Link to="/rekap" className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100">
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

      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
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

        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5"
        >
          <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
            {editingId ? 'Ubah Pembayaran' : `Tambah Pembayaran — ${labelPeriode(bulan)}`}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nama" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Nama Pembayar
              </label>
              <input
                id="nama"
                type="text"
                value={namaPembayar}
                onChange={(e) => setNamaPembayar(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                placeholder="Contoh: Budi Santoso"
              />
            </div>

            <div>
              <label htmlFor="jumlah" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Jumlah Bayar (Rp)
              </label>
              <input
                id="jumlah"
                type="number"
                min="0"
                value={jumlahBayar}
                onChange={(e) => setJumlahBayar(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                placeholder="Contoh: 15000"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
              {errorMsg}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Simpan'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Batal
              </button>
            )}
          </div>
        </form>

        <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
          Pembayaran {labelPeriode(bulan)}
        </h2>
        <TabelPembayaran data={data} loading={loading} onEdit={startEdit} onDelete={handleDelete} />
      </main>
    </div>
  );
}
