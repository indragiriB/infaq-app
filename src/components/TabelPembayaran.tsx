import type { Pembayaran } from '../lib/types';
import { formatRupiah } from '../lib/hitungInfaq';

interface TabelPembayaranProps {
  data: Pembayaran[];
  onEdit?: (item: Pembayaran) => void;
  onDelete?: (item: Pembayaran) => void;
  loading?: boolean;
}

export default function TabelPembayaran({
  data,
  onEdit,
  onDelete,
  loading,
}: TabelPembayaranProps) {
  const showActions = Boolean(onEdit || onDelete);

  if (loading) {
    return (
      <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
        Memuat data...
      </p>
    );
  }

  if (data.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
        Belum ada pembayaran untuk periode ini.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
      <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-300">
              Nama Pembayar
            </th>
            <th className="px-4 py-2 text-right font-medium text-slate-600 dark:text-slate-300">
              Jumlah Bayar
            </th>
            <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-300">
              Tanggal Input
            </th>
            {showActions && (
              <th className="px-4 py-2 text-right font-medium text-slate-600 dark:text-slate-300">
                Aksi
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
          {data.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-2 text-slate-800 dark:text-slate-100">
                {item.nama_pembayar}
              </td>
              <td className="px-4 py-2 text-right text-slate-800 dark:text-slate-100">
                {formatRupiah(item.jumlah_bayar)}
              </td>
              <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                {new Date(item.created_at).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </td>
              {showActions && (
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-3">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item)}
                        className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
