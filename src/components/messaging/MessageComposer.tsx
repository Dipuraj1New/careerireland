/**
 * Message Composer Component
 * 
 * Allows users to compose and send messages.
 */
import React, { useState, useRef, useEffect } from 'react';
import { useMessagingContext } from '@/contexts/MessagingContext';
import {
  Box,
  IconButton,
  InputBase,
  Paper,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';

interface MessageComposerProps {
  conversationId: string;
}

export default function MessageComposer({ conversationId }: MessageComposerProps) {
  const {
    sendMessage,
    isLoading,
    sendTypingIndicator,
  } = useMessagingContext();
  
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [conversationId]);
  
  // Handle typing indicator
  useEffect(() => {
    if (message && !isTyping) {
      setIsTyping(true);
      sendTypingIndicator(conversationId, true);
    }
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        sendTypingIndicator(conversationId, false);
      }
    }, 3000);
    
    // Cleanup
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, isTyping, conversationId, sendTypingIndicator]);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };
  
  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Handle send message
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    try {
      await sendMessage(conversationId, message);
      setMessage('');
      setIsTyping(false);
      sendTypingIndicator(conversationId, false);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (!files || files.length === 0) return;
    
    // TODO: Implement file upload
    console.log('Files selected:', files);
  };
  
  // Format text
  const formatText = (format: 'bold' | 'italic' | 'list') => {
    if (!inputRef.current) return;
    
    const input = inputRef.current;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const selectedText = message.substring(start, end);
    
    let formattedText = '';
    let cursorPosition = 0;
    
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        cursorPosition = start + 2;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        cursorPosition = start + 1;
        break;
      case 'list':
        formattedText = `\n- ${selectedText}`;
        cursorPosition = start + 3;
        break;
    }
    
    const newMessage =
      message.substring(0, start) + formattedText + message.substring(end);
    
    setMessage(newMessage);
    
    // Focus and set cursor position
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(
        cursorPosition,
        cursorPosition + selectedText.length
      );
    }, 0);
  };
  
  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', mb: 1 }}>
        <Tooltip title="Bold">
          <IconButton
            size="small"
            onClick={() => formatText('bold')}
          >
            <FormatBoldIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Italic">
          <IconButton
            size="small"
            onClick={() => formatText('italic')}
          >
            <FormatItalicIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="List">
          <IconButton
            size="small"
            onClick={() => formatText('list')}
          >
            <FormatListBulletedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <InputBase
          inputRef={inputRef}
          fullWidth
          multiline
          maxRows={4}
          placeholder="Type a message..."
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          sx={{ flex: 1 }}
        />
        
        <Tooltip title="Add emoji">
          <IconButton>
            <EmojiEmotionsIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Attach file">
          <IconButton component="label">
            <AttachFileIcon />
            <input
              type="file"
              hidden
              multiple
              onChange={handleFileUpload}
            />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Send message">
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={isLoading || !message.trim()}
          >
            {isLoading ? (
              <CircularProgress size={24} />
            ) : (
              <SendIcon />
            )}
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
}
