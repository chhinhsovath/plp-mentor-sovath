import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Stack,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Badge,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  VolumeOff as MuteIcon,
  VolumeUp as UnmuteIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Announcement as AnnouncementIcon,
  School as SchoolIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format, isToday, isYesterday, isSameWeek } from 'date-fns';
import {
  Conversation,
  ConversationType,
  ConversationParticipant,
} from '../../../types/communication';
import { User } from '../../../types/userManagement';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  currentUser: User;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectConversation: (conversationId: string) => void;
  onCreateConversation: (type: ConversationType) => void;
  onArchiveConversation: (conversationId: string) => Promise<void>;
  onMuteConversation: (conversationId: string, mute: boolean) => Promise<void>;
  onDeleteConversation: (conversationId: string) => Promise<void>;
  onStarConversation: (conversationId: string, star: boolean) => Promise<void>;
  showArchived?: boolean;
  onToggleArchived: () => void;
  isLoading?: boolean;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  currentUser,
  searchQuery,
  onSearchChange,
  onSelectConversation,
  onCreateConversation,
  onArchiveConversation,
  onMuteConversation,
  onDeleteConversation,
  onStarConversation,
  showArchived = false,
  onToggleArchived,
  isLoading = false,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [filterType, setFilterType] = useState<ConversationType | 'all'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const filteredConversations = useMemo(() => {
    let filtered = conversations.filter(conv => 
      showArchived ? conv.isArchived : !conv.isArchived
    );

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(conv => {
        // Search in conversation title
        if (conv.title?.toLowerCase().includes(query)) return true;
        
        // Search in participant names
        return conv.participants.some(p => 
          p.name.toLowerCase().includes(query) ||
          (p.userId !== currentUser.id && p.name.toLowerCase().includes(query))
        );
      });
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(conv => conv.type === filterType);
    }

    // Sort by last activity
    return filtered.sort((a, b) => {
      const aTime = a.lastMessage?.timestamp || a.updatedAt;
      const bTime = b.lastMessage?.timestamp || b.updatedAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }, [conversations, searchQuery, filterType, showArchived, currentUser.id]);

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.title) {
      return i18n.language === 'km' && conversation.title ? conversation.title : conversation.title;
    }

    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p.userId !== currentUser.id);
      return otherParticipant?.name || t('chat.unknownUser');
    }

    return t(`chat.conversationType.${conversation.type}`);
  };

  const getConversationSubtitle = (conversation: Conversation) => {
    if (conversation.type === 'group' || conversation.type === 'community') {
      return t('chat.participants', { count: conversation.participants.length });
    }

    if (conversation.type === 'observation' && conversation.contextId) {
      return t('chat.observationSession');
    }

    if (conversation.type === 'planning' && conversation.contextId) {
      return t('chat.improvementPlan');
    }

    const otherParticipant = conversation.participants.find(p => p.userId !== currentUser.id);
    return otherParticipant?.isOnline ? t('chat.online') : t('chat.offline');
  };

  const getLastMessageDisplay = (conversation: Conversation) => {
    if (!conversation.lastMessage) {
      return t('chat.noMessages');
    }

    const { lastMessage } = conversation;
    const isOwnMessage = lastMessage.senderId === currentUser.id;
    const prefix = isOwnMessage ? t('chat.you') + ': ' : '';
    
    let content = '';
    if (lastMessage.messageType === 'text') {
      content = lastMessage.content;
    } else {
      content = t(`chat.messageType.${lastMessage.messageType}`);
    }

    return prefix + (content.length > 50 ? content.substring(0, 50) + '...' : content);
  };

  const getTimeDisplay = (timestamp: string) => {
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

  const getConversationIcon = (type: ConversationType) => {
    switch (type) {
      case 'direct': return <PersonIcon />;
      case 'group': return <GroupIcon />;
      case 'community': return <SchoolIcon />;
      case 'announcement': return <AnnouncementIcon />;
      default: return <PersonIcon />;
    }
  };

  const getOnlineCount = (participants: ConversationParticipant[]) => {
    return participants.filter(p => p.isOnline).length;
  };

  const handleConversationAction = (action: string, conversation: Conversation) => {
    setAnchorEl(null);
    setSelectedConversation(null);

    switch (action) {
      case 'archive':
        onArchiveConversation(conversation.id);
        break;
      case 'unarchive':
        onArchiveConversation(conversation.id);
        break;
      case 'mute':
        onMuteConversation(conversation.id, !conversation.isMuted);
        break;
      case 'star':
        onStarConversation(conversation.id, true);
        break;
      case 'unstar':
        onStarConversation(conversation.id, false);
        break;
      case 'delete':
        onDeleteConversation(conversation.id);
        break;
    }
  };

  const renderCreateDialog = () => (
    <Dialog
      open={showCreateDialog}
      onClose={() => setShowCreateDialog(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{t('chat.createConversation')}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {t('chat.selectConversationType')}
          </Typography>
          
          <Stack spacing={2}>
            <Button
              variant="outlined"
              startIcon={<PersonIcon />}
              onClick={() => {
                onCreateConversation('direct');
                setShowCreateDialog(false);
              }}
              fullWidth
              sx={{ justifyContent: 'flex-start', p: 2 }}
            >
              <Box sx={{ ml: 2 }}>
                <Typography variant="subtitle2">{t('chat.directMessage')}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('chat.directMessageDesc')}
                </Typography>
              </Box>
            </Button>

            <Button
              variant="outlined"
              startIcon={<GroupIcon />}
              onClick={() => {
                onCreateConversation('group');
                setShowCreateDialog(false);
              }}
              fullWidth
              sx={{ justifyContent: 'flex-start', p: 2 }}
            >
              <Box sx={{ ml: 2 }}>
                <Typography variant="subtitle2">{t('chat.groupChat')}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('chat.groupChatDesc')}
                </Typography>
              </Box>
            </Button>

            <Button
              variant="outlined"
              startIcon={<SchoolIcon />}
              onClick={() => {
                onCreateConversation('community');
                setShowCreateDialog(false);
              }}
              fullWidth
              sx={{ justifyContent: 'flex-start', p: 2 }}
            >
              <Box sx={{ ml: 2 }}>
                <Typography variant="subtitle2">{t('chat.communityChat')}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('chat.communityChatDesc')}
                </Typography>
              </Box>
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowCreateDialog(false)}>
          {t('common.cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            {showArchived ? t('chat.archivedChats') : t('chat.messages')}
          </Typography>
          <IconButton onClick={() => setShowCreateDialog(true)} color="primary">
            <AddIcon />
          </IconButton>
        </Stack>

        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder={t('chat.searchConversations')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Filters */}
        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>{t('chat.filter')}</InputLabel>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as ConversationType | 'all')}
              label={t('chat.filter')}
            >
              <MenuItem value="all">{t('common.all')}</MenuItem>
              <MenuItem value="direct">{t('chat.direct')}</MenuItem>
              <MenuItem value="group">{t('chat.group')}</MenuItem>
              <MenuItem value="community">{t('chat.community')}</MenuItem>
              <MenuItem value="observation">{t('chat.observation')}</MenuItem>
              <MenuItem value="planning">{t('chat.planning')}</MenuItem>
            </Select>
          </FormControl>

          <Button
            size="small"
            variant={showArchived ? 'contained' : 'outlined'}
            onClick={onToggleArchived}
            startIcon={showArchived ? <UnarchiveIcon /> : <ArchiveIcon />}
          >
            {showArchived ? t('chat.showActive') : t('chat.showArchived')}
          </Button>
        </Stack>
      </Box>

      {/* Conversation List */}
      <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
        {filteredConversations.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {searchQuery ? t('chat.noSearchResults') : 
               showArchived ? t('chat.noArchivedChats') : t('chat.noConversations')}
            </Typography>
            {!searchQuery && !showArchived && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowCreateDialog(true)}
                sx={{ mt: 2 }}
              >
                {t('chat.startFirstChat')}
              </Button>
            )}
          </Box>
        ) : (
          filteredConversations.map((conversation, index) => {
            const isSelected = activeConversationId === conversation.id;
            const otherParticipant = conversation.participants.find(p => p.userId !== currentUser.id);
            const isOnline = conversation.type === 'direct' ? otherParticipant?.isOnline : getOnlineCount(conversation.participants) > 1;
            
            return (
              <React.Fragment key={conversation.id}>
                <ListItem
                  button
                  selected={isSelected}
                  onClick={() => onSelectConversation(conversation.id)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      borderRight: `3px solid ${theme.palette.primary.main}`,
                    },
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.action.hover, 0.05),
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      variant="dot"
                      color={isOnline ? 'success' : 'default'}
                      invisible={conversation.type !== 'direct'}
                    >
                      <Avatar
                        sx={{
                          bgcolor: conversation.type === 'direct' 
                            ? theme.palette.primary.main 
                            : theme.palette.secondary.main,
                        }}
                      >
                        {conversation.type === 'direct' 
                          ? (otherParticipant?.name.charAt(0).toUpperCase() || '?')
                          : getConversationIcon(conversation.type)
                        }
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>

                  <ListItemText
                    primary={
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography 
                          variant="subtitle2" 
                          noWrap
                          sx={{ 
                            fontWeight: conversation.unreadCount > 0 ? 600 : 400,
                            flex: 1,
                          }}
                        >
                          {getConversationTitle(conversation)}
                        </Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          {conversation.isMuted && (
                            <MuteIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          )}
                          {conversation.lastMessage && (
                            <Typography variant="caption" color="text.secondary">
                              {getTimeDisplay(conversation.lastMessage.timestamp)}
                            </Typography>
                          )}
                        </Stack>
                      </Stack>
                    }
                    secondary={
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mt={0.5}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                            sx={{ 
                              fontWeight: conversation.unreadCount > 0 ? 500 : 400,
                              fontSize: '0.875rem',
                            }}
                          >
                            {getLastMessageDisplay(conversation)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getConversationSubtitle(conversation)}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          {conversation.unreadCount > 0 && (
                            <Chip
                              label={conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                              size="small"
                              color="primary"
                              sx={{ 
                                height: 20, 
                                minWidth: 20,
                                '& .MuiChip-label': {
                                  fontSize: '0.7rem',
                                  px: 0.5,
                                },
                              }}
                            />
                          )}
                        </Stack>
                      </Stack>
                    }
                  />

                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAnchorEl(e.currentTarget);
                        setSelectedConversation(conversation);
                      }}
                    >
                      <MoreIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < filteredConversations.length - 1 && <Divider component="li" />}
              </React.Fragment>
            );
          })
        )}
      </List>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => {
          setAnchorEl(null);
          setSelectedConversation(null);
        }}
      >
        {selectedConversation && (
          <>
            <MenuItem
              onClick={() => handleConversationAction(
                selectedConversation.isArchived ? 'unarchive' : 'archive',
                selectedConversation
              )}
            >
              {selectedConversation.isArchived ? <UnarchiveIcon sx={{ mr: 1 }} /> : <ArchiveIcon sx={{ mr: 1 }} />}
              {selectedConversation.isArchived ? t('chat.unarchive') : t('chat.archive')}
            </MenuItem>
            <MenuItem onClick={() => handleConversationAction('mute', selectedConversation)}>
              {selectedConversation.isMuted ? <UnmuteIcon sx={{ mr: 1 }} /> : <MuteIcon sx={{ mr: 1 }} />}
              {selectedConversation.isMuted ? t('chat.unmute') : t('chat.mute')}
            </MenuItem>
            <MenuItem onClick={() => handleConversationAction('star', selectedConversation)}>
              <StarIcon sx={{ mr: 1 }} />
              {t('chat.star')}
            </MenuItem>
            <Divider />
            <MenuItem 
              onClick={() => handleConversationAction('delete', selectedConversation)}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon sx={{ mr: 1 }} />
              {t('chat.delete')}
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Create Conversation Dialog */}
      {renderCreateDialog()}
    </Box>
  );
};

export default ConversationList;