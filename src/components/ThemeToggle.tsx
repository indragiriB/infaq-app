import { useDarkMode } from '../lib/useDarkMode';

interface ThemeToggleProps {
  /** Pakai gaya terang kalau tombol ditaruh di atas latar hitam (mis. hero Login). */
  onDark?: boolean;
}

export default function ThemeToggle({ onDark = false }: ThemeToggleProps) {
  const { isDark, toggle } = useDarkMode();

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium tracking-widest transition ${
        onDark
          ? 'border-cream-50/40 text-cream-50 hover:bg-cream-50/10'
          : 'border-maroon-200 text-maroon-600 hover:bg-maroon-100 dark:border-maroon-700 dark:text-cream-100/70 dark:hover:bg-maroon-800'
      }`}
    >
      {isDark ? 'LIGHT' : 'DARK'}
    </button>
  );
}
