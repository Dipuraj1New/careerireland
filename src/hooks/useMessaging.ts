/**
 * Messaging Hook
 * 
 * React hook for using the messaging system in the frontend.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';
import {
  Conversation,
  Message,
  ConversationSummary,
  ConversationType,
  MessageStatus,
} from '@/types/message';

// Socket.io client instance
let socket: Socket | null = null;

/**
 * Hook for using the messaging system
 */
export function useMessaging() {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  
  // Keep track of the current conversation ID
  const currentConversationIdRef = useRef<string | null>(null);
  
  /**
   * Initialize Socket.IO connection
   */
  const initializeSocket = useCallback(() => {
    if (!session?.user?.id) return;
    
    // Create socket connection if it doesn't exist
    if (!socket) {
      socket = io({
        path: '/api/socket',
        autoConnect: true,
      });
    }
    
    // Set up event listeners
    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      
      // Authenticate with the server
      socket.emit('authenticate', session.user.accessToken);
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });
    
    socket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data);
    });
    
    socket.on('error', (data) => {
      console.error('Socket error:', data);
      setError(data.message);
    });
    
    socket.on('new_message', (data) => {
      // Add new message to the current conversation
      if (data.message.conversationId === currentConversationIdRef.current) {
        setMessages((prevMessages) => [data.message, ...prevMessages]);
      }
      
      // Update conversation list
      updateConversationWithNewMessage(data.message);
      
      // Mark as read if the conversation is currently open
      if (data.message.conversationId === currentConversationIdRef.current) {
        markMessagesAsRead(data.message.conversationId);
      }
    });
    
    socket.on('messages_read', (data) => {
      // Update message read status
      if (data.conversationId === currentConversationIdRef.current) {
        setMessages((prevMessages) =>
          prevMessages.map((message) => {
            if (message.senderId !== data.userId) {
              return message;
            }
            
            return {
              ...message,
              status: MessageStatus.READ,
            };
          })
        );
      }
    });
    
    socket.on('user_typing', (data) => {
      if (data.conversationId === currentConversationIdRef.current) {
        setTypingUsers((prevTypingUsers) => {
          const conversationTypingUsers = [...(prevTypingUsers[data.conversationId] || [])];
          
          if (data.isTyping) {
            // Add user to typing users if not already there
            if (!conversationTypingUsers.includes(data.userId)) {
              conversationTypingUsers.push(data.userId);
            }
          } else {
            // Remove user from typing users
            const index = conversationTypingUsers.indexOf(data.userId);
            if (index !== -1) {
              conversationTypingUsers.splice(index, 1);
            }
          }
          
          return {
            ...prevTypingUsers,
            [data.conversationId]: conversationTypingUsers,
          };
        });
      }
    });
    
    socket.on('new_conversation', (data) => {
      // Add new conversation to the list
      setConversations((prevConversations) => [data.conversation, ...prevConversations]);
    });
    
    socket.on('user_added', (data) => {
      // Update current conversation if it's the one being modified
      if (data.conversationId === currentConversationIdRef.current && currentConversation) {
        setCurrentConversation((prevConversation) => {
          if (!prevConversation) return null;
          
          return {
            ...prevConversation,
            participants: [
              ...(prevConversation.participants || []),
              {
                id: data.user.id,
                conversationId: data.conversationId,
                userId: data.user.id,
                joinedAt: new Date(),
                isAdmin: false,
                user: {
                  id: data.user.id,
                  firstName: data.user.firstName,
                  lastName: data.user.lastName,
                  email: '',
                  avatarUrl: data.user.avatarUrl,
                },
              },
            ],
          };
        });
      }
    });
    
    // Connect to the server
    if (!socket.connected) {
      socket.connect();
    }
    
    // Clean up on unmount
    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('authenticated');
        socket.off('error');
        socket.off('new_message');
        socket.off('messages_read');
        socket.off('user_typing');
        socket.off('new_conversation');
        socket.off('user_added');
      }
    };
  }, [session?.user?.id, session?.user?.accessToken]);
  
  /**
   * Update conversation list with a new message
   */
  const updateConversationWithNewMessage = useCallback((message: Message) => {
    setConversations((prevConversations) => {
      // Find the conversation
      const conversationIndex = prevConversations.findIndex(
        (c) => c.id === message.conversationId
      );
      
      if (conversationIndex === -1) {
        // Conversation not found, fetch it
        fetchConversations();
        return prevConversations;
      }
      
      // Update the conversation
      const updatedConversations = [...prevConversations];
      const conversation = { ...updatedConversations[conversationIndex] };
      
      // Update last message
      conversation.lastMessage = {
        content: message.content,
        senderId: message.senderId,
        senderName: message.sender ? `${message.sender.firstName} ${message.sender.lastName}` : 'Unknown',
        createdAt: message.createdAt,
      };
      
      // Update last message time
      conversation.lastMessageAt = message.createdAt;
      
      // Increment unread count if the message is not from the current user
      if (message.senderId !== session?.user?.id) {
        conversation.unreadCount = (conversation.unreadCount || 0) + 1;
      }
      
      // Remove from current position
      updatedConversations.splice(conversationIndex, 1);
      
      // Add to the beginning
      return [conversation, ...updatedConversations];
    });
  }, [session?.user?.id]);
  
  /**
   * Fetch conversations
   */
  const fetchConversations = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/messages');
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      const data = await response.json();
      setConversations(data.conversations);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);
  
  /**
   * Fetch a specific conversation
   */
  const fetchConversation = useCallback(async (conversationId: string) => {
    if (!session?.user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/messages/${conversationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversation');
      }
      
      const data = await response.json();
      setCurrentConversation(data.conversation);
      currentConversationIdRef.current = conversationId;
      
      // Mark messages as read
      markMessagesAsRead(conversationId);
      
      // Fetch messages
      fetchMessages(conversationId);
    } catch (err: any) {
      console.error('Error fetching conversation:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);
  
  /**
   * Fetch messages for a conversation
   */
  const fetchMessages = useCallback(async (
    conversationId: string,
    limit: number = 50,
    before?: Date
  ) => {
    if (!session?.user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      let url = `/api/messages/${conversationId}/messages?limit=${limit}`;
      
      if (before) {
        url += `&before=${before.toISOString()}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      
      if (before) {
        // Append messages
        setMessages((prevMessages) => [...prevMessages, ...data.messages]);
      } else {
        // Replace messages
        setMessages(data.messages);
      }
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);
  
  /**
   * Create a new conversation
   */
  const createConversation = useCallback(async (
    participantIds: string[],
    initialMessage?: string,
    title?: string,
    type: ConversationType = ConversationType.DIRECT,
    caseId?: string,
    metadata?: Record<string, any>
  ) => {
    if (!session?.user?.id) return null;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantIds,
          initialMessage,
          title,
          type,
          caseId,
          metadata,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }
      
      const data = await response.json();
      
      // Add to conversations list
      setConversations((prevConversations) => [data.conversation, ...prevConversations]);
      
      return data.conversation;
    } catch (err: any) {
      console.error('Error creating conversation:', err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);
  
  /**
   * Send a message
   */
  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    parentId?: string,
    metadata?: Record<string, any>,
    attachments?: any[]
  ) => {
    if (!session?.user?.id) return null;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/messages/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          parentId,
          metadata,
          attachments,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const data = await response.json();
      
      // Add to messages list
      setMessages((prevMessages) => [data.message, ...prevMessages]);
      
      // Update conversation list
      updateConversationWithNewMessage(data.message);
      
      return data.message;
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, updateConversationWithNewMessage]);
  
  /**
   * Mark messages as read
   */
  const markMessagesAsRead = useCallback(async (conversationId: string) => {
    if (!session?.user?.id) return;
    
    try {
      // Update conversation unread count
      setConversations((prevConversations) =>
        prevConversations.map((conversation) => {
          if (conversation.id === conversationId) {
            return {
              ...conversation,
              unreadCount: 0,
            };
          }
          return conversation;
        })
      );
      
      // Send API request
      await fetch(`/api/messages/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_read',
        }),
      });
    } catch (err: any) {
      console.error('Error marking messages as read:', err);
    }
  }, [session?.user?.id]);
  
  /**
   * Send typing indicator
   */
  const sendTypingIndicator = useCallback((
    conversationId: string,
    isTyping: boolean
  ) => {
    if (!socket || !isConnected || !session?.user?.id) return;
    
    socket.emit('typing', {
      conversationId,
      isTyping,
    });
  }, [isConnected, session?.user?.id]);
  
  /**
   * Add user to conversation
   */
  const addUserToConversation = useCallback(async (
    conversationId: string,
    userId: string
  ) => {
    if (!session?.user?.id) return null;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/messages/${conversationId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add user to conversation');
      }
      
      const data = await response.json();
      return data.participant;
    } catch (err: any) {
      console.error('Error adding user to conversation:', err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);
  
  // Initialize socket connection when session changes
  useEffect(() => {
    const cleanup = initializeSocket();
    
    // Fetch conversations on mount
    fetchConversations();
    
    return cleanup;
  }, [initializeSocket, fetchConversations]);
  
  return {
    isConnected,
    conversations,
    currentConversation,
    messages,
    isLoading,
    error,
    typingUsers,
    fetchConversations,
    fetchConversation,
    fetchMessages,
    createConversation,
    sendMessage,
    markMessagesAsRead,
    sendTypingIndicator,
    addUserToConversation,
  };
}
