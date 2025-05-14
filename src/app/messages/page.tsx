'use client';

/**
 * Messaging Page
 * 
 * Main page for the messaging system.
 */
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessagingProvider } from '@/contexts/MessagingContext';
import ConversationList from '@/components/messaging/ConversationList';
import MessageList from '@/components/messaging/MessageList';
import MessageComposer from '@/components/messaging/MessageComposer';
import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { ConversationType } from '@/types/message';
import { useMessagingContext } from '@/contexts/MessagingContext';

/**
 * New Conversation Dialog
 */
function NewConversationDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: (conversationId?: string) => void;
}) {
  const {
    createConversation,
    isLoading,
  } = useMessagingContext();
  
  const [participants, setParticipants] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ConversationType>(ConversationType.DIRECT);
  
  // Mock user data for demo
  const users = [
    { id: 'user-1', name: 'John Doe' },
    { id: 'user-2', name: 'Jane Smith' },
    { id: 'user-3', name: 'Bob Johnson' },
    { id: 'user-4', name: 'Alice Williams' },
  ];
  
  const handleSubmit = async () => {
    if (participants.length === 0) return;
    
    const participantIds = participants.map((p) => p.id);
    
    const conversation = await createConversation(
      participantIds,
      message,
      title,
      type
    );
    
    if (conversation) {
      onClose(conversation.id);
    }
  };
  
  return (
    <Dialog open={open} onClose={() => onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>New Conversation</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Conversation Type</InputLabel>
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as ConversationType)}
              label="Conversation Type"
            >
              <MenuItem value={ConversationType.DIRECT}>Direct Message</MenuItem>
              <MenuItem value={ConversationType.GROUP}>Group Conversation</MenuItem>
              <MenuItem value={ConversationType.CASE}>Case Discussion</MenuItem>
            </Select>
          </FormControl>
          
          {type !== ConversationType.DIRECT && (
            <TextField
              fullWidth
              label="Conversation Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{ mb: 2 }}
            />
          )}
          
          <Autocomplete
            multiple
            options={users}
            getOptionLabel={(option) => option.name}
            value={participants}
            onChange={(_, newValue) => setParticipants(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Participants"
                placeholder="Add participants"
              />
            )}
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Initial Message"
            multiline
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose()}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading || participants.length === 0}
        >
          Create Conversation
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Messaging Page Content
 */
function MessagingPageContent() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const conversationId = searchParams.get('id');
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);
  
  // Handle conversation selection
  const handleSelectConversation = (id: string) => {
    router.push(`/messages?id=${id}`);
  };
  
  // Handle new conversation
  const handleNewConversation = () => {
    setShowNewConversationDialog(true);
  };
  
  // Handle dialog close
  const handleDialogClose = (newConversationId?: string) => {
    setShowNewConversationDialog(false);
    
    if (newConversationId) {
      handleSelectConversation(newConversationId);
    }
  };
  
  // Handle back button (mobile only)
  const handleBack = () => {
    router.push('/messages');
  };
  
  return (
    <Container maxWidth="xl" sx={{ py: 4, height: 'calc(100vh - 64px)' }}>
      <Paper elevation={3} sx={{ height: '100%', overflow: 'hidden' }}>
        <Grid container sx={{ height: '100%' }}>
          {/* Conversation List */}
          {(!isMobile || !conversationId) && (
            <Grid
              item
              xs={12}
              md={4}
              lg={3}
              sx={{
                height: '100%',
                borderRight: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box
                sx={{
                  p: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="h6">Messages</Typography>
                <IconButton
                  color="primary"
                  onClick={handleNewConversation}
                >
                  <AddIcon />
                </IconButton>
              </Box>
              
              <Box sx={{ height: 'calc(100% - 64px)', overflow: 'auto' }}>
                <ConversationList
                  onSelectConversation={handleSelectConversation}
                  selectedConversationId={conversationId || undefined}
                />
              </Box>
            </Grid>
          )}
          
          {/* Message Area */}
          {(!isMobile || conversationId) && (
            <Grid
              item
              xs={12}
              md={8}
              lg={9}
              sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              {conversationId ? (
                <>
                  {/* Conversation Header */}
                  <Box
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {isMobile && (
                      <IconButton
                        edge="start"
                        onClick={handleBack}
                        sx={{ mr: 1 }}
                      >
                        <ArrowBackIcon />
                      </IconButton>
                    )}
                    
                    <Typography variant="h6">Conversation</Typography>
                  </Box>
                  
                  {/* Messages */}
                  <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <MessageList conversationId={conversationId} />
                  </Box>
                  
                  {/* Message Composer */}
                  <MessageComposer conversationId={conversationId} />
                </>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                  }}
                >
                  <Typography variant="h6" color="text.secondary">
                    Select a conversation or start a new one
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleNewConversation}
                    sx={{ mt: 2 }}
                  >
                    New Conversation
                  </Button>
                </Box>
              )}
            </Grid>
          )}
        </Grid>
      </Paper>
      
      {/* New Conversation Dialog */}
      <NewConversationDialog
        open={showNewConversationDialog}
        onClose={handleDialogClose}
      />
    </Container>
  );
}

/**
 * Messaging Page
 */
export default function MessagingPage() {
  return (
    <MessagingProvider>
      <MessagingPageContent />
    </MessagingProvider>
  );
}
