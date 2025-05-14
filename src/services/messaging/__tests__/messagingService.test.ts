/**
 * Messaging Service Tests
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as messagingService from '../messagingService';
import * as messageRepository from '../messageRepository';
import { createAuditLog } from '@/services/audit/auditService';
import { sendNotification } from '@/services/notification/notificationService';
import { getUserById } from '@/services/user/userRepository';
import {
  ConversationType,
  MessageStatus,
  ConversationCreateData,
  MessageCreateData,
  MessageTemplateCreateData,
  MessageTemplateUpdateData,
} from '@/types/message';

// Mock dependencies
jest.mock('../messageRepository');
jest.mock('@/services/audit/auditService');
jest.mock('@/services/notification/notificationService');
jest.mock('@/services/user/userRepository');

describe('Messaging Service', () => {
  const mockUserId = 'user-123';
  const mockConversationId = 'conversation-123';
  const mockMessageId = 'message-123';
  const mockTemplateId = 'template-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createConversation', () => {
    it('should create a conversation and send notifications', async () => {
      // Mock data
      const conversationData: ConversationCreateData = {
        type: ConversationType.DIRECT,
        participantIds: ['user-456'],
        initialMessage: 'Hello!',
      };

      const mockConversation = {
        id: mockConversationId,
        type: ConversationType.DIRECT,
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUser = {
        id: mockUserId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      // Mock repository functions
      (messageRepository.createConversation as jest.Mock).mockResolvedValue(mockConversation);
      (getUserById as jest.Mock).mockResolvedValue(mockUser);

      // Call the service function
      const result = await messagingService.createConversation(conversationData, mockUserId);

      // Assertions
      expect(messageRepository.createConversation).toHaveBeenCalledWith(
        conversationData,
        mockUserId
      );
      expect(createAuditLog).toHaveBeenCalled();
      expect(getUserById).toHaveBeenCalledWith(mockUserId);
      expect(sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-456',
          entityId: mockConversationId,
        })
      );
      expect(result).toEqual(mockConversation);
    });
  });

  describe('createMessage', () => {
    it('should create a message and send notifications', async () => {
      // Mock data
      const messageData: MessageCreateData = {
        conversationId: mockConversationId,
        content: 'Hello!',
      };

      const mockMessage = {
        id: mockMessageId,
        conversationId: mockConversationId,
        senderId: mockUserId,
        content: 'Hello!',
        status: MessageStatus.SENT,
        createdAt: new Date(),
        updatedAt: new Date(),
        isSystemMessage: false,
      };

      const mockConversation = {
        id: mockConversationId,
        type: ConversationType.DIRECT,
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [
          {
            userId: mockUserId,
            joinedAt: new Date(),
            isAdmin: true,
          },
          {
            userId: 'user-456',
            joinedAt: new Date(),
            isAdmin: false,
          },
        ],
      };

      const mockUser = {
        id: mockUserId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      // Mock repository functions
      (messageRepository.createMessage as jest.Mock).mockResolvedValue(mockMessage);
      (messageRepository.getConversationWithDetails as jest.Mock).mockResolvedValue(
        mockConversation
      );
      (getUserById as jest.Mock).mockResolvedValue(mockUser);

      // Call the service function
      const result = await messagingService.createMessage(messageData, mockUserId);

      // Assertions
      expect(messageRepository.createMessage).toHaveBeenCalledWith(messageData, mockUserId);
      expect(createAuditLog).toHaveBeenCalled();
      expect(messageRepository.getConversationWithDetails).toHaveBeenCalledWith(mockConversationId);
      expect(getUserById).toHaveBeenCalledWith(mockUserId);
      expect(sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-456',
          entityId: mockMessageId,
        })
      );
      expect(result).toEqual(mockMessage);
    });
  });

  describe('markMessagesAsRead', () => {
    it('should mark messages as read', async () => {
      // Call the service function
      await messagingService.markMessagesAsRead(mockConversationId, mockUserId);

      // Assertions
      expect(messageRepository.markMessagesAsRead).toHaveBeenCalledWith(
        mockConversationId,
        mockUserId
      );
    });
  });

  describe('createMessageTemplate', () => {
    it('should create a message template', async () => {
      // Mock data
      const templateData: MessageTemplateCreateData = {
        name: 'Test Template',
        content: 'Hello {{name}}!',
        category: 'general',
      };

      const mockTemplate = {
        id: mockTemplateId,
        name: 'Test Template',
        content: 'Hello {{name}}!',
        category: 'general',
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      // Mock repository functions
      (messageRepository.createMessageTemplate as jest.Mock).mockResolvedValue(mockTemplate);

      // Call the service function
      const result = await messagingService.createMessageTemplate(templateData, mockUserId);

      // Assertions
      expect(messageRepository.createMessageTemplate).toHaveBeenCalledWith(
        templateData,
        mockUserId
      );
      expect(createAuditLog).toHaveBeenCalled();
      expect(result).toEqual(mockTemplate);
    });
  });

  describe('updateMessageTemplate', () => {
    it('should update a message template', async () => {
      // Mock data
      const templateData: MessageTemplateUpdateData = {
        name: 'Updated Template',
        content: 'Hello {{name}} and {{company}}!',
      };

      const mockTemplate = {
        id: mockTemplateId,
        name: 'Updated Template',
        content: 'Hello {{name}} and {{company}}!',
        category: 'general',
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      // Mock repository functions
      (messageRepository.updateMessageTemplate as jest.Mock).mockResolvedValue(mockTemplate);

      // Call the service function
      const result = await messagingService.updateMessageTemplate(
        mockTemplateId,
        templateData,
        mockUserId
      );

      // Assertions
      expect(messageRepository.updateMessageTemplate).toHaveBeenCalledWith(
        mockTemplateId,
        templateData
      );
      expect(createAuditLog).toHaveBeenCalled();
      expect(result).toEqual(mockTemplate);
    });
  });

  describe('processTemplate', () => {
    it('should process a template with variables', () => {
      // Mock data
      const template = {
        id: mockTemplateId,
        name: 'Test Template',
        content: 'Hello {{name}}! Welcome to {{company}}.',
        category: 'general',
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      const variables = {
        name: 'John',
        company: 'Career Ireland',
      };

      // Call the service function
      const result = messagingService.processTemplate(template, variables);

      // Assertions
      expect(result).toBe('Hello John! Welcome to Career Ireland.');
    });

    it('should handle missing variables', () => {
      // Mock data
      const template = {
        id: mockTemplateId,
        name: 'Test Template',
        content: 'Hello {{name}}! Welcome to {{company}}.',
        category: 'general',
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      const variables = {
        name: 'John',
      };

      // Call the service function
      const result = messagingService.processTemplate(template, variables);

      // Assertions
      expect(result).toBe('Hello John! Welcome to .');
    });
  });

  describe('sendMessageFromTemplate', () => {
    it('should send a message using a template', async () => {
      // Mock data
      const variables = {
        name: 'John',
        company: 'Career Ireland',
      };

      const mockTemplate = {
        id: mockTemplateId,
        name: 'Test Template',
        content: 'Hello {{name}}! Welcome to {{company}}.',
        category: 'general',
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      const mockMessage = {
        id: mockMessageId,
        conversationId: mockConversationId,
        senderId: mockUserId,
        content: 'Hello John! Welcome to Career Ireland.',
        status: MessageStatus.SENT,
        createdAt: new Date(),
        updatedAt: new Date(),
        isSystemMessage: false,
        metadata: {
          fromTemplate: true,
          templateId: mockTemplateId,
          templateName: 'Test Template',
        },
      };

      // Mock repository functions
      (messageRepository.getMessageTemplateById as jest.Mock).mockResolvedValue(mockTemplate);

      // Mock createMessage function
      const createMessageSpy = jest.spyOn(messagingService, 'createMessage');
      createMessageSpy.mockResolvedValue(mockMessage);

      // Call the service function
      const result = await messagingService.sendMessageFromTemplate(
        mockTemplateId,
        mockConversationId,
        variables,
        mockUserId
      );

      // Assertions
      expect(messageRepository.getMessageTemplateById).toHaveBeenCalledWith(mockTemplateId);
      expect(createMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: mockConversationId,
          content: 'Hello John! Welcome to Career Ireland.',
          metadata: expect.objectContaining({
            fromTemplate: true,
            templateId: mockTemplateId,
          }),
        }),
        mockUserId
      );
      expect(result).toEqual(mockMessage);

      // Restore spy
      createMessageSpy.mockRestore();
    });

    it('should throw an error if template is not found', async () => {
      // Mock repository functions
      (messageRepository.getMessageTemplateById as jest.Mock).mockResolvedValue(null);

      // Call the service function and expect it to throw
      await expect(
        messagingService.sendMessageFromTemplate(mockTemplateId, mockConversationId, {}, mockUserId)
      ).rejects.toThrow(`Template with ID ${mockTemplateId} not found`);
    });
  });
});
