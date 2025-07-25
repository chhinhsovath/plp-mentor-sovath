import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Avatar,
  Badge,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  Fade,
  Slide,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachIcon,
  EmojiEmotions as EmojiIcon,
  VideoCam as VideoIcon,
  Call as CallIcon,
  MoreVert as MoreIcon,
  Search as SearchIcon,
  ArrowBack as BackIcon,
  Info as InfoIcon,
  Archive as ArchiveIcon,
  VolumeOff as MuteIcon,
  VolumeUp as UnmuteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Reply as ReplyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  ImageOutlined as ImageIcon,
  VideoFileOutlined as VideoFileIcon,
  AudioFileOutlined as AudioIcon,
  InsertDriveFileOutlined as FileIcon,
  MicOutlined as MicIcon,
  StopOutlined as StopIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format, formatDistanceToNow, isToday, isYesterday, isSameWeek } from 'date-fns';
import {
  Conversation,
  Message,
  MessageType,
  ChatState,
  ConnectionStatus,
  TypingUser,
  MessageAttachment,
  MessageReaction,
} from '../../../types/communication';
import { User } from '../../../types/userManagement';

interface ChatInterfaceProps {
  conversations: Conversation[];
  activeConversation?: Conversation;
  messages: Message[];
  currentUser: User;
  connectionStatus: ConnectionStatus;
  typingUsers: TypingUser[];
  onSendMessage: (content: string, type: MessageType, attachments?: File[]) => Promise<void>;
  onSelectConversation: (conversationId: string) => void;
  onCreateConversation: () => void;
  onEditMessage: (messageId: string, content: string) => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
  onReactToMessage: (messageId: string, reaction: string) => Promise<void>;
  onMarkAsRead: (conversationId: string, messageId: string) => Promise<void>;
  onSearchMessages: (query: string) => Promise<Message[]>;
  onLoadMoreMessages: () => Promise<void>;
  onStartTyping: () => void;
  onStopTyping: () => void;
  onArchiveConversation: (conversationId: string) => Promise<void>;
  onMuteConversation: (conversationId: string, mute: boolean) => Promise<void>;
  onStartCall: (conversationId: string, type: 'audio' | 'video') => Promise<void>;
  isLoading?: boolean;
  isMobile?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversations,
  activeConversation,
  messages,
  currentUser,
  connectionStatus,
  typingUsers,
  onSendMessage,
  onSelectConversation,
  onCreateConversation,
  onEditMessage,
  onDeleteMessage,
  onReactToMessage,
  onMarkAsRead,
  onSearchMessages,
  onLoadMoreMessages,
  onStartTyping,
  onStopTyping,
  onArchiveConversation,
  onMuteConversation,
  onStartCall,
  isLoading = false,
  isMobile = false,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [recordingAudio, setRecordingAudio] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (activeConversation && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.senderId !== currentUser.id && !lastMessage.readBy.some(r => r.userId === currentUser.id)) {
        onMarkAsRead(activeConversation.id, lastMessage.id);
      }
    }
  }, [messages, activeConversation, currentUser.id, onMarkAsRead]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if ((!messageText.trim() && selectedFiles.length === 0 && !audioBlob) || sending) return;

    setSending(true);
    try {
      let files: File[] = [...selectedFiles];
      
      if (audioBlob) {
        const audioFile = new File([audioBlob], `voice_note_${Date.now()}.webm`, {
          type: 'audio/webm',
        });
        files.push(audioFile);
      }

      await onSendMessage(
        messageText.trim(),
        files.length > 0 ? 'file' : 'text',
        files.length > 0 ? files : undefined
      );

      setMessageText('');
      setSelectedFiles([]);
      setAudioBlob(null);
      setReplyToMessage(null);
      setEditingMessage(null);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setMessageText(value);

    // Handle typing indicators
    if (value.trim() && !typingTimeoutRef.current) {
      onStartTyping();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping();
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
    }
  };

  const handleMessageAction = (action: string, message: Message) => {
    setAnchorEl(null);
    setSelectedMessage(null);

    switch (action) {
      case 'reply':
        setReplyToMessage(message);
        messageInputRef.current?.focus();
        break;
      case 'edit':
        setEditingMessage(message);
        setMessageText(message.content);
        messageInputRef.current?.focus();
        break;
      case 'delete':
        onDeleteMessage(message.id);
        break;
      case 'star':
        // Handle starring message
        break;
    }
  };

  const handleSearch = async (query: string) => {
    if (query.trim()) {
      const results = await onSearchMessages(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const getMessageTimeDisplay = (timestamp: string) => {
    const messageDate = new Date(timestamp);
    
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm');
    } else if (isYesterday(messageDate)) {
      return t('chat.yesterday');
    } else if (isSameWeek(messageDate, new Date())) {
      return format(messageDate, 'EEEE');
    } else {
      return format(messageDate, 'MMM dd');
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon />;
    if (type.startsWith('video/')) return <VideoFileIcon />;
    if (type.startsWith('audio/')) return <AudioIcon />;
    return <FileIcon />;
  };

  const getOnlineStatus = (userId: string) => {
    if (!activeConversation) return false;
    const participant = activeConversation.participants.find(p => p.userId === userId);
    return participant?.isOnline || false;
  };

  const renderMessage = (message: Message, index: number) => {
    const isOwnMessage = message.senderId === currentUser.id;
    const showAvatar = !isOwnMessage && (index === 0 || messages[index - 1].senderId !== message.senderId);
    const showTimestamp = index === messages.length - 1 || 
      messages[index + 1].senderId !== message.senderId ||
      new Date(messages[index + 1].timestamp).getTime() - new Date(message.timestamp).getTime() > 5 * 60 * 1000;

    return (
      <Box
        key={message.id}
        sx={{
          display: 'flex',
          flexDirection: isOwnMessage ? 'row-reverse' : 'row',
          mb: showTimestamp ? 2 : 0.5,
          alignItems: 'flex-end',
        }}
      >
        {showAvatar && !isOwnMessage && (
          <Avatar
            src={message.senderAvatar}
            sx={{ width: 32, height: 32, mr: 1 }}
          >
            {message.senderName.charAt(0)}
          </Avatar>
        )}

        {!showAvatar && !isOwnMessage && (
          <Box sx={{ width: 32, mr: 1 }} />
        )}

        <Box
          sx={{
            maxWidth: '70%',
            minWidth: '120px',
          }}
        >
          {replyToMessage && message.replyToId === replyToMessage.id && (
            <Paper
              elevation={0}
              sx={{
                p: 1,
                mb: 0.5,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                borderLeft: `3px solid ${theme.palette.primary.main}`,
              }}
            >
              <Typography variant="caption" color="primary" fontWeight="medium">
                {t('chat.replyTo')} {replyToMessage.senderName}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {replyToMessage.content.substring(0, 50)}
                {replyToMessage.content.length > 50 && '...'}
              </Typography>
            </Paper>
          )}

          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              backgroundColor: isOwnMessage 
                ? theme.palette.primary.main 
                : theme.palette.background.paper,
              color: isOwnMessage ? theme.palette.primary.contrastText : theme.palette.text.primary,
              cursor: 'pointer',
              '&:hover': {
                boxShadow: theme.shadows[2],
              },
            }}
            onClick={(e) => {
              setAnchorEl(e.currentTarget);
              setSelectedMessage(message);
            }}
          >
            {!isOwnMessage && showAvatar && (
              <Typography variant="caption" color="primary" fontWeight="medium" display="block" mb={0.5}>
                {message.senderName}
              </Typography>
            )}

            {message.messageType === 'text' && (
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {message.content}
              </Typography>
            )}

            {message.messageType === 'file' && message.attachments && (
              <Box>
                {message.attachments.map((attachment) => (
                  <Box
                    key={attachment.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 1,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: message.content ? 1 : 0,
                    }}
                  >
                    {getFileIcon(attachment.type)}
                    <Box sx={{ ml: 1, flex: 1 }}>
                      <Typography variant="body2" noWrap>
                        {attachment.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(attachment.size / 1024).toFixed(1)} KB
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => window.open(attachment.downloadUrl)}>
                      <DownloadIcon />
                    </IconButton>
                  </Box>
                ))}
                {message.content && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {message.content}
                  </Typography>
                )}
              </Box>
            )}

            {message.messageType === 'voice_note' && (
              <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 200 }}>
                <IconButton size="small">
                  <PlayIcon />
                </IconButton>
                <Box sx={{ flex: 1, mx: 1, height: 4, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 2 }}>
                  <Box sx={{ width: '30%', height: '100%', backgroundColor: 'currentColor', borderRadius: 2 }} />
                </Box>
                <Typography variant="caption">0:15</Typography>
              </Box>
            )}

            {message.reactions.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {message.reactions.map((reaction, idx) => (
                  <Chip
                    key={idx}
                    label={`${reaction.reaction} 1`}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                ))}
              </Box>
            )}

            {showTimestamp && (
              <Typography
                variant="caption"
                color={isOwnMessage ? 'inherit' : 'text.secondary'}
                sx={{ 
                  display: 'block', 
                  textAlign: isOwnMessage ? 'right' : 'left',
                  mt: 0.5,
                  opacity: 0.7,
                }}
              >
                {getMessageTimeDisplay(message.timestamp)}
                {isOwnMessage && (
                  <Box component="span" sx={{ ml: 0.5 }}>
                    {message.deliveryStatus === 'read' && '✓✓'}
                    {message.deliveryStatus === 'delivered' && '✓'}
                    {message.deliveryStatus === 'sent' && '→'}
                  </Box>
                )}
              </Typography>
            )}
          </Paper>
        </Box>
      </Box>
    );
  };

  const renderConversationList = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{t('chat.messages')}</Typography>
          <Stack direction="row" spacing={1}>
            <IconButton onClick={() => setShowSearch(!showSearch)}>
              <SearchIcon />
            </IconButton>
            <Button
              variant="contained"
              size="small"
              onClick={onCreateConversation}
              startIcon={<SendIcon />}
            >
              {t('chat.newChat')}
            </Button>
          </Stack>
        </Stack>

        {showSearch && (
          <TextField
            fullWidth
            size="small"
            placeholder={t('chat.searchMessages')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            sx={{ mt: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        )}
      </Box>

      {/* Connection Status */}
      {connectionStatus !== 'connected' && (
        <Alert 
          severity={connectionStatus === 'connecting' ? 'info' : 'warning'}
          sx={{ m: 1 }}
        >
          {t(`chat.connection.${connectionStatus}`)}
        </Alert>
      )}

      {/* Conversation List */}
      <List sx={{ flex: 1, overflow: 'auto' }}>
        {conversations.map((conversation) => {
          const otherParticipant = conversation.participants.find(p => p.userId !== currentUser.id);
          const isOnline = otherParticipant?.isOnline || false;
          
          return (
            <ListItem
              key={conversation.id}
              button
              selected={activeConversation?.id === conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              <ListItemAvatar>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                  color={isOnline ? 'success' : 'default'}
                >
                  <Avatar>
                    {conversation.type === 'direct' 
                      ? otherParticipant?.name.charAt(0) || '?'
                      : conversation.title?.charAt(0) || '#'
                    }
                  </Avatar>
                </Badge>
              </ListItemAvatar>

              <ListItemText
                primary={
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" noWrap>
                      {conversation.type === 'direct' 
                        ? otherParticipant?.name || t('chat.unknownUser')
                        : conversation.title || t('chat.groupChat')
                      }
                    </Typography>
                    {conversation.lastMessage && (
                      <Typography variant="caption" color="text.secondary">
                        {getMessageTimeDisplay(conversation.lastMessage.timestamp)}
                      </Typography>
                    )}
                  </Stack>
                }
                secondary={
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ flex: 1 }}>
                      {typingUsers.length > 0 && typingUsers.some(u => u.userId !== currentUser.id) ? (
                        <Typography component="span" color="primary" sx={{ fontStyle: 'italic' }}>
                          {t('chat.typing')}...
                        </Typography>
                      ) : conversation.lastMessage ? (
                        <>
                          {conversation.lastMessage.senderId === currentUser.id && 'You: '}
                          {conversation.lastMessage.content || t(`chat.messageType.${conversation.lastMessage.messageType}`)}
                        </>
                      ) : (
                        t('chat.noMessages')
                      )}
                    </Typography>
                    {conversation.unreadCount > 0 && (
                      <Chip
                        label={conversation.unreadCount}
                        size="small"
                        color="primary"
                        sx={{ ml: 1, minWidth: 20, height: 20 }}
                      />
                    )}
                  </Stack>
                }
              />

              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle conversation menu
                  }}
                >
                  <MoreIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  const renderChatArea = () => {
    if (!activeConversation) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            p: 4,
          }}
        >
          <Typography variant="h6" color="text.secondary" mb={2}>
            {t('chat.selectConversation')}
          </Typography>
          <Button variant="contained" onClick={onCreateConversation}>
            {t('chat.startNewChat')}
          </Button>
        </Box>
      );
    }

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Chat Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" spacing={2}>
              {isMobile && (
                <IconButton onClick={() => onSelectConversation('')}>
                  <BackIcon />
                </IconButton>
              )}
              <Avatar>
                {activeConversation.type === 'direct' 
                  ? activeConversation.participants.find(p => p.userId !== currentUser.id)?.name.charAt(0) || '?'
                  : activeConversation.title?.charAt(0) || '#'
                }
              </Avatar>
              <Box>
                <Typography variant="subtitle1">
                  {activeConversation.type === 'direct' 
                    ? activeConversation.participants.find(p => p.userId !== currentUser.id)?.name || t('chat.unknownUser')
                    : activeConversation.title || t('chat.groupChat')
                  }
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {typingUsers.length > 0 && typingUsers.some(u => u.userId !== currentUser.id) ? (
                    t('chat.typing') + '...'
                  ) : activeConversation.type === 'direct' ? (
                    getOnlineStatus(activeConversation.participants.find(p => p.userId !== currentUser.id)?.userId || '') 
                      ? t('chat.online') 
                      : t('chat.offline')
                  ) : (
                    t('chat.participants', { count: activeConversation.participants.length })
                  )}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1}>
              <IconButton onClick={() => onStartCall(activeConversation.id, 'audio')}>
                <CallIcon />
              </IconButton>
              <IconButton onClick={() => onStartCall(activeConversation.id, 'video')}>
                <VideoIcon />
              </IconButton>
              <IconButton onClick={() => setShowInfo(!showInfo)}>
                <InfoIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Box>

        {/* Messages Area */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {messages.map((message, index) => renderMessage(message, index))}
              {typingUsers.length > 0 && typingUsers.some(u => u.userId !== currentUser.id) && (
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 5, my: 1 }}>
                  <Box sx={{ display: 'flex', space: 0.5 }}>
                    {[0, 1, 2].map((dot) => (
                      <Box
                        key={dot}
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: 'text.secondary',
                          animation: 'pulse 1.5s infinite',
                          animationDelay: `${dot * 0.2}s`,
                          mr: 0.5,
                        }}
                      />
                    ))}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    {typingUsers.filter(u => u.userId !== currentUser.id).map(u => u.name).join(', ')} {t('chat.typing')}...
                  </Typography>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </Box>

        {/* Message Input */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          {replyToMessage && (
            <Box
              sx={{
                p: 1,
                mb: 1,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                borderRadius: 1,
                borderLeft: `3px solid ${theme.palette.primary.main}`,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="primary" fontWeight="medium">
                    {t('chat.replyTo')} {replyToMessage.senderName}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    {replyToMessage.content.substring(0, 100)}
                    {replyToMessage.content.length > 100 && '...'}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => setReplyToMessage(null)}>
                  <DeleteIcon />
                </IconButton>
              </Stack>
            </Box>
          )}

          {selectedFiles.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {selectedFiles.map((file, index) => (
                  <Chip
                    key={index}
                    label={file.name}
                    size="small"
                    onDelete={() => {
                      setSelectedFiles(files => files.filter((_, i) => i !== index));
                    }}
                    icon={getFileIcon(file.type)}
                  />
                ))}
              </Stack>
            </Box>
          )}

          <Stack direction="row" spacing={1} alignItems="flex-end">
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              multiple
              onChange={handleFileSelect}
            />

            <IconButton onClick={() => fileInputRef.current?.click()}>
              <AttachIcon />
            </IconButton>

            <TextField
              ref={messageInputRef}
              fullWidth
              multiline
              maxRows={4}
              placeholder={t('chat.typeMessage')}
              value={messageText}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              disabled={sending}
              variant="outlined"
              size="small"
            />

            {!messageText.trim() && (
              <IconButton
                color={recordingAudio ? 'error' : 'default'}
                onClick={() => setRecordingAudio(!recordingAudio)}
              >
                {recordingAudio ? <StopIcon /> : <MicIcon />}
              </IconButton>
            )}

            <IconButton onClick={() => setShowEmoji(!showEmoji)}>
              <EmojiIcon />
            </IconButton>

            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={(!messageText.trim() && selectedFiles.length === 0 && !audioBlob) || sending}
            >
              {sending ? <CircularProgress size={24} /> : <SendIcon />}
            </IconButton>
          </Stack>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex' }}>
      {/* Conversation List */}
      {(!isMobile || !activeConversation) && (
        <Box sx={{ width: isMobile ? '100%' : 350, borderRight: 1, borderColor: 'divider' }}>
          {renderConversationList()}
        </Box>
      )}

      {/* Chat Area */}
      {(!isMobile || activeConversation) && (
        <Box sx={{ flex: 1 }}>
          {renderChatArea()}
        </Box>
      )}

      {/* Message Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => {
          setAnchorEl(null);
          setSelectedMessage(null);
        }}
      >
        <MenuItem onClick={() => selectedMessage && handleMessageAction('reply', selectedMessage)}>
          <ReplyIcon sx={{ mr: 1 }} />
          {t('chat.reply')}
        </MenuItem>
        {selectedMessage?.senderId === currentUser.id && (
          <MenuItem onClick={() => selectedMessage && handleMessageAction('edit', selectedMessage)}>
            <EditIcon sx={{ mr: 1 }} />
            {t('chat.edit')}
          </MenuItem>
        )}
        <MenuItem onClick={() => selectedMessage && handleMessageAction('star', selectedMessage)}>
          <StarIcon sx={{ mr: 1 }} />
          {t('chat.star')}
        </MenuItem>
        {selectedMessage?.senderId === currentUser.id && (
          <MenuItem onClick={() => selectedMessage && handleMessageAction('delete', selectedMessage)}>
            <DeleteIcon sx={{ mr: 1 }} />
            {t('chat.delete')}
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default ChatInterface;