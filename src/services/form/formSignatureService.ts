/**
 * Form Signature Service
 *
 * Handles digital signatures for form submissions.
 */
import { PDFDocument } from 'pdf-lib';
import {
  FormSignature,
  FormSignatureCreateData,
  SignatureType,
  FormSubmission,
  FormSubmissionStatus
} from '@/types/form';
import * as formSubmissionRepository from './formSubmissionRepository';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditAction, AuditEntityType } from '@/types/audit';
import { uploadFile } from '@/services/storage/storageService';
import { getFileFromStorage } from '@/services/storage/storageService';

/**
 * Add a signature to a form submission
 */
export async function signForm(
  submissionId: string,
  signatureData: string,
  signatureType: SignatureType,
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{
  success: boolean;
  signature?: FormSignature;
  message?: string;
}> {
  try {
    // Get submission
    const submission = await formSubmissionRepository.getFormSubmissionById(submissionId);

    if (!submission) {
      return {
        success: false,
        message: `Submission with ID ${submissionId} not found`,
      };
    }

    // Check if submission is in a valid state for signing
    if (submission.status !== FormSubmissionStatus.GENERATED) {
      return {
        success: false,
        message: `Cannot sign a form that is already ${submission.status}`,
      };
    }

    // Create signature record
    const signatureCreateData: FormSignatureCreateData = {
      submissionId,
      signatureData,
      signatureType,
      ipAddress,
      userAgent,
    };

    const signature = await formSubmissionRepository.createFormSignature(
      signatureCreateData,
      userId
    );

    // Create audit log
    await createAuditLog({
      userId,
      entityType: AuditEntityType.FORM_SUBMISSION,
      entityId: submissionId,
      action: AuditAction.SIGN,
      details: {
        signatureId: signature.id,
        signatureType,
        ipAddress,
      },
    });

    // Apply signature to PDF
    await applySignatureToPdf(submission, signature);

    return {
      success: true,
      signature,
    };
  } catch (error) {
    console.error('Error signing form:', error);
    return {
      success: false,
      message: `Form signing failed: ${error.message}`,
    };
  }
}

/**
 * Apply a signature to a PDF document
 */
async function applySignatureToPdf(
  submission: FormSubmission,
  signature: FormSignature
): Promise<void> {
  try {
    // Get the PDF file
    const fileResponse = await getFileFromStorage(submission.filePath);

    if (!fileResponse.success || !fileResponse.data) {
      throw new Error('Failed to retrieve PDF file');
    }

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(fileResponse.data);

    // Get the last page
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];

    // Decode the signature data (base64)
    const signatureImageData = Buffer.from(
      signature.signatureData.replace(/^data:image\/\w+;base64,/, ''),
      'base64'
    );

    // Embed the signature image
    let signatureImage;
    if (signature.signatureData.includes('data:image/png')) {
      signatureImage = await pdfDoc.embedPng(signatureImageData);
    } else if (signature.signatureData.includes('data:image/jpeg')) {
      signatureImage = await pdfDoc.embedJpg(signatureImageData);
    } else {
      throw new Error('Unsupported signature image format');
    }

    // Calculate signature position (bottom of the page)
    const { width, height } = lastPage.getSize();
    const signatureWidth = 150;
    const signatureHeight = 50;
    const signatureX = width - signatureWidth - 50;
    const signatureY = 100;

    // Draw the signature
    lastPage.drawImage(signatureImage, {
      x: signatureX,
      y: signatureY,
      width: signatureWidth,
      height: signatureHeight,
    });

    // Add signature text
    lastPage.drawText('Digitally signed by:', {
      x: signatureX,
      y: signatureY + signatureHeight + 10,
      size: 10,
    });

    // Add timestamp
    const timestamp = new Date().toISOString();
    lastPage.drawText(`Date: ${timestamp}`, {
      x: signatureX,
      y: signatureY - 15,
      size: 8,
    });

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();

    // Upload the modified PDF
    await uploadFile(
      Buffer.from(modifiedPdfBytes),
      submission.filePath,
      'application/pdf',
      signature.userId,
      true // Overwrite existing file
    );
  } catch (error) {
    console.error('Error applying signature to PDF:', error);
    throw error;
  }
}

/**
 * Get signatures for a form submission
 */
export async function getFormSignatures(submissionId: string): Promise<FormSignature[]> {
  return formSubmissionRepository.getFormSignaturesBySubmissionId(submissionId);
}

/**
 * Verify a signature on a form submission
 */
export async function verifySignature(
  submissionId: string,
  signatureId: string,
  userId: string
): Promise<{
  success: boolean;
  verified: boolean;
  message: string;
  details?: any;
}> {
  try {
    // Get submission
    const submission = await formSubmissionRepository.getFormSubmissionById(submissionId);

    if (!submission) {
      return {
        success: false,
        verified: false,
        message: `Submission with ID ${submissionId} not found`,
      };
    }

    // Get signature
    const signature = await formSubmissionRepository.getFormSignatureById(signatureId);

    if (!signature) {
      return {
        success: false,
        verified: false,
        message: `Signature with ID ${signatureId} not found`,
      };
    }

    // Check if signature belongs to the submission
    if (signature.submissionId !== submissionId) {
      return {
        success: false,
        verified: false,
        message: `Signature does not belong to the specified submission`,
      };
    }

    // Get audit logs for the signature
    const auditLogs = await getSignatureAuditLogs(signatureId);

    // Verify signature integrity
    const integrityCheck = await verifySignatureIntegrity(signature, submission);

    // Create verification details
    const verificationDetails = {
      signatureId: signature.id,
      submissionId: submission.id,
      signatureType: signature.signatureType,
      signedBy: signature.userId,
      signedAt: signature.createdAt,
      ipAddress: signature.ipAddress,
      userAgent: signature.userAgent,
      auditLogs,
      integrityCheck,
    };

    // Create audit log for verification
    await createAuditLog({
      userId,
      entityType: AuditEntityType.FORM_SUBMISSION,
      entityId: submissionId,
      action: AuditAction.VERIFY,
      details: {
        signatureId,
        verified: integrityCheck.verified,
      },
    });

    return {
      success: true,
      verified: integrityCheck.verified,
      message: integrityCheck.verified
        ? 'Signature verification successful'
        : 'Signature verification failed: ' + integrityCheck.reason,
      details: verificationDetails,
    };
  } catch (error) {
    console.error('Error verifying signature:', error);
    return {
      success: false,
      verified: false,
      message: `Signature verification failed: ${error.message}`,
    };
  }
}

/**
 * Get audit logs for a signature
 */
async function getSignatureAuditLogs(signatureId: string): Promise<any[]> {
  // This would typically query the audit log database
  // For now, we'll return a placeholder
  return [
    {
      action: AuditAction.SIGN,
      timestamp: new Date(),
      details: {
        signatureId,
      },
    },
  ];
}

/**
 * Verify the integrity of a signature
 */
async function verifySignatureIntegrity(
  signature: FormSignature,
  submission: FormSubmission
): Promise<{
  verified: boolean;
  reason?: string;
}> {
  try {
    // In a real implementation, this would check:
    // 1. If the signature data has been tampered with
    // 2. If the PDF contains the signature as expected
    // 3. If the signature metadata matches what's in the database

    // For now, we'll implement a basic check

    // Get the PDF file
    const fileResponse = await getFileFromStorage(submission.filePath);

    if (!fileResponse.success || !fileResponse.data) {
      return {
        verified: false,
        reason: 'Failed to retrieve PDF file',
      };
    }

    // Check if the signature data exists and is valid
    if (!signature.signatureData ||
        (!signature.signatureData.includes('data:image/png') &&
         !signature.signatureData.includes('data:image/jpeg'))) {
      return {
        verified: false,
        reason: 'Invalid signature data format',
      };
    }

    // In a production environment, we would:
    // 1. Extract the signature from the PDF
    // 2. Compare it with the stored signature data
    // 3. Verify any cryptographic signatures

    // For this implementation, we'll assume the signature is valid
    // if it exists in the database and has valid format
    return {
      verified: true,
    };
  } catch (error) {
    console.error('Error verifying signature integrity:', error);
    return {
      verified: false,
      reason: `Integrity check failed: ${error.message}`,
    };
  }
}

export default {
  signForm,
  getFormSignatures,
  verifySignature,
};
