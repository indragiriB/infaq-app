import { useDarkMode } from '../lib/useDarkMode';

export default function ThemeToggle() {
  const { isDark, toggle } = useDarkMode();

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
      className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
