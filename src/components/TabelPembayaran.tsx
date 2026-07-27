import type { Pembayaran } from '../lib/types';
import { formatRupiah } from '../lib/hitungInfaq';

interface TabelPembayaranProps {
  data: Pembayaran[];
  onEdit?: (item: Pembayaran) => void;
  onDelete?: (item: Pembayaran) => void;
  loading?: boolean;
}

function inisial(nama: string): string {
  return nama.trim().slice(0, 1).toUpperCase() || '?';
}

export default function TabelPembayaran({
  data,
  onEdit,
  onDelete,
  loading,
}: TabelPembayaranProps) {
  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-maroon-400 dark:text-cream-100/40">
        Memuat data...
      </p>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-maroon-200 py-8 text-center text-sm text-maroon-400 dark:border-maroon-700 dark:text-cream-100/40">
        Belum ada pembayaran untuk periode ini.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-maroon-200/60 bg-cream-50 dark:border-maroon-700/60 dark:bg-maroon-800">
      <ul className="divide-y divide-maroon-100 dark:divide-maroon-700/60">
        {data.map((item) => (
          <li key={item.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blush-200 font-display font-semibold text-maroon-700 dark:bg-blush-600/30 dark:text-cream-50">
              {inisial(item.nama_pembayar)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-maroon-900 dark:text-cream-50">
                {item.nama_pembayar}
              </p>
              <p className="text-xs text-maroon-400 dark:text-cream-100/40">
                {new Date(item.created_at).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="whitespace-nowrap font-display font-semibold text-maroon-900 dark:text-cream-50">
                {formatRupiah(item.jumlah_bayar)}
              </span>
              {(onEdit || onDelete) && (
                <div className="flex gap-3">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(item)}
                      className="text-xs font-medium text-lavender-600 hover:underline dark:text-lavender-200"
                    >
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(item)}
                      className="text-xs font-medium text-blush-600 hover:underline dark:text-blush-200"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
