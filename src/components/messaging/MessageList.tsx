/**
 * Message List Component
 * 
 * Displays messages in a conversation.
 */
import React, { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useMessagingContext } from '@/contexts/MessagingContext';
import { format } from 'date-fns';
import { Avatar, Box, CircularProgress, Divider, Paper, Typography } from '@mui/material';
import { Message, MessageStatus } from '@/types/message';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';

interface MessageListProps {
  conversationId: string;
}

export default function MessageList({ conversationId }: MessageListProps) {
  const { data: session } = useSession();
  const {
    messages,
    isLoading,
    error,
    fetchMessages,
    typingUsers,
    currentConversation,
  } = useMessagingContext();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Fetch messages on mount or when conversation changes
  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
    }
  }, [conversationId, fetchMessages]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Load more messages when scrolling to top
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop } = messagesContainerRef.current;
      
      if (scrollTop === 0 && messages.length > 0) {
        // Load more messages
        const oldestMessage = messages[messages.length - 1];
        fetchMessages(conversationId, 20, oldestMessage.createdAt);
      }
    }
  };
  
  // Format message time
  const formatMessageTime = (date: Date) => {
    return format(new Date(date), 'h:mm a');
  };
  
  // Format message date
  const formatMessageDate = (date: Date) => {
    return format(new Date(date), 'MMMM d, yyyy');
  };
  
  // Group messages by date
  const groupedMessages: { [date: string]: Message[] } = {};
  
  messages.forEach((message) => {
    const date = formatMessageDate(message.createdAt);
    
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    
    groupedMessages[date].push(message);
  });
  
  // Get typing users for this conversation
  const conversationTypingUsers = typingUsers[conversationId] || [];
  
  // Find user names for typing users
  const typingUserNames: string[] = [];
  
  if (currentConversation?.participants) {
    conversationTypingUsers.forEach((userId) => {
      const participant = currentConversation.participants?.find(
        (p) => p.userId === userId
      );
      
      if (participant?.user) {
        typingUserNames.push(`${participant.user.firstName} ${participant.user.lastName}`);
      }
    });
  }
  
  // Render typing indicator
  const renderTypingIndicator = () => {
    if (typingUserNames.length === 0) {
      return null;
    }
    
    let typingText = '';
    
    if (typingUserNames.length === 1) {
      typingText = `${typingUserNames[0]} is typing...`;
    } else if (typingUserNames.length === 2) {
      typingText = `${typingUserNames[0]} and ${typingUserNames[1]} are typing...`;
    } else {
      typingText = 'Several people are typing...';
    }
    
    return (
      <Box sx={{ p: 1, display: 'flex', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          {typingText}
        </Typography>
        <Box sx={{ display: 'flex', ml: 1 }}>
          <span className="typing-dot"></span>
          <span className="typing-dot"></span>
          <span className="typing-dot"></span>
        </Box>
      </Box>
    );
  };
  
  // Render message status icon
  const renderMessageStatus = (message: Message) => {
    if (message.senderId !== session?.user?.id) {
      return null;
    }
    
    switch (message.status) {
      case MessageStatus.SENT:
        return <DoneIcon fontSize="small" color="action" />;
      case MessageStatus.DELIVERED:
        return <DoneIcon fontSize="small" color="primary" />;
      case MessageStatus.READ:
        return <DoneAllIcon fontSize="small" color="primary" />;
      default:
        return null;
    }
  };
  
  if (isLoading && messages.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }
  
  return (
    <Box
      ref={messagesContainerRef}
      sx={{
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column-reverse',
        p: 2,
      }}
      onScroll={handleScroll}
    >
      {renderTypingIndicator()}
      
      <div ref={messagesEndRef} />
      
      {Object.keys(groupedMessages).map((date) => (
        <Box key={date} sx={{ mb: 2 }}>
          <Divider sx={{ my: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {date}
            </Typography>
          </Divider>
          
          {groupedMessages[date].map((message) => {
            const isCurrentUser = message.senderId === session?.user?.id;
            
            return (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                  mb: 2,
                }}
              >
                {!isCurrentUser && (
                  <Avatar
                    src={message.sender?.avatarUrl}
                    sx={{ mr: 1, width: 32, height: 32 }}
                  />
                )}
                
                <Box
                  sx={{
                    maxWidth: '70%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  {!isCurrentUser && message.sender && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      {message.sender.firstName} {message.sender.lastName}
                    </Typography>
                  )}
                  
                  <Paper
                    elevation={1}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: isCurrentUser ? 'primary.light' : 'background.default',
                      color: isCurrentUser ? 'primary.contrastText' : 'text.primary',
                    }}
                  >
                    <Typography variant="body1">{message.content}</Typography>
                  </Paper>
                  
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mt: 0.5,
                      mx: 1,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {formatMessageTime(message.createdAt)}
                    </Typography>
                    
                    {renderMessageStatus(message)}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
