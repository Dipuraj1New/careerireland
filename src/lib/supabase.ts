import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from './config';

// Create Supabase client
const supabaseUrl = config.supabase.url;
const supabaseKey = config.supabase.key;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
}

/**
 * Supabase client instance
 */
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
  },
});

/**
 * Check Supabase connection
 * @returns True if connected, false otherwise
 */
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    // Simple query to check connection
    const { error } = await supabase.from('migrations').select('id').limit(1);
    return !error;
  } catch (error) {
    console.error('Supabase connection check failed:', error);
    return false;
  }
};

/**
 * Get storage bucket URL for documents
 * @returns Storage bucket URL
 */
export const getStorageBucketUrl = (): string => {
  return `${supabaseUrl}/storage/v1/object/public/${config.supabase.storageBucket}`;
};

export default supabase;
