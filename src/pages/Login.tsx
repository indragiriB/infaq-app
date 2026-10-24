import { useState, type FormEvent, type ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

const FITUR = [
  { label: 'Rekap infaq bulanan otomatis', warna: 'bg-blush-600' },
  { label: 'Pembagian Kelompok, Desa & Daerah transparan', warna: 'bg-lavender-200' },
  { label: 'Kas kelompok & laporan WhatsApp sekali klik', warna: 'bg-sand-200' },
];

function IconBadge({ size = 'h-6 w-6' }: { size?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={size}>
      <path d="M12 2c-1.2 2-3 3.6-3 6a3 3 0 0 0 6 0c0-2.4-1.8-4-3-6Z" fill="#D71921" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 21v-3a3 3 0 0 1 6 0v3" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

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

  const formFields: ReactNode = (
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
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-dots bg-cream-100 dark:bg-maroon-900">
      {/* ===== Layout mobile (< lg): hero penuh di atas + sheet form di bawah ===== */}
      <div className="flex min-h-screen flex-col lg:hidden">
        <div className="relative flex flex-[1.1] flex-col justify-center overflow-hidden bg-maroon-950 px-6 pb-14 pt-10 text-cream-50">

          <div className="relative flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cream-50/10">
              <IconBadge />
            </div>
            <ThemeToggle onDark />
          </div>

          <h1 className="relative mt-7 font-dot text-3xl font-bold leading-snug">
            Rekap Infaq
          </h1>
          <p className="relative mt-2 max-w-xs text-sm text-cream-100/70">
            Satu tempat buat catat, bagi, dan laporkan infaq komunitas — rapi tiap bulan,
            tanpa ribet Excel manual.
          </p>

          <ul className="relative mt-8 space-y-3">
            {FITUR.map((f) => (
              <li key={f.label} className="flex items-start gap-3 text-sm text-cream-100/80">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${f.warna}`} />
                {f.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 -mt-6 flex flex-1 flex-col justify-center rounded-t-4xl bg-cream-50 px-6 pb-8 pt-8 shadow-[0_-12px_30px_-8px_rgba(43,27,30,0.15)] dark:bg-maroon-800">
          <h2 className="font-dot text-lg font-bold text-maroon-900 dark:text-cream-50">
            Selamat datang kembali
          </h2>
          <p className="mt-1 text-sm text-maroon-500 dark:text-cream-100/50">
            Masuk untuk mengelola data infaq bulanan.
          </p>

          {formFields}

          <p className="mt-6 text-center text-xs text-maroon-400 dark:text-cream-100/40">
            Akun dibuat manual oleh admin lewat Supabase dashboard.
          </p>
        </div>
      </div>

      {/* ===== Layout desktop (lg+): card 2 kolom di tengah ===== */}
      <div className="relative hidden min-h-screen items-center justify-center p-6 lg:flex">

        <div className="grid w-full max-w-4xl overflow-hidden rounded-4xl border border-maroon-200 bg-cream-50/80 shadow-xl backdrop-blur-sm dark:border-maroon-700 dark:bg-maroon-800/80 lg:grid-cols-5">
          <div className="relative col-span-2 flex flex-col justify-between overflow-hidden bg-maroon-950 p-10 text-cream-50">

            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cream-50/10">
                <IconBadge />
              </div>
              <h1 className="mt-6 font-dot text-2xl font-bold leading-snug">Rekap Infaq</h1>
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

          <div className="col-span-3 flex flex-col justify-center p-10">
            <div className="mx-auto w-full max-w-sm">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="font-dot text-xl font-bold text-maroon-900 dark:text-cream-50">
                  Selamat datang kembali
                </h2>
                <ThemeToggle />
              </div>
              <p className="mt-1 text-sm text-maroon-500 dark:text-cream-100/50">
                Masuk untuk mengelola data infaq bulanan.
              </p>

              {formFields}

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
