/**
 * Messaging Context
 * 
 * React context for the messaging system.
 */
import React, { createContext, useContext, ReactNode } from 'react';
import { useMessaging } from '@/hooks/useMessaging';
import {
  Conversation,
  Message,
  ConversationSummary,
  ConversationType,
} from '@/types/message';

// Context type
interface MessagingContextType {
  isConnected: boolean;
  conversations: ConversationSummary[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  typingUsers: Record<string, string[]>;
  fetchConversations: () => Promise<void>;
  fetchConversation: (conversationId: string) => Promise<void>;
  fetchMessages: (conversationId: string, limit?: number, before?: Date) => Promise<void>;
  createConversation: (
    participantIds: string[],
    initialMessage?: string,
    title?: string,
    type?: ConversationType,
    caseId?: string,
    metadata?: Record<string, any>
  ) => Promise<Conversation | null>;
  sendMessage: (
    conversationId: string,
    content: string,
    parentId?: string,
    metadata?: Record<string, any>,
    attachments?: any[]
  ) => Promise<Message | null>;
  markMessagesAsRead: (conversationId: string) => Promise<void>;
  sendTypingIndicator: (conversationId: string, isTyping: boolean) => void;
  addUserToConversation: (conversationId: string, userId: string) => Promise<any>;
}

// Create context
const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

// Provider props
interface MessagingProviderProps {
  children: ReactNode;
}

/**
 * Messaging Provider
 */
export function MessagingProvider({ children }: MessagingProviderProps) {
  const messaging = useMessaging();
  
  return (
    <MessagingContext.Provider value={messaging}>
      {children}
    </MessagingContext.Provider>
  );
}

/**
 * Hook for using the messaging context
 */
export function useMessagingContext() {
  const context = useContext(MessagingContext);
  
  if (context === undefined) {
    throw new Error('useMessagingContext must be used within a MessagingProvider');
  }
  
  return context;
}
