import { useDarkMode } from '../lib/useDarkMode';

export default function ThemeToggle() {
  const { isDark, toggle } = useDarkMode();

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
      className="rounded-full border border-maroon-200 px-3 py-1.5 text-sm text-maroon-600 transition hover:bg-maroon-100 dark:border-maroon-700 dark:text-cream-100/70 dark:hover:bg-maroon-800"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
