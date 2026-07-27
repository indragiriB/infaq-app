import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import type { Pembayaran } from '../lib/types';
import { periodeSekarang, labelPeriode, opsiPeriode } from '../lib/bulan';
import TabelPembayaran from '../components/TabelPembayaran';
import AppHeader from '../components/AppHeader';

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
            <div>
              <label htmlFor="nama" className="mb-1.5 block text-sm font-medium text-maroon-700 dark:text-cream-100/80">
                Nama Pembayar
              </label>
              <input
                id="nama"
                type="text"
                value={namaPembayar}
                onChange={(e) => setNamaPembayar(e.target.value)}
                className="w-full rounded-full border border-maroon-200 bg-white px-4 py-2.5 text-sm text-maroon-900 focus:border-maroon-400 focus:outline-none focus:ring-1 focus:ring-maroon-300 dark:border-maroon-700 dark:bg-maroon-900 dark:text-cream-50"
                placeholder="Contoh: Budi Santoso"
              />
            </div>

            <div>
              <label htmlFor="jumlah" className="mb-1.5 block text-sm font-medium text-maroon-700 dark:text-cream-100/80">
                Jumlah Bayar (Rp)
              </label>
              <input
                id="jumlah"
                type="number"
                min="0"
                value={jumlahBayar}
                onChange={(e) => setJumlahBayar(e.target.value)}
                className="w-full rounded-full border border-maroon-200 bg-white px-4 py-2.5 text-sm text-maroon-900 focus:border-maroon-400 focus:outline-none focus:ring-1 focus:ring-maroon-300 dark:border-maroon-700 dark:bg-maroon-900 dark:text-cream-50"
                placeholder="Contoh: 15000"
              />
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
