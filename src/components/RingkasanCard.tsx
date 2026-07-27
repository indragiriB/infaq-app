interface RingkasanCardProps {
  label: string;
  value: string;
  hint?: string;
  accent?: 'default' | 'positive' | 'muted';
}

const accentStyles: Record<NonNullable<RingkasanCardProps['accent']>, string> = {
  default: 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800',
  positive:
    'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950',
  muted: 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60',
};

export default function RingkasanCard({
  label,
  value,
  hint,
  accent = 'default',
}: RingkasanCardProps) {
  return (
    <div className={`rounded-xl border p-3 shadow-sm sm:p-4 ${accentStyles[accent]}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-50 sm:text-2xl">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  );
}
