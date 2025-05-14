/**
 * Message Repository
 *
 * Handles database operations for messages, conversations, and related entities.
 */
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import {
  Conversation,
  ConversationParticipant,
  Message,
  MessageAttachment,
  MessageReceipt,
  MessageTemplate,
  ConversationType,
  MessageStatus,
  ConversationCreateData,
  MessageCreateData,
  MessageTemplateCreateData,
  MessageTemplateUpdateData,
  ConversationSummary
} from '@/types/message';

/**
 * Map conversation from database row
 */
function mapConversationFromDb(row: any): Conversation {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    caseId: row.case_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastMessageAt: row.last_message_at,
    metadata: row.metadata,
  };
}

/**
 * Map conversation participant from database row
 */
function mapParticipantFromDb(row: any): ConversationParticipant {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    userId: row.user_id,
    joinedAt: row.joined_at,
    leftAt: row.left_at,
    isAdmin: row.is_admin,
    lastReadAt: row.last_read_at,
    user: row.user_first_name ? {
      id: row.user_id,
      firstName: row.user_first_name,
      lastName: row.user_last_name,
      email: row.user_email,
      avatarUrl: row.user_avatar_url,
    } : undefined,
  };
}

/**
 * Map message from database row
 */
function mapMessageFromDb(row: any): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    parentId: row.parent_id,
    isSystemMessage: row.is_system_message,
    metadata: row.metadata,
    sender: row.sender_first_name ? {
      id: row.sender_id,
      firstName: row.sender_first_name,
      lastName: row.sender_last_name,
      avatarUrl: row.sender_avatar_url,
    } : undefined,
  };
}

/**
 * Map message attachment from database row
 */
function mapAttachmentFromDb(row: any): MessageAttachment {
  return {
    id: row.id,
    messageId: row.message_id,
    fileName: row.file_name,
    fileType: row.file_type,
    fileSize: row.file_size,
    filePath: row.file_path,
    uploadedAt: row.uploaded_at,
    uploadedBy: row.uploaded_by,
  };
}

/**
 * Map message receipt from database row
 */
function mapReceiptFromDb(row: any): MessageReceipt {
  return {
    id: row.id,
    messageId: row.message_id,
    userId: row.user_id,
    status: row.status,
    timestamp: row.timestamp,
  };
}

/**
 * Map message template from database row
 */
function mapTemplateFromDb(row: any): MessageTemplate {
  return {
    id: row.id,
    name: row.name,
    content: row.content,
    category: row.category,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isActive: row.is_active,
    variables: row.variables,
    metadata: row.metadata,
  };
}

/**
 * Create a new conversation
 */
export async function createConversation(
  data: ConversationCreateData,
  userId: string
): Promise<Conversation> {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Create conversation
    const conversationId = uuidv4();
    const now = new Date();

    const conversationResult = await client.query(
      `INSERT INTO conversations (
        id, title, type, case_id, created_by, created_at, updated_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        conversationId,
        data.title || null,
        data.type,
        data.caseId || null,
        userId,
        now,
        now,
        data.metadata ? JSON.stringify(data.metadata) : null,
      ]
    );

    // Add participants
    const participantIds = [...new Set([userId, ...data.participantIds])];

    for (const participantId of participantIds) {
      await client.query(
        `INSERT INTO conversation_participants (
          id, conversation_id, user_id, joined_at, is_admin
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          uuidv4(),
          conversationId,
          participantId,
          now,
          participantId === userId, // Creator is admin
        ]
      );
    }

    // Add initial message if provided
    if (data.initialMessage) {
      const messageId = uuidv4();

      await client.query(
        `INSERT INTO messages (
          id, conversation_id, sender_id, content, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          messageId,
          conversationId,
          userId,
          data.initialMessage,
          MessageStatus.SENT,
          now,
          now,
        ]
      );

      // Update conversation last_message_at
      await client.query(
        `UPDATE conversations SET last_message_at = $1 WHERE id = $2`,
        [now, conversationId]
      );
    }

    await client.query('COMMIT');

    return mapConversationFromDb(conversationResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get conversation by ID
 */
export async function getConversationById(id: string): Promise<Conversation | null> {
  const result = await db.query(
    `SELECT * FROM conversations WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapConversationFromDb(result.rows[0]);
}

/**
 * Get conversation with participants and messages
 */
export async function getConversationWithDetails(id: string): Promise<Conversation | null> {
  // Get conversation
  const conversation = await getConversationById(id);

  if (!conversation) {
    return null;
  }

  // Get participants
  const participantsResult = await db.query(
    `SELECT
      cp.*,
      u.first_name as user_first_name,
      u.last_name as user_last_name,
      u.email as user_email,
      u.avatar_url as user_avatar_url
    FROM conversation_participants cp
    JOIN users u ON cp.user_id = u.id
    WHERE cp.conversation_id = $1
    ORDER BY cp.joined_at ASC`,
    [id]
  );

  conversation.participants = participantsResult.rows.map(mapParticipantFromDb);

  return conversation;
}

/**
 * Get conversations for user
 */
export async function getConversationsForUser(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<ConversationSummary[]> {
  const result = await db.query(
    `WITH user_conversations AS (
      SELECT c.*
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE cp.user_id = $1 AND cp.left_at IS NULL
    ),
    last_messages AS (
      SELECT DISTINCT ON (m.conversation_id)
        m.conversation_id,
        m.content,
        m.sender_id,
        m.created_at,
        u.first_name || ' ' || u.last_name AS sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id IN (SELECT id FROM user_conversations)
      ORDER BY m.conversation_id, m.created_at DESC
    ),
    unread_counts AS (
      SELECT
        m.conversation_id,
        COUNT(*) AS unread_count
      FROM messages m
      JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE
        cp.user_id = $1 AND
        m.sender_id != $1 AND
        (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
      GROUP BY m.conversation_id
    )
    SELECT
      uc.*,
      lm.content AS last_message_content,
      lm.sender_id AS last_message_sender_id,
      lm.sender_name AS last_message_sender_name,
      lm.created_at AS last_message_created_at,
      COALESCE(uc.unread_count, 0) AS unread_count
    FROM user_conversations uc
    LEFT JOIN last_messages lm ON uc.id = lm.conversation_id
    LEFT JOIN unread_counts uc ON uc.id = uc.conversation_id
    ORDER BY COALESCE(uc.last_message_at, uc.created_at) DESC
    LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  // Get participants for each conversation
  const conversations: ConversationSummary[] = [];

  for (const row of result.rows) {
    const participantsResult = await db.query(
      `SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.avatar_url
      FROM conversation_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.conversation_id = $1 AND cp.left_at IS NULL
      LIMIT 10`,
      [row.id]
    );

    conversations.push({
      id: row.id,
      title: row.title,
      type: row.type,
      caseId: row.case_id,
      lastMessageAt: row.last_message_at,
      lastMessage: row.last_message_content ? {
        content: row.last_message_content,
        senderId: row.last_message_sender_id,
        senderName: row.last_message_sender_name,
        createdAt: row.last_message_created_at,
      } : undefined,
      unreadCount: parseInt(row.unread_count) || 0,
      participants: participantsResult.rows.map(p => ({
        id: p.id,
        firstName: p.first_name,
        lastName: p.last_name,
        avatarUrl: p.avatar_url,
      })),
    });
  }

  return conversations;
}

/**
 * Create a new message
 */
export async function createMessage(
  data: MessageCreateData,
  senderId: string
): Promise<Message> {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Create message
    const messageId = uuidv4();
    const now = new Date();

    const messageResult = await client.query(
      `INSERT INTO messages (
        id, conversation_id, sender_id, content, status, created_at, updated_at,
        parent_id, is_system_message, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        messageId,
        data.conversationId,
        senderId,
        data.content,
        MessageStatus.SENT,
        now,
        now,
        data.parentId || null,
        data.isSystemMessage || false,
        data.metadata ? JSON.stringify(data.metadata) : null,
      ]
    );

    // Update conversation last_message_at
    await client.query(
      `UPDATE conversations SET last_message_at = $1, updated_at = $1 WHERE id = $2`,
      [now, data.conversationId]
    );

    // Add attachments if provided
    if (data.attachments && data.attachments.length > 0) {
      for (const attachment of data.attachments) {
        // Implementation for file upload will be handled in the service layer
        await client.query(
          `INSERT INTO message_attachments (
            id, message_id, file_name, file_type, file_size, file_path, uploaded_at, uploaded_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            uuidv4(),
            messageId,
            attachment.fileName,
            attachment.fileType,
            attachment.fileSize,
            '', // File path will be updated after upload
            now,
            senderId,
          ]
        );
      }
    }

    // Create receipts for all participants
    const participantsResult = await client.query(
      `SELECT user_id FROM conversation_participants
       WHERE conversation_id = $1 AND left_at IS NULL`,
      [data.conversationId]
    );

    for (const participant of participantsResult.rows) {
      // Skip receipt for sender
      if (participant.user_id === senderId) continue;

      await client.query(
        `INSERT INTO message_receipts (
          id, message_id, user_id, status, timestamp
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          uuidv4(),
          messageId,
          participant.user_id,
          MessageStatus.SENT,
          now,
        ]
      );
    }

    await client.query('COMMIT');

    return mapMessageFromDb(messageResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get messages for a conversation
 */
export async function getMessagesForConversation(
  conversationId: string,
  limit: number = 50,
  before?: Date
): Promise<Message[]> {
  let query = `
    SELECT
      m.*,
      u.first_name as sender_first_name,
      u.last_name as sender_last_name,
      u.avatar_url as sender_avatar_url
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.conversation_id = $1
  `;

  const params: any[] = [conversationId];

  if (before) {
    query += ` AND m.created_at < $2`;
    params.push(before);
  }

  query += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  const result = await db.query(query, params);

  return result.rows.map(mapMessageFromDb);
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Update participant's last_read_at
    const now = new Date();
    await client.query(
      `UPDATE conversation_participants
       SET last_read_at = $1
       WHERE conversation_id = $2 AND user_id = $3`,
      [now, conversationId, userId]
    );

    // Update message receipts
    await client.query(
      `UPDATE message_receipts
       SET status = $1, timestamp = $2
       WHERE message_id IN (
         SELECT id FROM messages
         WHERE conversation_id = $3 AND sender_id != $4
       )
       AND user_id = $4
       AND status != $1`,
      [MessageStatus.READ, now, conversationId, userId]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Create a message template
 */
export async function createMessageTemplate(
  data: MessageTemplateCreateData,
  userId: string
): Promise<MessageTemplate> {
  const id = uuidv4();
  const now = new Date();

  const result = await db.query(
    `INSERT INTO message_templates (
      id, name, content, category, created_by, created_at, updated_at,
      is_active, variables, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      id,
      data.name,
      data.content,
      data.category,
      userId,
      now,
      now,
      data.isActive !== undefined ? data.isActive : true,
      data.variables ? JSON.stringify(data.variables) : null,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ]
  );

  return mapTemplateFromDb(result.rows[0]);
}

/**
 * Get message templates
 */
export async function getMessageTemplates(
  category?: string,
  activeOnly: boolean = true
): Promise<MessageTemplate[]> {
  let query = `SELECT * FROM message_templates`;
  const params: any[] = [];

  if (category || activeOnly) {
    query += ` WHERE`;

    if (category) {
      query += ` category = $1`;
      params.push(category);
    }

    if (activeOnly) {
      if (params.length > 0) {
        query += ` AND`;
      }
      query += ` is_active = $${params.length + 1}`;
      params.push(true);
    }
  }

  query += ` ORDER BY category, name`;

  const result = await db.query(query, params);

  return result.rows.map(mapTemplateFromDb);
}

/**
 * Get message template by ID
 */
export async function getMessageTemplateById(id: string): Promise<MessageTemplate | null> {
  const result = await db.query(
    `SELECT * FROM message_templates WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapTemplateFromDb(result.rows[0]);
}

/**
 * Update message template
 */
export async function updateMessageTemplate(
  id: string,
  data: MessageTemplateUpdateData
): Promise<MessageTemplate | null> {
  // Build update query
  const updates: string[] = [];
  const params: any[] = [id];

  if (data.name !== undefined) {
    updates.push(`name = $${params.length + 1}`);
    params.push(data.name);
  }

  if (data.content !== undefined) {
    updates.push(`content = $${params.length + 1}`);
    params.push(data.content);
  }

  if (data.category !== undefined) {
    updates.push(`category = $${params.length + 1}`);
    params.push(data.category);
  }

  if (data.isActive !== undefined) {
    updates.push(`is_active = $${params.length + 1}`);
    params.push(data.isActive);
  }

  if (data.variables !== undefined) {
    updates.push(`variables = $${params.length + 1}`);
    params.push(JSON.stringify(data.variables));
  }

  if (data.metadata !== undefined) {
    updates.push(`metadata = $${params.length + 1}`);
    params.push(JSON.stringify(data.metadata));
  }

  // Add updated_at
  updates.push(`updated_at = $${params.length + 1}`);
  params.push(new Date());

  if (updates.length === 0) {
    return getMessageTemplateById(id);
  }

  const result = await db.query(
    `UPDATE message_templates SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapTemplateFromDb(result.rows[0]);
}
