import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  generateComplianceReport,
  getComplianceReportById,
  getComplianceReports,
  sendComplianceReportByEmail,
  scheduleComplianceReport,
  ReportType,
  ReportFormat
} from '@/services/compliance/complianceReportingService';
import { createAuditLog } from '@/services/audit/auditService';
import { sendEmail } from '@/services/communication/emailService';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Mock dependencies
vi.mock('uuid', () => ({
  v4: vi.fn()
}));

vi.mock('fs', () => ({
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  statSync: vi.fn()
}));

vi.mock('path', () => ({
  join: vi.fn(),
  dirname: vi.fn(),
  basename: vi.fn()
}));

vi.mock('@/lib/db', () => ({
  default: {
    query: vi.fn()
  }
}));

vi.mock('@/services/audit/auditService', () => ({
  createAuditLog: vi.fn()
}));

vi.mock('@/services/communication/emailService', () => ({
  sendEmail: vi.fn()
}));

vi.mock('@/services/compliance/complianceMonitoringService', () => ({
  getComplianceRequirements: vi.fn().mockResolvedValue({
    requirements: [
      {
        id: 'req-id',
        name: 'GDPR Compliance',
        type: 'gdpr',
        status: 'compliant',
        nextCheckDue: new Date()
      }
    ],
    pagination: {
      total: 1,
      page: 1,
      limit: 1000
    }
  })
}));

describe('Compliance Reporting Service', () => {
  const mockUuid = '123e4567-e89b-12d3-a456-426614174000';
  
  beforeEach(() => {
    vi.resetAllMocks();
    (uuidv4 as any).mockReturnValue(mockUuid);
    
    // Mock path.join
    (path.join as any).mockImplementation((...args) => args.join('/'));
    
    // Mock path.dirname
    (path.dirname as any).mockImplementation((p) => p.substring(0, p.lastIndexOf('/')));
    
    // Mock path.basename
    (path.basename as any).mockImplementation((p) => p.substring(p.lastIndexOf('/') + 1));
    
    // Mock fs.existsSync
    (fs.existsSync as any).mockReturnValue(true);
    
    // Mock fs.statSync
    (fs.statSync as any).mockReturnValue({ size: 1024 });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateComplianceReport', () => {
    it('should generate a compliance report', async () => {
      const now = new Date();
      
      (db.query as any).mockResolvedValueOnce({
        rows: [{
          id: mockUuid,
          name: 'Compliance Summary',
          description: 'Monthly compliance summary',
          type: ReportType.COMPLIANCE_SUMMARY,
          format: ReportFormat.PDF,
          parameters: '{}',
          file_path: 'reports/compliance/compliance_summary_123456.pdf',
          file_size: 1024,
          generated_at: now,
          generated_by: 'creator-id',
          created_at: now
        }]
      });
      
      const result = await generateComplianceReport(
        'Compliance Summary',
        ReportType.COMPLIANCE_SUMMARY,
        ReportFormat.PDF,
        'creator-id',
        {},
        'Monthly compliance summary'
      );
      
      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(fs.statSync).toHaveBeenCalled();
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO compliance_reports'),
        expect.arrayContaining([
          mockUuid,
          'Compliance Summary',
          'Monthly compliance summary',
          ReportType.COMPLIANCE_SUMMARY,
          ReportFormat.PDF
        ])
      );
      
      expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'creator-id',
        entityId: mockUuid,
        details: expect.objectContaining({
          name: 'Compliance Summary',
          type: ReportType.COMPLIANCE_SUMMARY,
          format: ReportFormat.PDF
        })
      }));
      
      expect(result).toEqual(expect.objectContaining({
        id: mockUuid,
        name: 'Compliance Summary',
        description: 'Monthly compliance summary',
        type: ReportType.COMPLIANCE_SUMMARY,
        format: ReportFormat.PDF,
        fileSize: 1024,
        generatedBy: 'creator-id'
      }));
    });
  });
  
  describe('getComplianceReportById', () => {
    it('should return a compliance report by ID', async () => {
      const now = new Date();
      
      (db.query as any).mockResolvedValueOnce({
        rows: [{
          id: mockUuid,
          name: 'Compliance Summary',
          description: 'Monthly compliance summary',
          type: ReportType.COMPLIANCE_SUMMARY,
          format: ReportFormat.PDF,
          parameters: '{"key":"value"}',
          file_path: 'reports/compliance/compliance_summary_123456.pdf',
          file_size: 1024,
          generated_at: now,
          generated_by: 'creator-id',
          created_at: now
        }]
      });
      
      const result = await getComplianceReportById(mockUuid);
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM compliance_reports'),
        [mockUuid]
      );
      
      expect(result).toEqual(expect.objectContaining({
        id: mockUuid,
        name: 'Compliance Summary',
        description: 'Monthly compliance summary',
        type: ReportType.COMPLIANCE_SUMMARY,
        format: ReportFormat.PDF,
        parameters: { key: 'value' },
        filePath: 'reports/compliance/compliance_summary_123456.pdf',
        fileSize: 1024,
        generatedBy: 'creator-id'
      }));
    });
    
    it('should return null if report not found', async () => {
      (db.query as any).mockResolvedValueOnce({
        rows: []
      });
      
      const result = await getComplianceReportById(mockUuid);
      
      expect(result).toBeNull();
    });
  });
  
  describe('getComplianceReports', () => {
    it('should return compliance reports with filtering and pagination', async () => {
      const now = new Date();
      
      (db.query as any).mockResolvedValueOnce({
        rows: [{
          id: mockUuid,
          name: 'Compliance Summary',
          description: 'Monthly compliance summary',
          type: ReportType.COMPLIANCE_SUMMARY,
          format: ReportFormat.PDF,
          parameters: '{"key":"value"}',
          file_path: 'reports/compliance/compliance_summary_123456.pdf',
          file_size: 1024,
          generated_at: now,
          generated_by: 'creator-id',
          created_at: now
        }]
      });
      
      (db.query as any).mockResolvedValueOnce({
        rows: [{ count: '10' }]
      });
      
      const result = await getComplianceReports(
        ReportType.COMPLIANCE_SUMMARY,
        1,
        10
      );
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM compliance_reports'),
        expect.arrayContaining([
          ReportType.COMPLIANCE_SUMMARY,
          10,
          0
        ])
      );
      
      expect(result).toEqual(expect.objectContaining({
        reports: expect.arrayContaining([
          expect.objectContaining({
            id: mockUuid,
            name: 'Compliance Summary',
            type: ReportType.COMPLIANCE_SUMMARY
          })
        ]),
        pagination: {
          total: 10,
          page: 1,
          limit: 10
        }
      }));
    });
  });
  
  describe('sendComplianceReportByEmail', () => {
    it('should send a compliance report by email', async () => {
      const now = new Date();
      
      // Mock getComplianceReportById
      (db.query as any).mockResolvedValueOnce({
        rows: [{
          id: mockUuid,
          name: 'Compliance Summary',
          description: 'Monthly compliance summary',
          type: ReportType.COMPLIANCE_SUMMARY,
          format: ReportFormat.PDF,
          parameters: '{"key":"value"}',
          file_path: 'reports/compliance/compliance_summary_123456.pdf',
          file_size: 1024,
          generated_at: now,
          generated_by: 'creator-id',
          created_at: now
        }]
      });
      
      const result = await sendComplianceReportByEmail(
        mockUuid,
        ['recipient@example.com'],
        'Compliance Report',
        'Please find attached the compliance report.'
      );
      
      expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
        to: 'recipient@example.com',
        subject: 'Compliance Report',
        text: 'Please find attached the compliance report.',
        attachments: expect.arrayContaining([
          expect.objectContaining({
            filename: 'compliance_summary_123456.pdf',
            path: expect.stringContaining('reports/compliance/compliance_summary_123456.pdf')
          })
        ])
      }));
      
      expect(result).toBe(true);
    });
    
    it('should return false if report not found', async () => {
      (db.query as any).mockResolvedValueOnce({
        rows: []
      });
      
      const result = await sendComplianceReportByEmail(
        mockUuid,
        ['recipient@example.com'],
        'Compliance Report',
        'Please find attached the compliance report.'
      );
      
      expect(result).toBe(false);
      expect(sendEmail).not.toHaveBeenCalled();
    });
    
    it('should return false if file does not exist', async () => {
      const now = new Date();
      
      // Mock getComplianceReportById
      (db.query as any).mockResolvedValueOnce({
        rows: [{
          id: mockUuid,
          name: 'Compliance Summary',
          description: 'Monthly compliance summary',
          type: ReportType.COMPLIANCE_SUMMARY,
          format: ReportFormat.PDF,
          parameters: '{"key":"value"}',
          file_path: 'reports/compliance/compliance_summary_123456.pdf',
          file_size: 1024,
          generated_at: now,
          generated_by: 'creator-id',
          created_at: now
        }]
      });
      
      // Mock file not existing
      (fs.existsSync as any).mockReturnValue(false);
      
      const result = await sendComplianceReportByEmail(
        mockUuid,
        ['recipient@example.com'],
        'Compliance Report',
        'Please find attached the compliance report.'
      );
      
      expect(result).toBe(false);
      expect(sendEmail).not.toHaveBeenCalled();
    });
  });
});
