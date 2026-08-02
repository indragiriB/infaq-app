import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';

export default function AdminNameGate({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [checking, setChecking] = useState(true);
  const [namaTerdaftar, setNamaTerdaftar] = useState<string | null>(null);
  const [nama, setNama] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function cekProfil() {
      if (!session) return;
      const { data } = await supabase
        .from('admin_profiles')
        .select('nama')
        .eq('id', session.user.id)
        .maybeSingle();

      setNamaTerdaftar(data?.nama ?? null);
      setChecking(false);
    }
    cekProfil();
  }, [session]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!session || !nama.trim()) return;

    setSaving(true);
    setErrorMsg(null);

    const { error } = await supabase
      .from('admin_profiles')
      .upsert({ id: session.user.id, nama: nama.trim() });

    setSaving(false);

    if (error) {
      setErrorMsg('Gagal menyimpan nama, coba lagi.');
      return;
    }
    setNamaTerdaftar(nama.trim());
  }

  if (checking) return null;

  if (!namaTerdaftar) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-100 px-4 dark:bg-maroon-900">
        <div className="w-full max-w-sm rounded-4xl border border-maroon-200/60 bg-cream-50 p-6 shadow-sm dark:border-maroon-700/60 dark:bg-maroon-800 sm:p-8">
          <h1 className="font-display text-lg font-bold text-maroon-900 dark:text-cream-50">
            Siapa nama kamu?
          </h1>
          <p className="mt-1 text-sm text-maroon-500 dark:text-cream-100/50">
            Nama ini bakal ditampilkan tiap kamu nambah/ubah/hapus data, biar jelas siapa yang
            melakukan apa. Cukup diisi sekali.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama kamu"
              autoFocus
              className="w-full rounded-full border border-maroon-200 bg-white px-4 py-2.5 text-sm text-maroon-900 focus:border-maroon-400 focus:outline-none focus:ring-1 focus:ring-maroon-300 dark:border-maroon-700 dark:bg-maroon-900 dark:text-cream-50"
            />

            {errorMsg && (
              <p className="rounded-2xl bg-blush-100 px-4 py-3 text-sm text-blush-600 dark:bg-blush-600/20 dark:text-blush-200">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={saving || !nama.trim()}
              className="w-full rounded-full bg-maroon-800 px-4 py-2.5 text-sm font-medium text-cream-50 transition hover:bg-maroon-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cream-100 dark:text-maroon-900 dark:hover:bg-white"
            >
              {saving ? 'Menyimpan...' : 'Simpan & Lanjut'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
