import { useEffect, useState } from 'react';
import type { Pembayaran } from '../lib/types';
import { formatRupiah } from '../lib/hitungInfaq';
import { namaAdmin, formatWaktu } from '../lib/adminProfiles';
import PaginationControls from './PaginationControls';

interface TabelPembayaranProps {
  data: Pembayaran[];
  onEdit?: (item: Pembayaran) => void;
  onDelete?: (item: Pembayaran) => void;
  loading?: boolean;
  adminMap?: Map<string, string>;
  pageSize?: number;
  resetKey?: string;
}

function inisial(nama: string): string {
  return nama.trim().slice(0, 1).toUpperCase() || '?';
}

export default function TabelPembayaran({
  data,
  onEdit,
  onDelete,
  loading,
  adminMap = new Map(),
  pageSize = 8,
  resetKey,
}: TabelPembayaranProps) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

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

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const halaman = Math.min(page, totalPages);
  const dataHalaman = data.slice((halaman - 1) * pageSize, halaman * pageSize);

  return (
    <div>
      <div className="overflow-hidden rounded-3xl border border-maroon-200/60 bg-cream-50 dark:border-maroon-700/60 dark:bg-maroon-800">
        <ul className="divide-y divide-maroon-100 dark:divide-maroon-700/60">
          {dataHalaman.map((item) => (
            <li key={item.id} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blush-200 font-display font-semibold text-maroon-700 dark:bg-blush-600/30 dark:text-cream-50">
                {inisial(item.nama_pembayar)}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-maroon-900 dark:text-cream-50">
                  {item.nama_pembayar}
                </p>
                <p className="text-xs text-maroon-400 dark:text-cream-100/40">
                  Diinput {namaAdmin(adminMap, item.created_by)} · {formatWaktu(item.created_at)}
                </p>
                {item.updated_at && (
                  <p className="text-xs text-maroon-400 dark:text-cream-100/40">
                    Diubah {namaAdmin(adminMap, item.updated_by)} · {formatWaktu(item.updated_at)}
                  </p>
                )}
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

      <PaginationControls
        page={halaman}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={data.length}
        pageSize={pageSize}
      />
    </div>
  );
}
