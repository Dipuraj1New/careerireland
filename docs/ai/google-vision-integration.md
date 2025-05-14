# Google Vision API Integration

This document provides information about the Google Vision API integration in the Career Ireland Immigration SaaS platform.

## Overview

The platform uses Google Vision API for Optical Character Recognition (OCR) to extract text from document images. This provides better accuracy than the default Tesseract.js OCR engine, especially for low-quality or complex documents.

## Configuration

The Google Vision API integration can be configured using environment variables:

```
# AI
OCR_PROVIDER=google-vision
GOOGLE_VISION_KEY_FILENAME=path/to/your-google-vision-key.json
# GOOGLE_VISION_CREDENTIALS={"type":"service_account","project_id":"your-project-id",...}
```

### Configuration Options

- `OCR_PROVIDER`: Set to `google-vision` to use Google Vision API for OCR. Default is `tesseract`.
- `GOOGLE_VISION_KEY_FILENAME`: Path to the Google Cloud service account key file.
- `GOOGLE_VISION_CREDENTIALS`: JSON string of the Google Cloud service account credentials. Use this if you don't want to store the key file on disk.

## Setup Instructions

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Vision API for your project

### 2. Create a Service Account

1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Enter a name and description for the service account
4. Grant the "Cloud Vision API User" role to the service account
5. Click "Create Key" and select JSON format
6. Save the key file securely

### 3. Configure the Application

#### Option 1: Using a Key File

1. Save the service account key file to a secure location
2. Set the following environment variables:
   ```
   OCR_PROVIDER=google-vision
   GOOGLE_VISION_KEY_FILENAME=path/to/your-google-vision-key.json
   ```

#### Option 2: Using Credentials JSON

1. Set the following environment variables:
   ```
   OCR_PROVIDER=google-vision
   GOOGLE_VISION_CREDENTIALS={"type":"service_account","project_id":"your-project-id",...}
   ```

## Usage

The OCR service will automatically use Google Vision API if configured. If Google Vision API fails for any reason, the service will fall back to Tesseract.js.

```typescript
import ocrService from '@/services/ai/ocrService';

// Extract text from an image
const imageBuffer = fs.readFileSync('path/to/image.jpg');
const result = await ocrService.extractText(imageBuffer);

console.log(result.text); // Extracted text
console.log(result.confidence); // Confidence score
```

## Testing

The OCR service includes tests for both Tesseract.js and Google Vision API integration. You can run the tests using:

```
npm run test:unit -- --testPathPattern=services/ai/ocrService
```

## Troubleshooting

### Authentication Issues

If you encounter authentication issues, check the following:

1. Make sure the service account key file exists and is readable
2. Verify that the service account has the "Cloud Vision API User" role
3. Check that the project has the Vision API enabled
4. Ensure that billing is enabled for the project

### Performance Issues

If OCR performance is slow:

1. Consider optimizing images before processing (resize, convert to grayscale, etc.)
2. Use the image preprocessing options provided by the OCR service
3. Consider batching requests to reduce API calls

## Cost Considerations

Google Vision API is a paid service. The current pricing can be found on the [Google Cloud Vision API pricing page](https://cloud.google.com/vision/pricing).

To minimize costs:

1. Optimize images before processing
2. Use caching for repeated OCR operations
3. Consider using Tesseract.js for development and testing

## Security Considerations

The service account key provides access to your Google Cloud resources. To ensure security:

1. Store the key file securely and restrict access
2. Use environment variables to pass credentials
3. Grant the minimum necessary permissions to the service account
4. Regularly rotate the service account key

## References

- [Google Cloud Vision API Documentation](https://cloud.google.com/vision/docs)
- [Node.js Client for Google Cloud Vision](https://github.com/googleapis/nodejs-vision)
- [Google Cloud Authentication](https://cloud.google.com/docs/authentication)
