import { v4 as uuidv4 } from 'uuid';
import supabase from '@/lib/supabase';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/types/document';

// Supabase storage bucket for documents
const DOCUMENTS_BUCKET = 'documents';

/**
 * Initialize storage buckets
 */
export async function initializeStorage(): Promise<void> {
  try {
    // Check if bucket exists, create if not
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === DOCUMENTS_BUCKET);
    
    if (!bucketExists) {
      await supabase.storage.createBucket(DOCUMENTS_BUCKET, {
        public: false,
        fileSizeLimit: MAX_FILE_SIZE,
      });
      console.log(`Created storage bucket: ${DOCUMENTS_BUCKET}`);
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
    throw new Error('Failed to initialize storage');
  }
}

/**
 * Upload file to storage
 */
export async function uploadFile(
  file: File,
  caseId: string,
  userId: string
): Promise<{ filePath: string; fileSize: number }> {
  try {
    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }
    
    // Generate unique file path
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `${caseId}/${uniqueFileName}`;
    
    // Upload file to Supabase
    const { error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
    
    return {
      filePath,
      fileSize: file.size,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Get file download URL
 */
export async function getFileUrl(filePath: string): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(filePath, 60 * 60); // 1 hour expiry
    
    if (error || !data?.signedUrl) {
      throw new Error(`Failed to get file URL: ${error?.message}`);
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw error;
  }
}

/**
 * Delete file from storage
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .remove([filePath]);
    
    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}
