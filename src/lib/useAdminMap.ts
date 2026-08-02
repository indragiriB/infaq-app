import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import type { AdminProfile } from './types';
import { buatPetaAdmin } from './adminProfiles';

export function useAdminMap() {
  const [peta, setPeta] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    async function fetchAdmins() {
      const { data } = await supabase.from('admin_profiles').select('*');
      if (data) setPeta(buatPetaAdmin(data as AdminProfile[]));
    }
    fetchAdmins();
  }, []);

  return peta;
}
