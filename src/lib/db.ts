import type { Confession } from './types';
import { createServiceRoleServerClient } from './supabase/server';
import { cookies } from 'next/headers';


export async function isUserBanned(anonHash: string): Promise<boolean> {
    const cookieStore = cookies();
    const supabase = createServiceRoleServerClient(cookieStore);
    const { data, error } = await supabase
      .from('banned_users')
      .select('anon_hash')
      .eq('anon_hash', anonHash)
      .single();
  
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking if user is banned:', error);
      // Fail open to avoid blocking users due to db errors
      return false;
    }
  
    return !!data;
}
