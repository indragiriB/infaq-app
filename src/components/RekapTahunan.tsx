import { formatRupiah } from '../lib/hitungInfaq';

export interface BarisRekapTahunan {
  nama: string;
  bulanTerisi: Record<number, number>; // 1-12 -> total jumlah_bayar bulan itu
  total: number;
}

interface RekapTahunanProps {
  tahun: number;
  onTahunChange: (tahun: number) => void;
  data: BarisRekapTahunan[];
  totalPerBulan: Record<number, number>;
  loading?: boolean;
}

const NAMA_BULAN_SINGKAT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

// Warna bergilir per kolom bulan, supaya pola bayar (langsung 12 bulan di
// Januari vs bayar sporadis) langsung kelihatan dari sebaran warnanya.
const WARNA_BULAN = [
  { header: 'bg-blush-200 dark:bg-blush-600/30 text-maroon-700 dark:text-cream-50', cell: 'bg-blush-100 dark:bg-blush-600/20' },
  { header: 'bg-lavender-200 dark:bg-lavender-600/30 text-maroon-700 dark:text-cream-50', cell: 'bg-lavender-100 dark:bg-lavender-600/20' },
  { header: 'bg-sand-200 dark:bg-sand-600/30 text-maroon-700 dark:text-cream-50', cell: 'bg-sand-100 dark:bg-sand-600/20' },
  { header: 'bg-sage-200 dark:bg-sage-600/30 text-maroon-700 dark:text-cream-50', cell: 'bg-sage-100 dark:bg-sage-600/20' },
];

export default function RekapTahunan({
  tahun,
  onTahunChange,
  data,
  totalPerBulan,
  loading,
}: RekapTahunanProps) {
  return (
    <div className="rounded-3xl border border-maroon-200/60 bg-cream-50 p-4 shadow-sm dark:border-maroon-700/60 dark:bg-maroon-800 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-sm font-semibold text-maroon-900 dark:text-cream-50">
            Rekap Tahunan per Pembayar
          </h2>
          <p className="text-xs text-maroon-400 dark:text-cream-100/40">
            Warna tiap kolom mewakili bulan — baris penuh warna berarti bayar langsung 12 bulan,
            baris berselang berarti bayar sporadis.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-maroon-100/70 px-1 py-1 dark:bg-maroon-900/60">
          <button
            onClick={() => onTahunChange(tahun - 1)}
            className="rounded-full px-2.5 py-1 text-sm text-maroon-600 hover:bg-cream-50 dark:text-cream-100/70 dark:hover:bg-maroon-800"
            aria-label="Tahun sebelumnya"
          >
            ‹
          </button>
          <span className="min-w-[3.5rem] text-center font-display text-sm font-semibold text-maroon-900 dark:text-cream-50">
            {tahun}
          </span>
          <button
            onClick={() => onTahunChange(tahun + 1)}
            className="rounded-full px-2.5 py-1 text-sm text-maroon-600 hover:bg-cream-50 dark:text-cream-100/70 dark:hover:bg-maroon-800"
            aria-label="Tahun berikutnya"
          >
            ›
          </button>
        </div>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-maroon-400 dark:text-cream-100/40">Memuat data...</p>
      ) : data.length === 0 ? (
        <p className="py-8 text-center text-sm text-maroon-400 dark:text-cream-100/40">
          Belum ada data pembayaran di tahun {tahun}.
        </p>
      ) : (
        <div className="scrollbar-thin overflow-x-auto rounded-2xl">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-[1] rounded-tl-2xl bg-maroon-50 px-3 py-2 text-left text-xs font-medium text-maroon-500 dark:bg-maroon-900 dark:text-cream-100/60">
                  Nama Pembayar
                </th>
                {NAMA_BULAN_SINGKAT.map((label, i) => (
                  <th
                    key={label}
                    className={`min-w-[3.25rem] px-2 py-2 text-center text-xs font-semibold ${WARNA_BULAN[i % 4].header}`}
                  >
                    {label}
                  </th>
                ))}
                <th className="rounded-tr-2xl bg-maroon-50 px-3 py-2 text-right text-xs font-medium text-maroon-500 dark:bg-maroon-900 dark:text-cream-100/60">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((baris, idx) => (
                <tr key={baris.nama}>
                  <td
                    className={`sticky left-0 z-[1] whitespace-nowrap bg-cream-50 px-3 py-2.5 font-medium text-maroon-900 dark:bg-maroon-800 dark:text-cream-50 ${
                      idx === data.length - 1 ? 'rounded-bl-2xl' : ''
                    }`}
                  >
                    {baris.nama}
                  </td>
                  {NAMA_BULAN_SINGKAT.map((_, i) => {
                    const bulanKe = i + 1;
                    const jumlah = baris.bulanTerisi[bulanKe];
                    const sudahBayar = jumlah !== undefined;
                    return (
                      <td key={bulanKe} className="px-2 py-2.5 text-center">
                        <span
                          title={sudahBayar ? formatRupiah(jumlah) : 'Belum bayar'}
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                            sudahBayar
                              ? `${WARNA_BULAN[i % 4].cell} font-semibold text-maroon-700 dark:text-cream-50`
                              : 'border border-dashed border-maroon-200 text-maroon-200 dark:border-maroon-700 dark:text-maroon-700'
                          }`}
                        >
                          {sudahBayar ? '✓' : '·'}
                        </span>
                      </td>
                    );
                  })}
                  <td
                    className={`whitespace-nowrap bg-cream-50 px-3 py-2.5 text-right font-display font-semibold text-maroon-900 dark:bg-maroon-800 dark:text-cream-50 ${
                      idx === data.length - 1 ? 'rounded-br-2xl' : ''
                    }`}
                  >
                    {formatRupiah(baris.total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="rounded-bl-2xl bg-maroon-50 px-3 py-2 text-xs font-medium text-maroon-500 dark:bg-maroon-900 dark:text-cream-100/60">
                  Total / bulan
                </td>
                {NAMA_BULAN_SINGKAT.map((_, i) => {
                  const bulanKe = i + 1;
                  return (
                    <td
                      key={bulanKe}
                      className="bg-maroon-50 px-2 py-2 text-center text-xs font-semibold text-maroon-600 dark:bg-maroon-900 dark:text-cream-100/70"
                    >
                      {totalPerBulan[bulanKe] ? formatRupiah(totalPerBulan[bulanKe]).replace('Rp', '') : '-'}
                    </td>
                  );
                })}
                <td className="rounded-br-2xl bg-maroon-50 px-3 py-2 text-right text-xs font-medium text-maroon-500 dark:bg-maroon-900 dark:text-cream-100/60" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
