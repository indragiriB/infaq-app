import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

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
    <div className="flex min-h-screen items-center justify-center bg-cream-100 px-4 dark:bg-maroon-900">
      <div className="w-full max-w-sm rounded-4xl border border-maroon-200/60 bg-cream-50 p-6 shadow-sm dark:border-maroon-700/60 dark:bg-maroon-800 sm:p-8">
        <div className="mb-1 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold tracking-tight text-maroon-900 dark:text-cream-50">
            Rekap Infaq
          </h1>
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
            className="w-full rounded-full bg-maroon-800 px-4 py-2.5 text-sm font-medium text-cream-50 transition hover:bg-maroon-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cream-100 dark:text-maroon-900 dark:hover:bg-white"
          >
            {submitting ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-maroon-400 dark:text-cream-100/40">
          Akun dibuat manual oleh admin lewat Supabase dashboard.
        </p>
      </div>
    </div>
  );
}
