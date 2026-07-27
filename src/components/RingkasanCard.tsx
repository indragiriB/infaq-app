interface RingkasanCardProps {
  label: string;
  value: string;
  hint?: string;
  accent?: 'dark' | 'cream' | 'blush' | 'lavender' | 'sand' | 'sage' | 'muted';
  size?: 'normal' | 'lg';
}

const accentStyles: Record<NonNullable<RingkasanCardProps['accent']>, string> = {
  dark: 'bg-maroon-900 text-cream-50 dark:bg-maroon-950',
  cream: 'bg-cream-50 text-maroon-900 border border-maroon-200/60 dark:bg-maroon-800 dark:text-cream-50 dark:border-maroon-700',
  blush: 'bg-blush-100 text-maroon-900 dark:bg-blush-600/20 dark:text-cream-50',
  lavender: 'bg-lavender-100 text-maroon-900 dark:bg-lavender-600/20 dark:text-cream-50',
  sand: 'bg-sand-100 text-maroon-900 dark:bg-sand-600/20 dark:text-cream-50',
  sage: 'bg-sage-100 text-maroon-900 dark:bg-sage-600/20 dark:text-cream-50',
  muted: 'bg-maroon-50 text-maroon-900 border border-maroon-200/60 dark:bg-maroon-800/60 dark:text-cream-50 dark:border-maroon-700',
};

export default function RingkasanCard({
  label,
  value,
  hint,
  accent = 'cream',
  size = 'normal',
}: RingkasanCardProps) {
  const isDarkAccent = accent === 'dark';

  return (
    <div
      className={`min-w-0 rounded-3xl p-5 shadow-sm sm:p-6 ${accentStyles[accent]} ${
        size === 'lg' ? 'py-7 sm:py-8' : ''
      }`}
    >
      <p
        className={`text-xs font-medium uppercase tracking-wide ${
          isDarkAccent ? 'text-cream-50/60' : 'text-maroon-500 dark:text-cream-100/50'
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-2 break-words font-display font-bold leading-tight ${
          size === 'lg' ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'
        }`}
      >
        {value}
      </p>
      {hint && (
        <p
          className={`mt-1 text-xs ${
            isDarkAccent ? 'text-cream-50/50' : 'text-maroon-400 dark:text-cream-100/40'
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
