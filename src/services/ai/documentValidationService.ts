/**
 * Document Validation Service
 *
 * Validates extracted document data against business rules.
 * Checks for completeness, format validity, and expiration.
 */
import { DocumentType } from '@/types/document';
import { ExtractedData } from './dataExtractionService';

export interface ValidationRule {
  field: string;
  required: boolean;
  validator?: (value: string) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  errors: Array<{
    field: string;
    message: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
  }>;
}

export class DocumentValidator {
  // Validation rules for different document types
  private validationRules: Record<DocumentType, ValidationRule[]> = {
    [DocumentType.PASSPORT]: [
      {
        field: 'passportNumber',
        required: true,
        validator: (value) => /^[A-Z0-9]{6,10}$/i.test(value),
        message: 'Passport number is invalid or missing',
      },
      {
        field: 'surname',
        required: true,
        validator: (value) => value.length >= 2,
        message: 'Surname is invalid or missing',
      },
      {
        field: 'givenNames',
        required: true,
        validator: (value) => value.length >= 2,
        message: 'Given names are invalid or missing',
      },
      {
        field: 'dateOfBirth',
        required: true,
        validator: (value) => this.isValidDate(value),
        message: 'Date of birth is invalid or missing',
      },
      {
        field: 'dateOfExpiry',
        required: true,
        validator: (value) => this.isValidDate(value) && !this.isExpired(value),
        message: 'Passport is expired or expiry date is invalid',
      },
      {
        field: 'nationality',
        required: true,
        message: 'Nationality is missing',
      },
    ],
    [DocumentType.VISA]: [
      {
        field: 'visaNumber',
        required: true,
        validator: (value) => /^[A-Z0-9]{6,12}$/i.test(value),
        message: 'Visa number is invalid or missing',
      },
      {
        field: 'validUntil',
        required: true,
        validator: (value) => this.isValidDate(value) && !this.isExpired(value),
        message: 'Visa is expired or expiry date is invalid',
      },
      {
        field: 'visaType',
        required: true,
        message: 'Visa type is missing',
      },
    ],
    [DocumentType.RESIDENCE_PERMIT]: [
      {
        field: 'permitNumber',
        required: true,
        validator: (value) => /^[A-Z0-9]{6,12}$/i.test(value),
        message: 'Permit number is invalid or missing',
      },
      {
        field: 'fullName',
        required: true,
        validator: (value) => value.length >= 2,
        message: 'Full name is invalid or missing',
      },
      {
        field: 'validUntil',
        required: true,
        validator: (value) => this.isValidDate(value) && !this.isExpired(value),
        message: 'Residence permit is expired or expiry date is invalid',
      },
    ],
    // Add validation rules for other document types
    [DocumentType.BIRTH_CERTIFICATE]: [
      {
        field: 'fullName',
        required: true,
        validator: (value) => value.length >= 2,
        message: 'Full name is invalid or missing',
      },
      {
        field: 'dateOfBirth',
        required: true,
        validator: (value) => this.isValidDate(value),
        message: 'Date of birth is invalid or missing',
      },
      {
        field: 'registrationNumber',
        required: true,
        message: 'Registration number is missing',
      },
      {
        field: 'fatherName',
        required: false,
        validator: (value) => value.length >= 2,
        message: 'Father\'s name is invalid',
      },
      {
        field: 'motherName',
        required: false,
        validator: (value) => value.length >= 2,
        message: 'Mother\'s name is invalid',
      },
    ],
    [DocumentType.MARRIAGE_CERTIFICATE]: [
      {
        field: 'spouseName1',
        required: true,
        validator: (value) => value.length >= 2,
        message: 'First spouse name is invalid or missing',
      },
      {
        field: 'spouseName2',
        required: true,
        validator: (value) => value.length >= 2,
        message: 'Second spouse name is invalid or missing',
      },
      {
        field: 'dateOfMarriage',
        required: true,
        validator: (value) => this.isValidDate(value),
        message: 'Date of marriage is invalid or missing',
      },
      {
        field: 'registrationNumber',
        required: true,
        message: 'Registration number is missing',
      },
    ],
    [DocumentType.FINANCIAL]: [
      {
        field: 'accountHolder',
        required: true,
        validator: (value) => value.length >= 2,
        message: 'Account holder name is invalid or missing',
      },
      {
        field: 'accountNumber',
        required: true,
        message: 'Account number is missing',
      },
      {
        field: 'statementDate',
        required: true,
        validator: (value) => this.isValidDate(value) && !this.isOlderThanMonths(value, 3),
        message: 'Statement date is invalid, missing, or older than 3 months',
      },
      {
        field: 'balance',
        required: false,
        message: 'Balance information is missing',
      },
    ],
    [DocumentType.BANK_STATEMENT]: [
      {
        field: 'accountHolder',
        required: true,
        validator: (value) => value.length >= 2,
        message: 'Account holder name is invalid or missing',
      },
      {
        field: 'accountNumber',
        required: true,
        message: 'Account number is missing',
      },
      {
        field: 'statementPeriod',
        required: true,
        message: 'Statement period is missing',
      },
      {
        field: 'closingBalance',
        required: true,
        message: 'Closing balance is missing',
      },
    ],
    [DocumentType.TAX_DOCUMENT]: [
      {
        field: 'taxpayerName',
        required: true,
        validator: (value) => value.length >= 2,
        message: 'Taxpayer name is invalid or missing',
      },
      {
        field: 'taxpayerId',
        required: true,
        message: 'Taxpayer ID is missing',
      },
      {
        field: 'taxYear',
        required: true,
        message: 'Tax year is missing',
      },
      {
        field: 'issueDate',
        required: true,
        validator: (value) => this.isValidDate(value) && !this.isOlderThanMonths(value, 18),
        message: 'Issue date is invalid, missing, or older than 18 months',
      },
    ],
    [DocumentType.EMPLOYMENT]: [
      {
        field: 'employeeName',
        required: true,
        validator: (value) => value.length >= 2,
        message: 'Employee name is invalid or missing',
      },
      {
        field: 'employerName',
        required: true,
        validator: (value) => value.length >= 2,
        message: 'Employer name is invalid or missing',
      },
      {
        field: 'position',
        required: true,
        message: 'Position/job title is missing',
      },
      {
        field: 'startDate',
        required: true,
        validator: (value) => this.isValidDate(value),
        message: 'Start date is invalid or missing',
      },
    ],
    [DocumentType.EDUCATIONAL]: [
      {
        field: 'studentName',
        required: true,
        validator: (value) => value.length >= 2,
        message: 'Student name is invalid or missing',
      },
      {
        field: 'institutionName',
        required: true,
        validator: (value) => value.length >= 2,
        message: 'Institution name is invalid or missing',
      },
      {
        field: 'qualification',
        required: true,
        message: 'Qualification is missing',
      },
      {
        field: 'graduationDate',
        required: true,
        validator: (value) => this.isValidDate(value),
        message: 'Graduation date is invalid or missing',
      },
    ],
    [DocumentType.LANGUAGE_CERTIFICATE]: [
      {
        field: 'candidateName',
        required: true,
        validator: (value) => value.length >= 2,
        message: 'Candidate name is invalid or missing',
      },
      {
        field: 'language',
        required: true,
        message: 'Language is missing',
      },
      {
        field: 'testName',
        required: true,
        message: 'Test name is missing',
      },
      {
        field: 'overallScore',
        required: true,
        message: 'Overall score is missing',
      },
      {
        field: 'testDate',
        required: true,
        validator: (value) => this.isValidDate(value) && !this.isOlderThanMonths(value, 24),
        message: 'Test date is invalid, missing, or older than 24 months',
      },
      {
        field: 'validUntil',
        required: false,
        validator: (value) => this.isValidDate(value) && !this.isExpired(value),
        message: 'Certificate has expired or expiry date is invalid',
      },
    ],
    [DocumentType.UTILITY_BILL]: [
      {
        field: 'customerName',
        required: true,
        validator: (value) => value.length >= 2,
        message: 'Customer name is invalid or missing',
      },
      {
        field: 'billingAddress',
        required: true,
        message: 'Billing address is missing',
      },
      {
        field: 'billDate',
        required: true,
        validator: (value) => this.isValidDate(value) && !this.isOlderThanMonths(value, 3),
        message: 'Bill date is invalid, missing, or older than 3 months',
      },
      {
        field: 'amount',
        required: true,
        message: 'Bill amount is missing',
      },
    ],
    [DocumentType.MEDICAL]: [
      {
        field: 'patientName',
        required: true,
        validator: (value) => value.length >= 2,
        message: 'Patient name is invalid or missing',
      },
      {
        field: 'doctorName',
        required: true,
        validator: (value) => value.length >= 2,
        message: 'Doctor name is invalid or missing',
      },
      {
        field: 'treatmentDate',
        required: true,
        validator: (value) => this.isValidDate(value),
        message: 'Treatment date is invalid or missing',
      },
    ],
    [DocumentType.VACCINATION_CERTIFICATE]: [
      {
        field: 'patientName',
        required: true,
        validator: (value) => value.length >= 2,
        message: 'Patient name is invalid or missing',
      },
      {
        field: 'dateOfBirth',
        required: true,
        validator: (value) => this.isValidDate(value),
        message: 'Date of birth is invalid or missing',
      },
      {
        field: 'vaccineType',
        required: true,
        message: 'Vaccine type is missing',
      },
      {
        field: 'vaccinationDate',
        required: true,
        validator: (value) => this.isValidDate(value),
        message: 'Vaccination date is invalid or missing',
      },
    ],
    [DocumentType.DRIVING_LICENSE]: [
      {
        field: 'licenseNumber',
        required: true,
        message: 'License number is missing',
      },
      {
        field: 'fullName',
        required: true,
        validator: (value) => value.length >= 2,
        message: 'Full name is invalid or missing',
      },
      {
        field: 'dateOfBirth',
        required: true,
        validator: (value) => this.isValidDate(value),
        message: 'Date of birth is invalid or missing',
      },
      {
        field: 'expiryDate',
        required: true,
        validator: (value) => this.isValidDate(value) && !this.isExpired(value),
        message: 'License has expired or expiry date is invalid',
      },
    ],
    [DocumentType.POLICE_CLEARANCE]: [
      {
        field: 'fullName',
        required: true,
        validator: (value) => value.length >= 2,
        message: 'Full name is invalid or missing',
      },
      {
        field: 'dateOfBirth',
        required: true,
        validator: (value) => this.isValidDate(value),
        message: 'Date of birth is invalid or missing',
      },
      {
        field: 'issueDate',
        required: true,
        validator: (value) => this.isValidDate(value) && !this.isOlderThanMonths(value, 6),
        message: 'Issue date is invalid, missing, or older than 6 months',
      },
      {
        field: 'result',
        required: true,
        message: 'Result/record information is missing',
      },
    ],
    [DocumentType.IDENTIFICATION]: [
      {
        field: 'idNumber',
        required: true,
        message: 'ID number is missing',
      },
      {
        field: 'fullName',
        required: true,
        validator: (value) => value.length >= 2,
        message: 'Full name is invalid or missing',
      },
      {
        field: 'dateOfBirth',
        required: true,
        validator: (value) => this.isValidDate(value),
        message: 'Date of birth is invalid or missing',
      },
      {
        field: 'expiryDate',
        required: true,
        validator: (value) => this.isValidDate(value) && !this.isExpired(value),
        message: 'ID has expired or expiry date is invalid',
      },
    ],
    [DocumentType.OTHER]: [
      {
        field: 'documentTitle',
        required: false,
        message: 'Document title is missing',
      },
      {
        field: 'date',
        required: false,
        validator: (value) => this.isValidDate(value),
        message: 'Date is invalid',
      },
      {
        field: 'name',
        required: false,
        validator: (value) => value.length >= 2,
        message: 'Name is invalid',
      },
    ],
  };

  /**
   * Validate extracted data against rules for the document type
   */
  validate(extractedData: ExtractedData, documentType: DocumentType): ValidationResult {
    try {
      const rules = this.validationRules[documentType] || [];
      const { fields, confidence } = extractedData;

      const errors: Array<{ field: string; message: string }> = [];
      const warnings: Array<{ field: string; message: string }> = [];

      // Apply validation rules
      for (const rule of rules) {
        const { field, required, validator, message } = rule;
        const value = fields[field];

        // Check if field is required but missing
        if (required && (value === null || value === undefined || value === '')) {
          errors.push({ field, message });
          continue;
        }

        // Skip validation if value is null or undefined
        if (value === null || value === undefined || value === '') {
          continue;
        }

        // Apply custom validator if defined
        if (validator && !validator(value)) {
          errors.push({ field, message });
          continue;
        }

        // Check confidence level
        const fieldConfidence = confidence[field] || 0;
        if (fieldConfidence < 70) {
          warnings.push({
            field,
            message: `Low confidence (${Math.round(fieldConfidence)}%) for ${field}`,
          });
        }
      }

      // Calculate validation score
      const totalRules = rules.length;
      const passedRules = totalRules - errors.length;
      const score = totalRules > 0 ? Math.round((passedRules / totalRules) * 100) : 100;

      return {
        isValid: errors.length === 0,
        score,
        errors,
        warnings,
      };
    } catch (error) {
      console.error('Error validating document:', error);
      throw new Error('Document validation failed');
    }
  }

  /**
   * Check if a date string is valid
   */
  private isValidDate(dateStr: string): boolean {
    try {
      // Try to parse the date
      const date = new Date(dateStr);
      return !isNaN(date.getTime());
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if a date is expired (before today)
   */
  private isExpired(dateStr: string): boolean {
    try {
      const date = new Date(dateStr);
      const today = new Date();

      // Reset time part for comparison
      today.setHours(0, 0, 0, 0);

      return date < today;
    } catch (error) {
      return true; // Assume expired if date can't be parsed
    }
  }

  /**
   * Check if a date is within a certain range from today
   */
  private isWithinRange(dateStr: string, days: number): boolean {
    try {
      const date = new Date(dateStr);
      const today = new Date();

      // Reset time part for comparison
      today.setHours(0, 0, 0, 0);

      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + days);

      return date >= today && date <= futureDate;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if a date is older than a certain number of months
   */
  private isOlderThanMonths(dateStr: string, months: number): boolean {
    try {
      const date = new Date(dateStr);
      const today = new Date();

      // Reset time part for comparison
      today.setHours(0, 0, 0, 0);

      // Calculate date 'months' ago
      const pastDate = new Date(today);
      pastDate.setMonth(today.getMonth() - months);

      return date < pastDate;
    } catch (error) {
      return true; // Assume too old if date can't be parsed
    }
  }

  /**
   * Check if a date is in the future
   */
  private isFutureDate(dateStr: string): boolean {
    try {
      const date = new Date(dateStr);
      const today = new Date();

      // Reset time part for comparison
      today.setHours(0, 0, 0, 0);

      return date > today;
    } catch (error) {
      return false;
    }
  }
}

export default new DocumentValidator();
