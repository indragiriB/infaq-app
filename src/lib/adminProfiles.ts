import type { AdminProfile } from './types';

/** Bangun peta id -> nama dari daftar admin_profiles. */
export function buatPetaAdmin(profiles: AdminProfile[]): Map<string, string> {
  return new Map(profiles.map((p) => [p.id, p.nama]));
}

/** Ambil nama admin dari peta, fallback ke "Admin" kalau id null / belum ada nama. */
export function namaAdmin(peta: Map<string, string>, id: string | null | undefined): string {
  if (!id) return '—';
  return peta.get(id) ?? 'Admin (belum atur nama)';
}

/** Format singkat tanggal + jam, mis. "29 Jul 2026, 14:05". */
export function formatWaktu(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
