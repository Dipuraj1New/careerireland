/**
 * Storage Service
 *
 * Handles file storage operations using Supabase Storage.
 * Provides methods for uploading, downloading, and managing files.
 */
import { createClient } from '@supabase/supabase-js';
import config from '@/lib/config';

// Initialize Supabase client
const supabase = createClient(
  config.supabase?.url || '',
  config.supabase?.key || ''
);

/**
 * Upload a file to storage
 */
export async function uploadFile(
  fileData: Buffer | File | Blob,
  filePath: string,
  contentType?: string,
  userId?: string
) {
  try {
    // Ensure the bucket exists
    const bucketName = 'documents';

    // Upload the file
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileData, {
        contentType,
        upsert: true,
        cacheControl: '3600',
      });

    if (error) {
      throw new Error(`Error uploading file: ${error.message}`);
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return {
      path: data.path,
      url: urlData.publicUrl,
      userId,
    };
  } catch (error) {
    console.error('Error in uploadFile:', error);
    throw error;
  }
}

/**
 * Download a file from storage
 */
export async function downloadFile(filePath: string) {
  try {
    const bucketName = 'documents';

    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);

    if (error) {
      throw new Error(`Error downloading file: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in downloadFile:', error);
    throw error;
  }
}

/**
 * Get a file from storage (alias for downloadFile for backward compatibility)
 */
export async function getFileFromStorage(filePath: string) {
  return downloadFile(filePath);
}

/**
 * Delete a file from storage
 */
export async function deleteFile(filePath: string) {
  try {
    const bucketName = 'documents';

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      throw new Error(`Error deleting file: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Error in deleteFile:', error);
    throw error;
  }
}

/**
 * List files in a directory
 */
export async function listFiles(directoryPath: string) {
  try {
    const bucketName = 'documents';

    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(directoryPath);

    if (error) {
      throw new Error(`Error listing files: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in listFiles:', error);
    throw error;
  }
}

/**
 * Get a signed URL for a file
 */
export async function getSignedUrl(filePath: string, expiresIn = 60) {
  try {
    const bucketName = 'documents';

    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(`Error creating signed URL: ${error.message}`);
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error in getSignedUrl:', error);
    throw error;
  }
}

/**
 * Get a public URL for a file
 */
export function getPublicUrl(filePath: string) {
  const bucketName = 'documents';

  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export default {
  uploadFile,
  downloadFile,
  getFileFromStorage,
  deleteFile,
  listFiles,
  getSignedUrl,
  getPublicUrl,
};
