/**
 * Supabase connection tests
 */
import supabase, { checkSupabaseConnection, getStorageBucketUrl } from '@/lib/supabase';
import config from '@/lib/config';

describe('Supabase Connection', () => {
  test('should connect to Supabase successfully', async () => {
    // Check connection
    const connected = await checkSupabaseConnection();
    
    // Assert
    expect(connected).toBe(true);
  });

  test('should have valid storage bucket URL', () => {
    // Get storage bucket URL
    const bucketUrl = getStorageBucketUrl();
    
    // Assert
    expect(bucketUrl).toContain(config.supabase.url);
    expect(bucketUrl).toContain(config.supabase.storageBucket);
  });

  test('should use the correct Supabase configuration', () => {
    // Assert that we have valid Supabase configuration
    expect(config.supabase.url).toBeDefined();
    expect(config.supabase.key).toBeDefined();
    expect(config.supabase.storageBucket).toBe('documents');
  });
});
