import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  createAccessReview,
  getAccessReviewById,
  getAccessReviews,
  getAccessReviewItems,
  reviewAccessReviewItem,
  updateAccessReviewStatus
} from '@/services/security/accessReviewService';
import { createAuditLog } from '@/services/audit/auditService';
import { sendNotification } from '@/services/notification/notificationService';
import db from '@/lib/db';
import { 
  AccessReviewStatus, 
  AccessReviewItemStatus, 
  AccessReviewDecision 
} from '@/types/security';
import { UserRole } from '@/types/user';
import { v4 as uuidv4 } from 'uuid';

// Mock dependencies
vi.mock('uuid', () => ({
  v4: vi.fn()
}));

vi.mock('@/lib/db', () => ({
  default: {
    query: vi.fn(),
    getClient: vi.fn()
  }
}));

vi.mock('@/services/audit/auditService', () => ({
  createAuditLog: vi.fn()
}));

vi.mock('@/services/notification/notificationService', () => ({
  sendNotification: vi.fn()
}));

describe('Access Review Service', () => {
  const mockClient = {
    query: vi.fn(),
    release: vi.fn()
  };
  
  const mockUuid = '123e4567-e89b-12d3-a456-426614174000';
  
  beforeEach(() => {
    vi.resetAllMocks();
    (uuidv4 as any).mockReturnValue(mockUuid);
    (db.getClient as any).mockResolvedValue(mockClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createAccessReview', () => {
    it('should create a new access review and items', async () => {
      // Mock transaction
      mockClient.query.mockResolvedValueOnce(); // BEGIN
      mockClient.query.mockResolvedValueOnce({
        rows: [{
          id: mockUuid,
          name: 'Test Review',
          description: 'Test Description',
          status: AccessReviewStatus.PENDING,
          start_date: new Date(),
          end_date: new Date(),
          created_by: 'creator-id',
          created_at: new Date(),
          updated_at: new Date()
        }]
      }); // INSERT INTO access_reviews
      mockClient.query.mockResolvedValueOnce(); // INSERT INTO access_review_items
      mockClient.query.mockResolvedValueOnce(); // COMMIT
      
      // Mock admin query for notifications
      (db.query as any).mockResolvedValueOnce({
        rows: [{ id: 'admin-id' }]
      });
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      
      const result = await createAccessReview(
        'Test Review',
        ['user-id'],
        startDate,
        endDate,
        'Test Description',
        'creator-id'
      );
      
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO access_reviews'),
        expect.arrayContaining([mockUuid, 'Test Review', 'Test Description'])
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO access_review_items'),
        expect.arrayContaining([mockUuid, mockUuid, 'user-id'])
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
      
      expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'creator-id',
        entityId: mockUuid
      }));
      
      expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'admin-id',
        title: expect.stringContaining('New Access Review')
      }));
      
      expect(result).toEqual(expect.objectContaining({
        id: mockUuid,
        name: 'Test Review',
        description: 'Test Description',
        status: AccessReviewStatus.PENDING
      }));
    });
    
    it('should handle transaction errors', async () => {
      // Mock transaction error
      mockClient.query.mockResolvedValueOnce(); // BEGIN
      mockClient.query.mockRejectedValueOnce(new Error('Database error')); // INSERT INTO access_reviews
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      
      await expect(createAccessReview(
        'Test Review',
        ['user-id'],
        startDate,
        endDate,
        'Test Description',
        'creator-id'
      )).rejects.toThrow('Database error');
      
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
  
  describe('getAccessReviewById', () => {
    it('should return an access review by ID', async () => {
      const reviewDate = new Date();
      
      (db.query as any).mockResolvedValueOnce({
        rows: [{
          id: mockUuid,
          name: 'Test Review',
          description: 'Test Description',
          status: AccessReviewStatus.PENDING,
          start_date: reviewDate,
          end_date: reviewDate,
          created_by: 'creator-id',
          created_at: reviewDate,
          updated_at: reviewDate
        }]
      });
      
      const result = await getAccessReviewById(mockUuid);
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM access_reviews'),
        [mockUuid]
      );
      
      expect(result).toEqual(expect.objectContaining({
        id: mockUuid,
        name: 'Test Review',
        description: 'Test Description',
        status: AccessReviewStatus.PENDING,
        startDate: reviewDate,
        endDate: reviewDate
      }));
    });
    
    it('should return null if review not found', async () => {
      (db.query as any).mockResolvedValueOnce({
        rows: []
      });
      
      const result = await getAccessReviewById(mockUuid);
      
      expect(result).toBeNull();
    });
  });
  
  describe('getAccessReviews', () => {
    it('should return access reviews with pagination', async () => {
      const reviewDate = new Date();
      
      (db.query as any).mockResolvedValueOnce({
        rows: [{
          id: mockUuid,
          name: 'Test Review',
          description: 'Test Description',
          status: AccessReviewStatus.PENDING,
          start_date: reviewDate,
          end_date: reviewDate,
          created_by: 'creator-id',
          created_at: reviewDate,
          updated_at: reviewDate
        }]
      });
      
      (db.query as any).mockResolvedValueOnce({
        rows: [{ count: '10' }]
      });
      
      const result = await getAccessReviews(AccessReviewStatus.PENDING, 1, 10);
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM access_reviews'),
        expect.arrayContaining([AccessReviewStatus.PENDING, 10, 0])
      );
      
      expect(result).toEqual(expect.objectContaining({
        reviews: expect.arrayContaining([
          expect.objectContaining({
            id: mockUuid,
            name: 'Test Review'
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
  
  describe('reviewAccessReviewItem', () => {
    it('should update an access review item with a decision', async () => {
      const reviewDate = new Date();
      
      (db.query as any).mockResolvedValueOnce({
        rows: [{
          id: mockUuid,
          review_id: 'review-id',
          user_id: 'user-id',
          reviewer_id: 'reviewer-id',
          status: AccessReviewItemStatus.COMPLETED,
          decision: AccessReviewDecision.REVOKE,
          notes: 'Test notes',
          reviewed_at: reviewDate,
          created_at: reviewDate
        }]
      });
      
      // Mock check review completion
      (db.query as any).mockResolvedValueOnce({
        rows: [{ total: '1', completed: '1' }]
      });
      
      (db.query as any).mockResolvedValueOnce(); // UPDATE access_reviews
      
      const result = await reviewAccessReviewItem(
        mockUuid,
        'reviewer-id',
        AccessReviewDecision.REVOKE,
        'Test notes'
      );
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE access_review_items'),
        expect.arrayContaining([
          'reviewer-id', 
          AccessReviewItemStatus.COMPLETED,
          AccessReviewDecision.REVOKE,
          'Test notes',
          mockUuid
        ])
      );
      
      expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'reviewer-id',
        entityId: mockUuid,
        details: expect.objectContaining({
          decision: AccessReviewDecision.REVOKE
        })
      }));
      
      expect(result).toEqual(expect.objectContaining({
        id: mockUuid,
        reviewId: 'review-id',
        userId: 'user-id',
        reviewerId: 'reviewer-id',
        status: AccessReviewItemStatus.COMPLETED,
        decision: AccessReviewDecision.REVOKE,
        notes: 'Test notes'
      }));
    });
    
    it('should return null if item not found', async () => {
      (db.query as any).mockResolvedValueOnce({
        rows: []
      });
      
      const result = await reviewAccessReviewItem(
        mockUuid,
        'reviewer-id',
        AccessReviewDecision.REVOKE,
        'Test notes'
      );
      
      expect(result).toBeNull();
    });
  });
});
