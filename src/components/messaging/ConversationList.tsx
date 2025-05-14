/**
 * Conversation List Component
 * 
 * Displays a list of conversations.
 */
import React, { useEffect } from 'react';
import { useMessagingContext } from '@/contexts/MessagingContext';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, Badge, Box, List, ListItem, ListItemAvatar, ListItemButton, ListItemText, Typography } from '@mui/material';

interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId?: string;
}

export default function ConversationList({
  onSelectConversation,
  selectedConversationId,
}: ConversationListProps) {
  const {
    conversations,
    isLoading,
    error,
    fetchConversations,
  } = useMessagingContext();
  
  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);
  
  // Format conversation title
  const getConversationTitle = (conversation: any) => {
    if (conversation.title) {
      return conversation.title;
    }
    
    // For direct conversations, use the other participant's name
    if (conversation.participants && conversation.participants.length > 0) {
      return conversation.participants
        .map((p: any) => `${p.firstName} ${p.lastName}`)
        .join(', ');
    }
    
    return 'Unnamed Conversation';
  };
  
  // Get avatar for conversation
  const getConversationAvatar = (conversation: any) => {
    // For direct conversations, use the other participant's avatar
    if (conversation.participants && conversation.participants.length > 0) {
      return conversation.participants[0].avatarUrl;
    }
    
    return null;
  };
  
  // Format last message time
  const formatLastMessageTime = (date: Date) => {
    if (!date) return '';
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };
  
  if (isLoading && conversations.length === 0) {
    return <Typography>Loading conversations...</Typography>;
  }
  
  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }
  
  if (conversations.length === 0) {
    return <Typography>No conversations found.</Typography>;
  }
  
  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {conversations.map((conversation) => (
        <ListItem
          key={conversation.id}
          disablePadding
          secondaryAction={
            conversation.unreadCount > 0 ? (
              <Badge
                badgeContent={conversation.unreadCount}
                color="primary"
                sx={{ mr: 2 }}
              />
            ) : null
          }
        >
          <ListItemButton
            selected={selectedConversationId === conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
          >
            <ListItemAvatar>
              <Avatar src={getConversationAvatar(conversation)} />
            </ListItemAvatar>
            <ListItemText
              primary={getConversationTitle(conversation)}
              secondary={
                <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.primary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '70%',
                    }}
                  >
                    {conversation.lastMessage?.content || 'No messages yet'}
                  </Typography>
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                  >
                    {conversation.lastMessageAt
                      ? formatLastMessageTime(conversation.lastMessageAt)
                      : ''}
                  </Typography>
                </Box>
              }
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}
