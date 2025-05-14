/**
 * Messaging Service
 *
 * Handles business logic for the messaging system, including real-time communication,
 * message delivery, and template processing.
 */
import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { redisClient, connectRedis } from '@/lib/redis';
import { uploadFile } from '@/services/storage/storageService';
import { createAuditLog } from '@/services/audit/auditService';
import { AuditAction, AuditEntityType } from '@/types/audit';
import { getUserById } from '@/services/user/userRepository';
import { sendNotification } from '@/services/notification/notificationService';
import { NotificationType } from '@/types/notification';
import {
  Conversation,
  ConversationParticipant,
  Message,
  MessageAttachment,
  MessageTemplate,
  ConversationType,
  MessageStatus,
  ConversationCreateData,
  MessageCreateData,
  MessageTemplateCreateData,
  MessageTemplateUpdateData,
  ConversationSummary
} from '@/types/message';
import * as messageRepository from './messageRepository';

// Socket.io instance
let io: SocketIOServer | null = null;

// Connected users map: userId -> socketId
const connectedUsers = new Map<string, string>();

/**
 * Initialize Socket.IO server
 */
export function initializeSocketIO(server: HttpServer): void {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/api/socket',
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Authenticate user
    socket.on('authenticate', async (token: string) => {
      try {
        // Verify JWT token (implementation depends on your auth system)
        const userId = verifyToken(token);

        if (!userId) {
          socket.disconnect();
          return;
        }

        // Store user connection
        connectedUsers.set(userId, socket.id);
        socket.data.userId = userId;

        // Join user's rooms
        await joinUserRooms(socket, userId);

        console.log(`User ${userId} authenticated on socket ${socket.id}`);

        // Notify user of successful connection
        socket.emit('authenticated', { success: true });
      } catch (error) {
        console.error('Socket authentication error:', error);
        socket.disconnect();
      }
    });

    // Handle message sending
    socket.on('send_message', async (data: {
      conversationId: string;
      content: string;
      parentId?: string;
      metadata?: Record<string, any>;
    }) => {
      try {
        const userId = socket.data.userId;

        if (!userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Create message
        const message = await createMessage({
          conversationId: data.conversationId,
          content: data.content,
          parentId: data.parentId,
          metadata: data.metadata,
        }, userId);

        // Broadcast to room
        socket.to(`conversation:${data.conversationId}`).emit('new_message', message);

        // Acknowledge message receipt
        socket.emit('message_sent', { messageId: message.id });
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle read receipts
    socket.on('mark_read', async (data: { conversationId: string }) => {
      try {
        const userId = socket.data.userId;

        if (!userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Mark messages as read
        await markMessagesAsRead(data.conversationId, userId);

        // Broadcast to room
        socket.to(`conversation:${data.conversationId}`).emit('messages_read', {
          conversationId: data.conversationId,
          userId,
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
        socket.emit('error', { message: 'Failed to mark messages as read' });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data: { conversationId: string, isTyping: boolean }) => {
      const userId = socket.data.userId;

      if (!userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      // Broadcast typing status to room
      socket.to(`conversation:${data.conversationId}`).emit('user_typing', {
        conversationId: data.conversationId,
        userId,
        isTyping: data.isTyping,
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const userId = socket.data.userId;

      if (userId) {
        connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected from socket ${socket.id}`);
      }

      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  console.log('Socket.IO server initialized');
}

/**
 * Join user to their conversation rooms
 */
async function joinUserRooms(socket: any, userId: string): Promise<void> {
  try {
    // Get user's conversations
    const conversations = await messageRepository.getConversationsForUser(userId);

    // Join each conversation room
    for (const conversation of conversations) {
      socket.join(`conversation:${conversation.id}`);
    }

    console.log(`User ${userId} joined ${conversations.length} conversation rooms`);
  } catch (error) {
    console.error('Error joining user rooms:', error);
  }
}

/**
 * Verify JWT token (placeholder - implement based on your auth system)
 */
function verifyToken(token: string): string | null {
  // This is a placeholder - implement your actual token verification
  try {
    // Example: const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // return decoded.userId;
    return 'user-123'; // Placeholder
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Create a new conversation
 */
export async function createConversation(
  data: ConversationCreateData,
  userId: string
): Promise<Conversation> {
  // Create conversation in database
  const conversation = await messageRepository.createConversation(data, userId);

  // Create audit log
  await createAuditLog({
    userId,
    entityType: AuditEntityType.CONVERSATION,
    entityId: conversation.id,
    action: AuditAction.CREATE,
    details: {
      type: conversation.type,
      participantCount: data.participantIds.length + 1,
    },
  });

  // Send notifications to participants
  for (const participantId of data.participantIds) {
    // Skip notification for creator
    if (participantId === userId) continue;

    // Get user details
    const creator = await getUserById(userId);

    if (!creator) continue;

    // Send notification
    await sendNotification({
      userId: participantId,
      type: NotificationType.NEW_CONVERSATION,
      title: 'New conversation',
      message: `${creator.firstName} ${creator.lastName} started a conversation with you`,
      entityId: conversation.id,
      entityType: 'conversation',
      link: `/messages/${conversation.id}`,
    });

    // Send real-time notification if user is connected
    const socketId = connectedUsers.get(participantId);
    if (socketId && io) {
      io.to(socketId).emit('new_conversation', {
        conversation: {
          ...conversation,
          participants: [
            {
              id: creator.id,
              firstName: creator.firstName,
              lastName: creator.lastName,
              avatarUrl: creator.avatarUrl,
            },
          ],
        },
      });
    }
  }

  return conversation;
}

/**
 * Get conversation details
 */
export async function getConversation(id: string): Promise<Conversation | null> {
  return messageRepository.getConversationWithDetails(id);
}

/**
 * Get conversations for user
 */
export async function getConversationsForUser(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<ConversationSummary[]> {
  return messageRepository.getConversationsForUser(userId, limit, offset);
}

/**
 * Create a new message
 */
export async function createMessage(
  data: MessageCreateData,
  userId: string
): Promise<Message> {
  // Handle file attachments if present
  if (data.attachments && data.attachments.length > 0) {
    // Process attachments (implementation depends on your storage service)
    // This is a placeholder - implement your actual file upload logic
  }

  // Create message in database
  const message = await messageRepository.createMessage(data, userId);

  // Create audit log
  await createAuditLog({
    userId,
    entityType: AuditEntityType.MESSAGE,
    entityId: message.id,
    action: AuditAction.CREATE,
    details: {
      conversationId: data.conversationId,
      hasAttachments: data.attachments ? data.attachments.length > 0 : false,
    },
  });

  // Get conversation participants
  const conversation = await messageRepository.getConversationWithDetails(data.conversationId);

  if (!conversation || !conversation.participants) {
    return message;
  }

  // Send notifications to participants
  const sender = await getUserById(userId);

  if (!sender) {
    return message;
  }

  for (const participant of conversation.participants) {
    // Skip notification for sender
    if (participant.userId === userId) continue;

    // Send notification
    await sendNotification({
      userId: participant.userId,
      type: NotificationType.NEW_MESSAGE,
      title: 'New message',
      message: `${sender.firstName} ${sender.lastName} sent you a message`,
      entityId: message.id,
      entityType: 'message',
      link: `/messages/${data.conversationId}`,
    });

    // Send real-time notification if user is connected
    const socketId = connectedUsers.get(participant.userId);
    if (socketId && io) {
      io.to(socketId).emit('new_message', {
        message: {
          ...message,
          sender: {
            id: sender.id,
            firstName: sender.firstName,
            lastName: sender.lastName,
            avatarUrl: sender.avatarUrl,
          },
        },
      });
    }
  }

  return message;
}

/**
 * Get messages for a conversation
 */
export async function getMessagesForConversation(
  conversationId: string,
  limit: number = 50,
  before?: Date
): Promise<Message[]> {
  return messageRepository.getMessagesForConversation(conversationId, limit, before);
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  await messageRepository.markMessagesAsRead(conversationId, userId);

  // Notify other participants via Socket.IO
  if (io) {
    io.to(`conversation:${conversationId}`).emit('messages_read', {
      conversationId,
      userId,
      timestamp: new Date(),
    });
  }
}

/**
 * Create a message template
 */
export async function createMessageTemplate(
  data: MessageTemplateCreateData,
  userId: string
): Promise<MessageTemplate> {
  const template = await messageRepository.createMessageTemplate(data, userId);

  // Create audit log
  await createAuditLog({
    userId,
    entityType: AuditEntityType.MESSAGE_TEMPLATE,
    entityId: template.id,
    action: AuditAction.CREATE,
    details: {
      name: template.name,
      category: template.category,
    },
  });

  return template;
}

/**
 * Get message templates
 */
export async function getMessageTemplates(
  category?: string,
  activeOnly: boolean = true
): Promise<MessageTemplate[]> {
  return messageRepository.getMessageTemplates(category, activeOnly);
}

/**
 * Get message template by ID
 */
export async function getMessageTemplateById(id: string): Promise<MessageTemplate | null> {
  return messageRepository.getMessageTemplateById(id);
}

/**
 * Update message template
 */
export async function updateMessageTemplate(
  id: string,
  data: MessageTemplateUpdateData,
  userId: string
): Promise<MessageTemplate | null> {
  const template = await messageRepository.updateMessageTemplate(id, data);

  if (template) {
    // Create audit log
    await createAuditLog({
      userId,
      entityType: AuditEntityType.MESSAGE_TEMPLATE,
      entityId: template.id,
      action: AuditAction.UPDATE,
      details: {
        name: template.name,
        category: template.category,
        updatedFields: Object.keys(data),
      },
    });
  }

  return template;
}

/**
 * Process template with variables
 */
export function processTemplate(
  template: MessageTemplate,
  variables: Record<string, any>
): string {
  let content = template.content;

  // Replace variables in the format {{variableName}}
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    content = content.replace(regex, String(value));
  }

  return content;
}

/**
 * Send message from template
 */
export async function sendMessageFromTemplate(
  templateId: string,
  conversationId: string,
  variables: Record<string, any>,
  userId: string
): Promise<Message | null> {
  // Get template
  const template = await getMessageTemplateById(templateId);

  if (!template) {
    throw new Error(`Template with ID ${templateId} not found`);
  }

  // Process template
  const content = processTemplate(template, variables);

  // Create message
  return createMessage({
    conversationId,
    content,
    metadata: {
      fromTemplate: true,
      templateId,
      templateName: template.name,
    },
  }, userId);
}

/**
 * Add user to conversation
 */
export async function addUserToConversation(
  conversationId: string,
  userId: string,
  addedByUserId: string
): Promise<ConversationParticipant | null> {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Check if conversation exists
    const conversation = await messageRepository.getConversationById(conversationId);

    if (!conversation) {
      throw new Error(`Conversation with ID ${conversationId} not found`);
    }

    // Check if user is already a participant
    const participantCheckResult = await client.query(
      `SELECT * FROM conversation_participants
       WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL`,
      [conversationId, userId]
    );

    if (participantCheckResult.rows.length > 0) {
      throw new Error(`User ${userId} is already a participant in conversation ${conversationId}`);
    }

    // Add user to conversation
    const participantId = uuidv4();
    const now = new Date();

    const result = await client.query(
      `INSERT INTO conversation_participants (
        id, conversation_id, user_id, joined_at, is_admin
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        participantId,
        conversationId,
        userId,
        now,
        false, // Not an admin by default
      ]
    );

    // Create system message
    const addedUser = await getUserById(userId);
    const addedBy = await getUserById(addedByUserId);

    if (addedUser && addedBy) {
      await client.query(
        `INSERT INTO messages (
          id, conversation_id, sender_id, content, status, created_at, updated_at, is_system_message
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          uuidv4(),
          conversationId,
          addedByUserId,
          `${addedBy.firstName} ${addedBy.lastName} added ${addedUser.firstName} ${addedUser.lastName} to the conversation`,
          MessageStatus.SENT,
          now,
          now,
          true,
        ]
      );
    }

    await client.query('COMMIT');

    // Add user to Socket.IO room
    const socketId = connectedUsers.get(userId);
    if (socketId && io) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.join(`conversation:${conversationId}`);
      }
    }

    // Notify other participants
    if (io) {
      io.to(`conversation:${conversationId}`).emit('user_added', {
        conversationId,
        user: {
          id: userId,
          firstName: addedUser?.firstName,
          lastName: addedUser?.lastName,
          avatarUrl: addedUser?.avatarUrl,
        },
        addedBy: {
          id: addedByUserId,
          firstName: addedBy?.firstName,
          lastName: addedBy?.lastName,
        },
      });
    }

    return {
      id: result.rows[0].id,
      conversationId,
      userId,
      joinedAt: result.rows[0].joined_at,
      isAdmin: result.rows[0].is_admin,
      user: addedUser ? {
        id: addedUser.id,
        firstName: addedUser.firstName,
        lastName: addedUser.lastName,
        email: addedUser.email,
        avatarUrl: addedUser.avatarUrl,
      } : undefined,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
