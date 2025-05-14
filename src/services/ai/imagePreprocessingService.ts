/**
 * Image Preprocessing Service
 * 
 * Handles image preprocessing to improve OCR results.
 * Includes functions for noise reduction, contrast enhancement, and skew correction.
 */
import sharp from 'sharp';

export interface PreprocessingOptions {
  grayscale?: boolean;
  normalize?: boolean;
  threshold?: boolean;
  thresholdValue?: number;
  sharpen?: boolean;
  removeNoise?: boolean;
  deskew?: boolean;
}

export class ImagePreprocessor {
  /**
   * Preprocess an image for better OCR results
   */
  async preprocess(
    imageBuffer: Buffer,
    options: PreprocessingOptions = {
      grayscale: true,
      normalize: true,
      threshold: true,
      thresholdValue: 128,
      sharpen: true,
      removeNoise: true,
      deskew: false, // Deskew is more complex and may require additional libraries
    }
  ): Promise<Buffer> {
    try {
      let image = sharp(imageBuffer);
      
      // Convert to grayscale
      if (options.grayscale) {
        image = image.grayscale();
      }
      
      // Normalize the image (stretch histogram)
      if (options.normalize) {
        image = image.normalize();
      }
      
      // Apply threshold to create binary image
      if (options.threshold) {
        image = image.threshold(options.thresholdValue || 128);
      }
      
      // Sharpen the image
      if (options.sharpen) {
        image = image.sharpen();
      }
      
      // Remove noise (median filter)
      if (options.removeNoise) {
        image = image.median(3); // 3x3 median filter
      }
      
      // Deskew the image (correct rotation)
      if (options.deskew) {
        // This is a placeholder for deskew functionality
        // In a real implementation, you would:
        // 1. Detect the skew angle
        // 2. Rotate the image to correct the skew
        console.warn('Deskew functionality not implemented');
      }
      
      // Process the image and return the buffer
      return await image.toBuffer();
    } catch (error) {
      console.error('Error preprocessing image:', error);
      throw new Error('Image preprocessing failed');
    }
  }
  
  /**
   * Enhance contrast in an image
   */
  async enhanceContrast(imageBuffer: Buffer, factor: number = 1.5): Promise<Buffer> {
    try {
      const image = sharp(imageBuffer)
        .linear(factor, -(128 * factor) + 128); // Adjust contrast
      
      return await image.toBuffer();
    } catch (error) {
      console.error('Error enhancing contrast:', error);
      throw new Error('Contrast enhancement failed');
    }
  }
  
  /**
   * Resize an image to a specific width while maintaining aspect ratio
   */
  async resize(imageBuffer: Buffer, width: number): Promise<Buffer> {
    try {
      const image = sharp(imageBuffer)
        .resize(width, null, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      
      return await image.toBuffer();
    } catch (error) {
      console.error('Error resizing image:', error);
      throw new Error('Image resizing failed');
    }
  }
  
  /**
   * Crop an image to a specific region
   */
  async crop(
    imageBuffer: Buffer,
    left: number,
    top: number,
    width: number,
    height: number
  ): Promise<Buffer> {
    try {
      const image = sharp(imageBuffer)
        .extract({ left, top, width, height });
      
      return await image.toBuffer();
    } catch (error) {
      console.error('Error cropping image:', error);
      throw new Error('Image cropping failed');
    }
  }
}

export default new ImagePreprocessor();
