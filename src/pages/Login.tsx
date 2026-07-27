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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="mb-1 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Rekap Infaq</h1>
          <ThemeToggle />
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Masuk untuk mengelola data infaq bulanan.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="nama@contoh.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="••••••••"
            />
          </div>

          {errorMsg && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
          Akun dibuat manual oleh admin lewat Supabase dashboard.
        </p>
      </div>
    </div>
  );
}
