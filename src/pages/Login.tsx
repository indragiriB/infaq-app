import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

const FITUR = [
  { label: 'Rekap infaq bulanan otomatis', warna: 'bg-blush-200' },
  { label: 'Pembagian Kelompok, Desa & Daerah transparan', warna: 'bg-lavender-200' },
  { label: 'Kas kelompok & laporan WhatsApp sekali klik', warna: 'bg-sand-200' },
];

export default function Login() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!loading && session) {
    return <Navigate to="/rekap" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setSubmitting(false);

    if (error) {
      setErrorMsg('Email atau password salah.');
      return;
    }

    navigate('/rekap');
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream-100 dark:bg-maroon-900">
      {/* Dekorasi lingkaran blur di background */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blush-200 opacity-50 blur-3xl dark:opacity-20" />
      <div className="pointer-events-none absolute -right-16 top-1/3 h-80 w-80 rounded-full bg-lavender-200 opacity-50 blur-3xl dark:opacity-20" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-sand-200 opacity-40 blur-3xl dark:opacity-10" />

      <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-6">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-4xl border border-maroon-200/60 bg-cream-50/80 shadow-xl backdrop-blur-sm dark:border-maroon-700/60 dark:bg-maroon-800/80 lg:grid-cols-5">
          {/* Panel kiri — dekoratif, cuma tampil di layar lebar */}
          <div className="relative hidden overflow-hidden bg-gradient-to-br from-maroon-800 to-maroon-950 p-10 text-cream-50 lg:col-span-2 lg:flex lg:flex-col lg:justify-between">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blush-600/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-sand-600/20 blur-2xl" />

            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cream-50/10">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                  <path
                    d="M12 2c-1.2 2-3 3.6-3 6a3 3 0 0 0 6 0c0-2.4-1.8-4-3-6Z"
                    fill="#F3C9D3"
                  />
                  <path
                    d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"
                    stroke="#FBF3EC"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M9 21v-3a3 3 0 0 1 6 0v3"
                    stroke="#FBF3EC"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h1 className="mt-6 font-display text-2xl font-bold leading-snug">
                Rekap Infaq
              </h1>
              <p className="mt-2 text-sm text-cream-100/70">
                Satu tempat buat catat, bagi, dan laporkan infaq komunitas — rapi tiap bulan,
                tanpa ribet Excel manual.
              </p>
            </div>

            <ul className="relative mt-10 space-y-3">
              {FITUR.map((f) => (
                <li key={f.label} className="flex items-start gap-3 text-sm text-cream-100/80">
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${f.warna}`} />
                  {f.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Panel kanan — form login */}
          <div className="p-6 sm:p-10 lg:col-span-3 lg:flex lg:flex-col lg:justify-center">
            <div className="mx-auto w-full max-w-sm">
              <div className="mb-6 flex items-center justify-between lg:hidden">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-maroon-800 dark:bg-cream-100">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                      <path d="M12 2c-1.2 2-3 3.6-3 6a3 3 0 0 0 6 0c0-2.4-1.8-4-3-6Z" fill="#F3C9D3" />
                      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#FBF3EC" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </div>
                  <h1 className="font-display text-lg font-bold text-maroon-900 dark:text-cream-50">
                    Rekap Infaq
                  </h1>
                </div>
                <ThemeToggle />
              </div>

              <div className="mb-1 hidden items-center justify-between lg:flex">
                <h2 className="font-display text-xl font-bold text-maroon-900 dark:text-cream-50">
                  Selamat datang kembali
                </h2>
                <ThemeToggle />
              </div>
              <p className="mt-1 text-sm text-maroon-500 dark:text-cream-100/50">
                Masuk untuk mengelola data infaq bulanan.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-maroon-700 dark:text-cream-100/80">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-full border border-maroon-200 bg-white px-4 py-2.5 text-sm text-maroon-900 focus:border-maroon-400 focus:outline-none focus:ring-1 focus:ring-maroon-300 dark:border-maroon-700 dark:bg-maroon-900 dark:text-cream-50"
                    placeholder="nama@contoh.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-maroon-700 dark:text-cream-100/80">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-full border border-maroon-200 bg-white px-4 py-2.5 text-sm text-maroon-900 focus:border-maroon-400 focus:outline-none focus:ring-1 focus:ring-maroon-300 dark:border-maroon-700 dark:bg-maroon-900 dark:text-cream-50"
                    placeholder="••••••••"
                  />
                </div>

                {errorMsg && (
                  <p className="rounded-2xl bg-blush-100 px-4 py-3 text-sm text-blush-600 dark:bg-blush-600/20 dark:text-blush-200">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-maroon-800 px-4 py-2.5 text-sm font-medium text-cream-50 shadow-sm transition hover:bg-maroon-900 hover:shadow disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cream-100 dark:text-maroon-900 dark:hover:bg-white"
                >
                  {submitting ? 'Memproses...' : 'Masuk'}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-maroon-400 dark:text-cream-100/40">
                Akun dibuat manual oleh admin lewat Supabase dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
