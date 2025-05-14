/**
 * Data Extraction Service
 *
 * Extracts structured data from documents based on document type.
 * Uses regular expressions and pattern matching to identify key information.
 */
import { DocumentType } from '@/types/document';
import { OCRResult } from './ocrService';

export interface ExtractedData {
  fields: Record<string, string | null>;
  confidence: Record<string, number>;
}

export interface ExtractionPattern {
  field: string;
  pattern: RegExp;
  postProcess?: (match: string) => string;
}

export class DataExtractor {
  // Extraction patterns for different document types
  private extractionPatterns: Record<DocumentType, ExtractionPattern[]> = {
    [DocumentType.PASSPORT]: [
      {
        field: 'passportNumber',
        pattern: /passport\s*(?:no|number|#)[\s.:]*([A-Z0-9]{6,10})/i,
      },
      {
        field: 'surname',
        pattern: /surname[s]?[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'givenNames',
        pattern: /given\s*names?[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'dateOfBirth',
        pattern: /(?:date\s*of\s*birth|birth\s*date|dob)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
      {
        field: 'placeOfBirth',
        pattern: /(?:place\s*of\s*birth|birth\s*place)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'dateOfIssue',
        pattern: /(?:date\s*of\s*issue|issued\s*on)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
      {
        field: 'dateOfExpiry',
        pattern: /(?:date\s*of\s*expiry|expiry\s*date|expiration|valid\s*until)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
      {
        field: 'authority',
        pattern: /(?:authority|issued\s*by)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'nationality',
        pattern: /nationality[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'gender',
        pattern: /(?:sex|gender)[\s.:]*([MF]|Male|Female)/i,
        postProcess: (match) => match.toUpperCase() === 'M' || match.toUpperCase() === 'MALE' ? 'Male' : 'Female',
      },
    ],
    [DocumentType.VISA]: [
      {
        field: 'visaNumber',
        pattern: /(?:visa|visa\s*no|visa\s*number)[\s.:]*([A-Z0-9]{6,12})/i,
      },
      {
        field: 'visaType',
        pattern: /(?:type|category)[\s.:]*([A-Z0-9-]{1,5})/i,
      },
      {
        field: 'validFrom',
        pattern: /(?:valid\s*from|from|issued\s*on)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
      {
        field: 'validUntil',
        pattern: /(?:valid\s*until|until|expiry|expiration)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
      {
        field: 'numberOfEntries',
        pattern: /(?:number\s*of\s*entries|entries)[\s.:]*([A-Za-z0-9\s-]+)/i,
      },
      {
        field: 'issuedAt',
        pattern: /(?:issued\s*at|place\s*of\s*issue)[\s.:]*([A-Za-z\s-]+)/i,
      },
    ],
    [DocumentType.RESIDENCE_PERMIT]: [
      {
        field: 'permitNumber',
        pattern: /(?:permit\s*no|permit\s*number|card\s*no)[\s.:]*([A-Z0-9]{6,12})/i,
      },
      {
        field: 'fullName',
        pattern: /(?:name|full\s*name)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'dateOfBirth',
        pattern: /(?:date\s*of\s*birth|birth\s*date|dob)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
      {
        field: 'validFrom',
        pattern: /(?:valid\s*from|from|issued\s*on)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
      {
        field: 'validUntil',
        pattern: /(?:valid\s*until|until|expiry|expiration)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
      {
        field: 'permitType',
        pattern: /(?:type|category)[\s.:]*([A-Za-z0-9\s-]+)/i,
      },
    ],
    // Add patterns for other document types
    [DocumentType.BIRTH_CERTIFICATE]: [
      {
        field: 'fullName',
        pattern: /(?:name\s*of\s*child|child['']s\s*name|name)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'dateOfBirth',
        pattern: /(?:date\s*of\s*birth|born\s*on)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
      {
        field: 'placeOfBirth',
        pattern: /(?:place\s*of\s*birth|born\s*at|born\s*in)[\s.:]*([A-Za-z\s-,]+)/i,
      },
      {
        field: 'fatherName',
        pattern: /(?:father['']s\s*name|father)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'motherName',
        pattern: /(?:mother['']s\s*name|mother)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'registrationNumber',
        pattern: /(?:registration\s*no|registration\s*number|reg\s*no)[\s.:]*([A-Z0-9-]+)/i,
      },
      {
        field: 'registrationDate',
        pattern: /(?:registration\s*date|registered\s*on|date\s*of\s*registration)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
    ],
    [DocumentType.MARRIAGE_CERTIFICATE]: [
      {
        field: 'spouseName1',
        pattern: /(?:bride|wife|spouse\s*1|first\s*spouse)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'spouseName2',
        pattern: /(?:groom|husband|spouse\s*2|second\s*spouse)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'dateOfMarriage',
        pattern: /(?:date\s*of\s*marriage|married\s*on)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
      {
        field: 'placeOfMarriage',
        pattern: /(?:place\s*of\s*marriage|married\s*at|married\s*in)[\s.:]*([A-Za-z\s-,]+)/i,
      },
      {
        field: 'registrationNumber',
        pattern: /(?:registration\s*no|registration\s*number|reg\s*no)[\s.:]*([A-Z0-9-]+)/i,
      },
      {
        field: 'officiantName',
        pattern: /(?:officiant|celebrant|solemnized\s*by)[\s.:]*([A-Za-z\s-]+)/i,
      },
    ],
    [DocumentType.FINANCIAL]: [
      {
        field: 'accountHolder',
        pattern: /(?:account\s*holder|name)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'accountNumber',
        pattern: /(?:account\s*number|account\s*no|a\/c\s*no)[\s.:]*([A-Z0-9-]+)/i,
      },
      {
        field: 'statementDate',
        pattern: /(?:statement\s*date|date)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
      {
        field: 'balance',
        pattern: /(?:balance|closing\s*balance)[\s.:]*([€$£]?\s*\d+[,.]\d{2})/i,
      },
      {
        field: 'institution',
        pattern: /(?:bank|financial\s*institution)[\s.:]*([A-Za-z\s-]+)/i,
      },
    ],
    [DocumentType.BANK_STATEMENT]: [
      {
        field: 'accountHolder',
        pattern: /(?:account\s*holder|name)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'accountNumber',
        pattern: /(?:account\s*number|account\s*no|a\/c\s*no)[\s.:]*([A-Z0-9-]+)/i,
      },
      {
        field: 'iban',
        pattern: /(?:iban|international\s*bank\s*account\s*number)[\s.:]*([A-Z0-9\s]+)/i,
        postProcess: (match) => match.replace(/\s/g, ''),
      },
      {
        field: 'bic',
        pattern: /(?:bic|swift|bank\s*identifier\s*code)[\s.:]*([A-Z0-9]+)/i,
      },
      {
        field: 'statementPeriod',
        pattern: /(?:statement\s*period|period)[\s.:]*([A-Za-z0-9\s\-\.\/]+)/i,
      },
      {
        field: 'openingBalance',
        pattern: /(?:opening\s*balance)[\s.:]*([€$£]?\s*\d+[,.]\d{2})/i,
      },
      {
        field: 'closingBalance',
        pattern: /(?:closing\s*balance)[\s.:]*([€$£]?\s*\d+[,.]\d{2})/i,
      },
    ],
    [DocumentType.TAX_DOCUMENT]: [
      {
        field: 'taxpayerName',
        pattern: /(?:taxpayer|name)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'taxpayerId',
        pattern: /(?:tax\s*id|pps\s*number|social\s*security|tin)[\s.:]*([A-Z0-9-]+)/i,
      },
      {
        field: 'taxYear',
        pattern: /(?:tax\s*year|year)[\s.:]*([0-9-\/]+)/i,
      },
      {
        field: 'taxableIncome',
        pattern: /(?:taxable\s*income|income)[\s.:]*([€$£]?\s*\d+[,.]\d{2})/i,
      },
      {
        field: 'taxPaid',
        pattern: /(?:tax\s*paid|total\s*tax)[\s.:]*([€$£]?\s*\d+[,.]\d{2})/i,
      },
      {
        field: 'issueDate',
        pattern: /(?:issue\s*date|date)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
    ],
    [DocumentType.EMPLOYMENT]: [
      {
        field: 'employeeName',
        pattern: /(?:employee|name)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'employerName',
        pattern: /(?:employer|company)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'position',
        pattern: /(?:position|job\s*title|role)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'startDate',
        pattern: /(?:start\s*date|commencement\s*date|employment\s*date)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
      {
        field: 'salary',
        pattern: /(?:salary|wage|compensation)[\s.:]*([€$£]?\s*\d+[,.]\d{2})/i,
      },
      {
        field: 'contractType',
        pattern: /(?:contract\s*type|employment\s*type)[\s.:]*([A-Za-z\s-]+)/i,
      },
    ],
    [DocumentType.EDUCATIONAL]: [
      {
        field: 'studentName',
        pattern: /(?:student|name)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'institutionName',
        pattern: /(?:institution|university|college|school)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'qualification',
        pattern: /(?:qualification|degree|diploma)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'graduationDate',
        pattern: /(?:graduation\s*date|completion\s*date|date)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
      {
        field: 'grade',
        pattern: /(?:grade|class|classification)[\s.:]*([A-Za-z0-9\s-]+)/i,
      },
    ],
    [DocumentType.LANGUAGE_CERTIFICATE]: [
      {
        field: 'candidateName',
        pattern: /(?:candidate|name)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'language',
        pattern: /(?:language|test\s*language)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'testName',
        pattern: /(?:test|examination|exam)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'overallScore',
        pattern: /(?:overall\s*score|score|result)[\s.:]*([A-Za-z0-9\s\.\/-]+)/i,
      },
      {
        field: 'testDate',
        pattern: /(?:test\s*date|date\s*of\s*test|examination\s*date)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
      {
        field: 'certificateNumber',
        pattern: /(?:certificate\s*number|reference\s*number|ref\s*no)[\s.:]*([A-Z0-9-]+)/i,
      },
      {
        field: 'validUntil',
        pattern: /(?:valid\s*until|expiry\s*date)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
    ],
    [DocumentType.UTILITY_BILL]: [
      {
        field: 'customerName',
        pattern: /(?:customer|name|bill\s*to)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'accountNumber',
        pattern: /(?:account\s*number|account\s*no|customer\s*id)[\s.:]*([A-Z0-9-]+)/i,
      },
      {
        field: 'billingAddress',
        pattern: /(?:billing\s*address|address)[\s.:]*([A-Za-z0-9\s\.,#-]+)/i,
      },
      {
        field: 'billDate',
        pattern: /(?:bill\s*date|invoice\s*date|date)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
      {
        field: 'dueDate',
        pattern: /(?:due\s*date|payment\s*due)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
      {
        field: 'amount',
        pattern: /(?:amount\s*due|total\s*due|total\s*amount)[\s.:]*([€$£]?\s*\d+[,.]\d{2})/i,
      },
      {
        field: 'utilityType',
        pattern: /(?:utility\s*type|service)[\s.:]*([A-Za-z\s-]+)/i,
      },
    ],
    [DocumentType.MEDICAL]: [
      {
        field: 'patientName',
        pattern: /(?:patient|name)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'doctorName',
        pattern: /(?:doctor|physician|practitioner)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'diagnosis',
        pattern: /(?:diagnosis|condition)[\s.:]*([A-Za-z0-9\s\.,#-]+)/i,
      },
      {
        field: 'treatmentDate',
        pattern: /(?:treatment\s*date|date\s*of\s*treatment|date)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
      {
        field: 'medicalFacility',
        pattern: /(?:hospital|clinic|facility|center)[\s.:]*([A-Za-z\s-]+)/i,
      },
    ],
    [DocumentType.VACCINATION_CERTIFICATE]: [
      {
        field: 'patientName',
        pattern: /(?:patient|name)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'dateOfBirth',
        pattern: /(?:date\s*of\s*birth|birth\s*date|dob)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
      {
        field: 'vaccineType',
        pattern: /(?:vaccine|vaccine\s*type|vaccination)[\s.:]*([A-Za-z0-9\s\.,#-]+)/i,
      },
      {
        field: 'vaccinationDate',
        pattern: /(?:vaccination\s*date|date\s*of\s*vaccination|date)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
      {
        field: 'certificateNumber',
        pattern: /(?:certificate\s*number|reference\s*number|ref\s*no)[\s.:]*([A-Z0-9-]+)/i,
      },
      {
        field: 'issuer',
        pattern: /(?:issuer|issued\s*by|authority)[\s.:]*([A-Za-z\s-]+)/i,
      },
    ],
    [DocumentType.DRIVING_LICENSE]: [
      {
        field: 'licenseNumber',
        pattern: /(?:license\s*number|licence\s*number|no)[\s.:]*([A-Z0-9-]+)/i,
      },
      {
        field: 'fullName',
        pattern: /(?:name|full\s*name)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'dateOfBirth',
        pattern: /(?:date\s*of\s*birth|birth\s*date|dob)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
      {
        field: 'issueDate',
        pattern: /(?:issue\s*date|date\s*of\s*issue)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
      {
        field: 'expiryDate',
        pattern: /(?:expiry\s*date|valid\s*until)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
      {
        field: 'categories',
        pattern: /(?:categories|category|class)[\s.:]*([A-Z0-9\s,]+)/i,
      },
      {
        field: 'issuingAuthority',
        pattern: /(?:issuing\s*authority|authority|issued\s*by)[\s.:]*([A-Za-z\s-]+)/i,
      },
    ],
    [DocumentType.POLICE_CLEARANCE]: [
      {
        field: 'fullName',
        pattern: /(?:name|full\s*name)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'dateOfBirth',
        pattern: /(?:date\s*of\s*birth|birth\s*date|dob)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
      {
        field: 'certificateNumber',
        pattern: /(?:certificate\s*number|reference\s*number|ref\s*no)[\s.:]*([A-Z0-9-]+)/i,
      },
      {
        field: 'issueDate',
        pattern: /(?:issue\s*date|date\s*of\s*issue)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
      {
        field: 'issuingAuthority',
        pattern: /(?:issuing\s*authority|authority|issued\s*by)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'result',
        pattern: /(?:result|record|criminal\s*record)[\s.:]*([A-Za-z\s-]+)/i,
      },
    ],
    [DocumentType.IDENTIFICATION]: [
      {
        field: 'idNumber',
        pattern: /(?:id\s*number|identification\s*number|no)[\s.:]*([A-Z0-9-]+)/i,
      },
      {
        field: 'fullName',
        pattern: /(?:name|full\s*name)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'dateOfBirth',
        pattern: /(?:date\s*of\s*birth|birth\s*date|dob)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
      {
        field: 'issueDate',
        pattern: /(?:issue\s*date|date\s*of\s*issue)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
      {
        field: 'expiryDate',
        pattern: /(?:expiry\s*date|valid\s*until)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
      {
        field: 'issuingAuthority',
        pattern: /(?:issuing\s*authority|authority|issued\s*by)[\s.:]*([A-Za-z\s-]+)/i,
      },
    ],
    [DocumentType.OTHER]: [
      {
        field: 'documentTitle',
        pattern: /(?:title|document\s*title)[\s.:]*([A-Za-z0-9\s\.,#-]+)/i,
      },
      {
        field: 'date',
        pattern: /(?:date)[\s.:]*(\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4})/i,
        postProcess: (match) => this.standardizeDate(match),
      },
      {
        field: 'name',
        pattern: /(?:name|full\s*name)[\s.:]*([A-Za-z\s-]+)/i,
      },
      {
        field: 'referenceNumber',
        pattern: /(?:reference|ref|number|no)[\s.:]*([A-Z0-9-]+)/i,
      },
    ],
  };

  /**
   * Extract data from OCR result based on document type
   */
  async extractData(ocrResult: OCRResult, documentType: DocumentType): Promise<ExtractedData> {
    try {
      const text = ocrResult.text;
      const patterns = this.extractionPatterns[documentType] || [];

      const fields: Record<string, string | null> = {};
      const confidence: Record<string, number> = {};

      // Apply extraction patterns
      for (const { field, pattern, postProcess } of patterns) {
        const match = text.match(pattern);

        if (match && match[1]) {
          let value = match[1].trim();

          // Apply post-processing if defined
          if (postProcess) {
            value = postProcess(value);
          }

          fields[field] = value;

          // Calculate confidence based on word confidence in the matched region
          const matchedWords = this.findWordsInRegion(ocrResult, match.index || 0, match[0].length);
          confidence[field] = matchedWords.length > 0
            ? matchedWords.reduce((sum, word) => sum + word.confidence, 0) / matchedWords.length
            : 0;
        } else {
          fields[field] = null;
          confidence[field] = 0;
        }
      }

      return { fields, confidence };
    } catch (error) {
      console.error('Error extracting data:', error);
      throw new Error('Data extraction failed');
    }
  }

  /**
   * Find words in a specific region of the OCR result
   */
  private findWordsInRegion(
    ocrResult: OCRResult,
    startIndex: number,
    length: number
  ): Array<{ text: string; confidence: number }> {
    const endIndex = startIndex + length;
    const fullText = ocrResult.text;

    return ocrResult.words.filter(word => {
      const wordIndex = fullText.indexOf(word.text);
      return wordIndex >= startIndex && wordIndex < endIndex;
    });
  }

  /**
   * Standardize date format to YYYY-MM-DD
   */
  private standardizeDate(dateStr: string): string {
    try {
      // Remove any non-numeric or separator characters
      dateStr = dateStr.replace(/[^\d\/\-\.]/g, '');

      // Try to parse the date
      const formats = [
        // DD/MM/YYYY
        { regex: /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/, format: '$3-$2-$1' },
        // DD/MM/YY
        { regex: /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/, format: '20$3-$2-$1' },
        // MM/DD/YYYY
        { regex: /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/, format: '$3-$1-$2' },
        // YYYY/MM/DD
        { regex: /^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/, format: '$1-$2-$3' },
      ];

      for (const { regex, format } of formats) {
        if (regex.test(dateStr)) {
          return dateStr.replace(regex, format);
        }
      }

      // If no format matches, return the original string
      return dateStr;
    } catch (error) {
      console.error('Error standardizing date:', error);
      return dateStr;
    }
  }
}

export default new DataExtractor();
