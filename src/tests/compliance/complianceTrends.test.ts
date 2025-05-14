import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getComplianceTrends,
  getComplianceTrendsByDate,
  ComplianceTrendPeriod,
  ComplianceStatus
} from '@/services/compliance/complianceMonitoringService';
import db from '@/lib/db';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  default: {
    query: vi.fn()
  }
}));

describe('Compliance Trends', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Mock db.query for compliance trends
    (db.query as jest.Mock).mockResolvedValue({
      rows: [
        {
          status: ComplianceStatus.COMPLIANT,
          type: 'gdpr',
          last_checked: new Date('2023-01-01')
        },
        {
          status: ComplianceStatus.NON_COMPLIANT,
          type: 'data_protection',
          last_checked: new Date('2023-01-02')
        },
        {
          status: ComplianceStatus.PARTIALLY_COMPLIANT,
          type: 'consent',
          last_checked: new Date('2023-01-03')
        },
        {
          status: ComplianceStatus.UNDER_REVIEW,
          type: 'audit',
          last_checked: new Date('2023-01-04')
        },
        {
          status: ComplianceStatus.COMPLIANT,
          type: 'gdpr',
          last_checked: new Date('2023-01-05')
        }
      ]
    });
  });
  
  describe('getComplianceTrends', () => {
    it('should get compliance trends for a specified period', async () => {
      const trends = await getComplianceTrends(ComplianceTrendPeriod.ONE_MONTH);
      
      expect(db.query).toHaveBeenCalled();
      expect(trends).toBeDefined();
      expect(Array.isArray(trends)).toBe(true);
    });
    
    it('should filter trends by type if provided', async () => {
      await getComplianceTrends(ComplianceTrendPeriod.ONE_MONTH, 'gdpr');
      
      expect(db.query).toHaveBeenCalled();
      // Check that the query includes the type filter
      const queryCall = (db.query as jest.Mock).mock.calls[0];
      expect(queryCall[0]).toContain('AND cr.type = $3');
      expect(queryCall[1]).toContain('gdpr');
    });
  });
  
  describe('getComplianceTrendsByDate', () => {
    it('should get compliance trends for a custom date range with daily grouping', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-10');
      
      const trends = await getComplianceTrendsByDate(startDate, endDate, 'day');
      
      expect(db.query).toHaveBeenCalled();
      expect(trends).toBeDefined();
      expect(Array.isArray(trends)).toBe(true);
      
      // Should have 10 days in the range
      expect(trends.length).toBe(10);
      
      // Check that the trends have the correct format
      const firstTrend = trends[0];
      expect(firstTrend).toHaveProperty('date');
      expect(firstTrend).toHaveProperty('complianceRate');
      expect(firstTrend).toHaveProperty('compliant');
      expect(firstTrend).toHaveProperty('nonCompliant');
      expect(firstTrend).toHaveProperty('partiallyCompliant');
      expect(firstTrend).toHaveProperty('underReview');
      expect(firstTrend).toHaveProperty('total');
      expect(firstTrend).toHaveProperty('byType');
    });
    
    it('should get compliance trends for a custom date range with weekly grouping', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      
      const trends = await getComplianceTrendsByDate(startDate, endDate, 'week');
      
      expect(db.query).toHaveBeenCalled();
      expect(trends).toBeDefined();
      expect(Array.isArray(trends)).toBe(true);
      
      // Should have weeks in the range
      expect(trends.length).toBeGreaterThan(0);
    });
    
    it('should get compliance trends for a custom date range with monthly grouping', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-03-31');
      
      const trends = await getComplianceTrendsByDate(startDate, endDate, 'month');
      
      expect(db.query).toHaveBeenCalled();
      expect(trends).toBeDefined();
      expect(Array.isArray(trends)).toBe(true);
      
      // Should have 3 months in the range
      expect(trends.length).toBe(3);
    });
    
    it('should automatically determine grouping when set to auto', async () => {
      // Short range (< 31 days) should use daily grouping
      const shortStartDate = new Date('2023-01-01');
      const shortEndDate = new Date('2023-01-15');
      
      await getComplianceTrendsByDate(shortStartDate, shortEndDate, 'auto');
      
      // Medium range (31-90 days) should use weekly grouping
      const mediumStartDate = new Date('2023-01-01');
      const mediumEndDate = new Date('2023-03-01');
      
      await getComplianceTrendsByDate(mediumStartDate, mediumEndDate, 'auto');
      
      // Long range (> 90 days) should use monthly grouping
      const longStartDate = new Date('2023-01-01');
      const longEndDate = new Date('2023-06-01');
      
      await getComplianceTrendsByDate(longStartDate, longEndDate, 'auto');
      
      expect(db.query).toHaveBeenCalledTimes(3);
    });
    
    it('should calculate compliance rates correctly', async () => {
      // Mock specific data to test calculation
      (db.query as jest.Mock).mockResolvedValue({
        rows: [
          { status: ComplianceStatus.COMPLIANT, type: 'gdpr', last_checked: new Date('2023-01-01') },
          { status: ComplianceStatus.COMPLIANT, type: 'gdpr', last_checked: new Date('2023-01-01') },
          { status: ComplianceStatus.NON_COMPLIANT, type: 'data_protection', last_checked: new Date('2023-01-01') },
          { status: ComplianceStatus.PARTIALLY_COMPLIANT, type: 'consent', last_checked: new Date('2023-01-01') }
        ]
      });
      
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-01');
      
      const trends = await getComplianceTrendsByDate(startDate, endDate, 'day');
      
      expect(trends.length).toBe(1);
      
      const trend = trends[0];
      expect(trend.total).toBe(4);
      expect(trend.compliant).toBe(2);
      expect(trend.nonCompliant).toBe(1);
      expect(trend.partiallyCompliant).toBe(1);
      expect(trend.underReview).toBe(0);
      
      // Compliance rate should be (compliant / total) * 100
      expect(trend.complianceRate).toBe(50);
    });
  });
});
