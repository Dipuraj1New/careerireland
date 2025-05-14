/**
 * Message Types
 * 
 * Types for the messaging system in the Communication Module.
 */

/**
 * Conversation Type Enum
 */
export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
  CASE = 'case',
  SYSTEM = 'system',
}

/**
 * Message Status Enum
 */
export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

/**
 * Conversation Interface
 */
export interface Conversation {
  id: string;
  title?: string;
  type: ConversationType;
  caseId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
  metadata?: Record<string, any>;
  participants?: ConversationParticipant[];
  messages?: Message[];
}

/**
 * Conversation Participant Interface
 */
export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  joinedAt: Date;
  leftAt?: Date;
  isAdmin: boolean;
  lastReadAt?: Date;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
}

/**
 * Message Interface
 */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  status: MessageStatus;
  createdAt: Date;
  updatedAt: Date;
  parentId?: string;
  isSystemMessage: boolean;
  metadata?: Record<string, any>;
  attachments?: MessageAttachment[];
  receipts?: MessageReceipt[];
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

/**
 * Message Attachment Interface
 */
export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  uploadedAt: Date;
  uploadedBy: string;
  url?: string;
}

/**
 * Message Receipt Interface
 */
export interface MessageReceipt {
  id: string;
  messageId: string;
  userId: string;
  status: MessageStatus;
  timestamp: Date;
}

/**
 * Message Template Interface
 */
export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  variables?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Conversation Create Data
 */
export interface ConversationCreateData {
  title?: string;
  type: ConversationType;
  caseId?: string;
  participantIds: string[];
  initialMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Message Create Data
 */
export interface MessageCreateData {
  conversationId: string;
  content: string;
  parentId?: string;
  isSystemMessage?: boolean;
  metadata?: Record<string, any>;
  attachments?: {
    fileName: string;
    fileType: string;
    fileSize: number;
    fileData: Buffer;
  }[];
}

/**
 * Message Template Create Data
 */
export interface MessageTemplateCreateData {
  name: string;
  content: string;
  category: string;
  variables?: Record<string, any>;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Message Template Update Data
 */
export interface MessageTemplateUpdateData {
  name?: string;
  content?: string;
  category?: string;
  variables?: Record<string, any>;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Conversation Summary
 * Used for conversation list views
 */
export interface ConversationSummary {
  id: string;
  title?: string;
  type: ConversationType;
  caseId?: string;
  lastMessageAt?: Date;
  lastMessage?: {
    content: string;
    senderId: string;
    senderName: string;
    createdAt: Date;
  };
  unreadCount: number;
  participants: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  }[];
}
