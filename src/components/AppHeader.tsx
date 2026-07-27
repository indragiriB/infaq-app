import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import ThemeToggle from './ThemeToggle';

interface AppHeaderProps {
  active: 'input' | 'rekap';
}

export default function AppHeader({ active }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z40 border-b border-maroon-200/60 bg-cream-50/90 backdrop-blur dark:border-maroon-700/60 dark:bg-maroon-900/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <h1 className="font-display text-lg font-bold tracking-tight text-maroon-900 dark:text-cream-50">
          Rekap Infaq
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex items-center gap-1 rounded-full bg-maroon-100/70 p-1 dark:bg-maroon-800">
            <Link
              to="/input"
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                active === 'input'
                  ? 'bg-maroon-800 text-cream-50 dark:bg-cream-100 dark:text-maroon-900'
                  : 'text-maroon-600 hover:text-maroon-900 dark:text-cream-100/70 dark:hover:text-cream-50'
              }`}
            >
              Input
            </Link>
            <Link
              to="/rekap"
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                active === 'rekap'
                  ? 'bg-maroon-800 text-cream-50 dark:bg-cream-100 dark:text-maroon-900'
                  : 'text-maroon-600 hover:text-maroon-900 dark:text-cream-100/70 dark:hover:text-cream-50'
              }`}
            >
              Rekap
            </Link>
          </nav>

          <ThemeToggle />

          <button
            onClick={() => supabase.auth.signOut()}
            className="rounded-full border border-maroon-200 px-3 py-1.5 text-sm font-medium text-maroon-600 transition hover:bg-maroon-100 dark:border-maroon-700 dark:text-cream-100/70 dark:hover:bg-maroon-800"
          >
            Keluar
          </button>
        </div>
      </div>
    </header>
  );
}
