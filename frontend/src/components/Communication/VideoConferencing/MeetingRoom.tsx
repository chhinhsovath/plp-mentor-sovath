import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Grid,
  IconButton,
  Button,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  TextField,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  Drawer,
  useTheme,
  alpha,
  Fade,
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  ScreenShare as ScreenShareIcon,
  StopScreenShare as StopScreenShareIcon,
  Chat as ChatIcon,
  People as PeopleIcon,
  MoreVert as MoreIcon,
  CallEnd as CallEndIcon,
  Settings as SettingsIcon,
  Record as RecordIcon,
  Stop as StopIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  PresentToAll as PresentIcon,
  StopPresentation as StopPresentIcon,
  PersonAdd as PersonAddIcon,
  Security as SecurityIcon,
  CloudDownload as DownloadIcon,
  Send as SendIcon,
  EmojiEmotions as EmojiIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  PanTool as RaiseHandIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  Meeting,
  MeetingParticipant,
  MeetingRole,
  MeetingSettings,
  ParticipantStatus,
} from '../../../types/communication';
import { User } from '../../../types/userManagement';

interface MeetingRoomProps {
  meeting: Meeting;
  currentUser: User;
  participants: MeetingParticipant[];
  localStream?: MediaStream;
  remoteStreams: Record<string, MediaStream>;
  isHost: boolean;
  isRecording: boolean;
  isScreenSharing: boolean;
  chatMessages: ChatMessage[];
  onJoinMeeting: () => Promise<void>;
  onLeaveMeeting: () => Promise<void>;
  onToggleMic: () => Promise<void>;
  onToggleCamera: () => Promise<void>;
  onToggleScreenShare: () => Promise<void>;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => Promise<void>;
  onSendChatMessage: (message: string) => Promise<void>;
  onAdmitParticipant: (participantId: string) => Promise<void>;
  onRemoveParticipant: (participantId: string) => Promise<void>;
  onMuteParticipant: (participantId: string) => Promise<void>;
  onPromoteToPresenter: (participantId: string) => Promise<void>;
  onReaction: (reaction: string) => void;
  onRaiseHand: () => void;
  isConnected: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  type: 'message' | 'system' | 'reaction';
}

const MeetingRoom: React.FC<MeetingRoomProps> = ({
  meeting,
  currentUser,
  participants,
  localStream,
  remoteStreams,
  isHost,
  isRecording,
  isScreenSharing,
  chatMessages,
  onJoinMeeting,
  onLeaveMeeting,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onStartRecording,
  onStopRecording,
  onSendChatMessage,
  onAdmitParticipant,
  onRemoveParticipant,
  onMuteParticipant,
  onPromoteToPresenter,
  onReaction,
  onRaiseHand,
  isConnected,
  connectionQuality,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Record<string, HTMLVideoElement>>({});
  const chatInputRef = useRef<HTMLInputElement>(null);

  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<MeetingParticipant | null>(null);

  // Set up local video stream
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Set up remote video streams
  useEffect(() => {
    Object.entries(remoteStreams).forEach(([participantId, stream]) => {
      const videoElement = remoteVideoRefs.current[participantId];
      if (videoElement) {
        videoElement.srcObject = stream;
      }
    });
  }, [remoteStreams]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (chatMessage.trim()) {
      await onSendChatMessage(chatMessage);
      setChatMessage('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleParticipantAction = (action: string, participant: MeetingParticipant) => {
    setAnchorEl(null);
    setSelectedParticipant(null);

    switch (action) {
      case 'mute':
        onMuteParticipant(participant.userId);
        break;
      case 'promote':
        onPromoteToPresenter(participant.userId);
        break;
      case 'remove':
        onRemoveParticipant(participant.userId);
        break;
    }
  };

  const getConnectionQualityColor = () => {
    switch (connectionQuality) {
      case 'excellent': return theme.palette.success.main;
      case 'good': return theme.palette.warning.main;
      case 'poor': return theme.palette.error.main;
      case 'disconnected': return theme.palette.error.dark;
      default: return theme.palette.grey[500];
    }
  };

  const renderVideoGrid = () => {
    const activeParticipants = participants.filter(p => p.status === 'joined');
    const gridSize = Math.ceil(Math.sqrt(activeParticipants.length + 1)); // +1 for local video

    return (
      <Grid container spacing={1} sx={{ flex: 1, p: 2 }}>
        {/* Local Video */}
        <Grid item xs={12 / gridSize} md={12 / gridSize}>
          <Paper
            sx={{
              position: 'relative',
              aspectRatio: '16/9',
              backgroundColor: 'black',
              borderRadius: 2,
              overflow: 'hidden',
              border: isVideoOff ? `2px solid ${theme.palette.error.main}` : 'none',
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: isVideoOff ? 'none' : 'block',
              }}
            />
            
            {isVideoOff && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                }}
              >
                <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 1 }}>
                  {currentUser.firstName.charAt(0)}
                </Avatar>
                <Typography variant="body2" color="white">
                  {currentUser.firstName} {currentUser.lastName}
                </Typography>
              </Box>
            )}

            {/* Local Video Overlay */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                right: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="caption" color="white" sx={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
                {t('meeting.you')}
              </Typography>
              <Stack direction="row" spacing={0.5}>
                {isMuted && (
                  <Chip
                    size="small"
                    icon={<MicOffIcon />}
                    label=""
                    sx={{ backgroundColor: 'error.main', color: 'white', minWidth: 'auto', width: 24, height: 24 }}
                  />
                )}
                {isScreenSharing && (
                  <Chip
                    size="small"
                    icon={<ScreenShareIcon />}
                    label=""
                    sx={{ backgroundColor: 'primary.main', color: 'white', minWidth: 'auto', width: 24, height: 24 }}
                  />
                )}
              </Stack>
            </Box>
          </Paper>
        </Grid>

        {/* Remote Videos */}
        {activeParticipants.map((participant) => (
          <Grid item xs={12 / gridSize} md={12 / gridSize} key={participant.userId}>
            <Paper
              sx={{
                position: 'relative',
                aspectRatio: '16/9',
                backgroundColor: 'black',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <video
                ref={(el) => {
                  if (el) remoteVideoRefs.current[participant.userId] = el;
                }}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />

              {/* Participant Overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  right: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="caption" color="white" sx={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
                  {participant.name}
                </Typography>
                <Stack direction="row" spacing={0.5}>
                  {participant.role === 'presenter' && (
                    <Chip
                      size="small"
                      icon={<PresentIcon />}
                      label=""
                      sx={{ backgroundColor: 'success.main', color: 'white', minWidth: 'auto', width: 24, height: 24 }}
                    />
                  )}
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    variant="dot"
                    color="success"
                    invisible={!participant.joinedAt}
                  >
                    <Avatar sx={{ width: 24, height: 24 }}>
                      {participant.name.charAt(0)}
                    </Avatar>
                  </Badge>
                </Stack>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderControls = () => (
    <Box
      sx={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          px: 2,
          py: 1,
          borderRadius: 6,
          backgroundColor: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(10px)',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          {/* Mic Control */}
          <IconButton
            onClick={() => {
              onToggleMic();
              setIsMuted(!isMuted);
            }}
            color={isMuted ? 'error' : 'default'}
            sx={{
              backgroundColor: isMuted ? 'error.main' : 'transparent',
              color: isMuted ? 'white' : 'inherit',
              '&:hover': {
                backgroundColor: isMuted ? 'error.dark' : alpha(theme.palette.action.hover, 0.1),
              },
            }}
          >
            {isMuted ? <MicOffIcon /> : <MicIcon />}
          </IconButton>

          {/* Camera Control */}
          <IconButton
            onClick={() => {
              onToggleCamera();
              setIsVideoOff(!isVideoOff);
            }}
            color={isVideoOff ? 'error' : 'default'}
            sx={{
              backgroundColor: isVideoOff ? 'error.main' : 'transparent',
              color: isVideoOff ? 'white' : 'inherit',
              '&:hover': {
                backgroundColor: isVideoOff ? 'error.dark' : alpha(theme.palette.action.hover, 0.1),
              },
            }}
          >
            {isVideoOff ? <VideocamOffIcon /> : <VideocamIcon />}
          </IconButton>

          {/* Screen Share */}
          <IconButton
            onClick={onToggleScreenShare}
            color={isScreenSharing ? 'primary' : 'default'}
            sx={{
              backgroundColor: isScreenSharing ? 'primary.main' : 'transparent',
              color: isScreenSharing ? 'white' : 'inherit',
            }}
          >
            {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
          </IconButton>

          {/* Recording (Host only) */}
          {isHost && (
            <IconButton
              onClick={isRecording ? onStopRecording : onStartRecording}
              color={isRecording ? 'error' : 'default'}
              sx={{
                backgroundColor: isRecording ? 'error.main' : 'transparent',
                color: isRecording ? 'white' : 'inherit',
              }}
            >
              {isRecording ? <StopIcon /> : <RecordIcon />}
            </IconButton>
          )}

          {/* Reactions */}
          <IconButton onClick={() => setShowReactions(!showReactions)}>
            <EmojiIcon />
          </IconButton>

          {/* Raise Hand */}
          <IconButton
            onClick={() => {
              onRaiseHand();
              setHandRaised(!handRaised);
            }}
            color={handRaised ? 'warning' : 'default'}
            sx={{
              backgroundColor: handRaised ? 'warning.main' : 'transparent',
              color: handRaised ? 'white' : 'inherit',
            }}
          >
            <RaiseHandIcon />
          </IconButton>

          {/* Chat */}
          <Badge badgeContent={chatMessages.filter(m => m.type === 'message').length} color="primary">
            <IconButton onClick={() => setShowChat(!showChat)}>
              <ChatIcon />
            </IconButton>
          </Badge>

          {/* Participants */}
          <IconButton onClick={() => setShowParticipants(!showParticipants)}>
            <PeopleIcon />
          </IconButton>

          {/* Settings */}
          <IconButton onClick={() => setShowSettings(!showSettings)}>
            <SettingsIcon />
          </IconButton>

          {/* Fullscreen */}
          <IconButton onClick={toggleFullscreen}>
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>

          {/* Leave Meeting */}
          <IconButton
            onClick={onLeaveMeeting}
            sx={{
              backgroundColor: 'error.main',
              color: 'white',
              '&:hover': { backgroundColor: 'error.dark' },
            }}
          >
            <CallEndIcon />
          </IconButton>
        </Stack>
      </Paper>

      {/* Reactions Popup */}
      {showReactions && (
        <Fade in={showReactions}>
          <Paper
            sx={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              mb: 1,
              p: 1,
              borderRadius: 4,
            }}
          >
            <Stack direction="row" spacing={1}>
              {['👍', '👏', '❤️', '😊', '😮', '😢'].map((emoji) => (
                <IconButton
                  key={emoji}
                  onClick={() => {
                    onReaction(emoji);
                    setShowReactions(false);
                  }}
                  sx={{ fontSize: '1.5rem' }}
                >
                  {emoji}
                </IconButton>
              ))}
            </Stack>
          </Paper>
        </Fade>
      )}
    </Box>
  );

  const renderChat = () => (
    <Drawer
      anchor="right"
      open={showChat}
      onClose={() => setShowChat(false)}
      variant="temporary"
      sx={{ zIndex: 1300 }}
    >
      <Box sx={{ width: 350, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">{t('meeting.chat')}</Typography>
        </Box>

        <Box id="chat-messages" sx={{ flex: 1, overflow: 'auto', p: 1 }}>
          {chatMessages.map((message) => (
            <Box key={message.id} sx={{ mb: 1 }}>
              {message.type === 'system' ? (
                <Typography variant="caption" color="text.secondary" align="center" display="block">
                  {message.message}
                </Typography>
              ) : (
                <Box>
                  <Typography variant="caption" color="primary" fontWeight="medium">
                    {message.senderName}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {message.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(new Date(message.timestamp), 'HH:mm')}
                  </Typography>
                </Box>
              )}
            </Box>
          ))}
        </Box>

        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={1}>
            <TextField
              ref={chatInputRef}
              fullWidth
              size="small"
              placeholder={t('meeting.typeChatMessage')}
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <IconButton onClick={handleSendMessage} disabled={!chatMessage.trim()}>
              <SendIcon />
            </IconButton>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );

  const renderParticipants = () => (
    <Drawer
      anchor="right"
      open={showParticipants}
      onClose={() => setShowParticipants(false)}
      variant="temporary"
      sx={{ zIndex: 1300 }}
    >
      <Box sx={{ width: 300 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {t('meeting.participants')} ({participants.length})
            </Typography>
            {isHost && (
              <IconButton size="small">
                <PersonAddIcon />
              </IconButton>
            )}
          </Stack>
        </Box>

        <List>
          {participants.map((participant) => (
            <ListItem key={participant.userId}>
              <ListItemAvatar>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                  color={participant.status === 'joined' ? 'success' : 'default'}
                >
                  <Avatar>{participant.name.charAt(0)}</Avatar>
                </Badge>
              </ListItemAvatar>
              
              <ListItemText
                primary={participant.name}
                secondary={
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Chip
                      label={t(`meeting.role.${participant.role}`)}
                      size="small"
                      variant="outlined"
                    />
                    {participant.role === 'host' && (
                      <Chip
                        label={t('meeting.host')}
                        size="small"
                        color="primary"
                      />
                    )}
                  </Stack>
                }
              />

              {isHost && participant.userId !== currentUser.id && (
                <ListItemSecondaryAction>
                  <IconButton
                    onClick={(e) => {
                      setAnchorEl(e.currentTarget);
                      setSelectedParticipant(participant);
                    }}
                  >
                    <MoreIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              )}
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );

  return (
    <Box sx={{ height: '100vh', position: 'relative', backgroundColor: 'black' }}>
      {/* Connection Status */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 1000,
        }}
      >
        <Chip
          label={t(`meeting.connection.${connectionQuality}`)}
          size="small"
          sx={{
            backgroundColor: alpha(getConnectionQualityColor(), 0.1),
            color: getConnectionQualityColor(),
            border: `1px solid ${getConnectionQualityColor()}`,
          }}
        />
      </Box>

      {/* Meeting Info */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <Paper
          sx={{
            p: 1,
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(10px)',
          }}
        >
          <Typography variant="subtitle2">{meeting.title}</Typography>
          {isRecording && (
            <Chip
              label={t('meeting.recording')}
              size="small"
              color="error"
              icon={<RecordIcon />}
              sx={{ mt: 0.5 }}
            />
          )}
        </Paper>
      </Box>

      {/* Video Grid */}
      {renderVideoGrid()}

      {/* Controls */}
      {renderControls()}

      {/* Chat Drawer */}
      {renderChat()}

      {/* Participants Drawer */}
      {renderParticipants()}

      {/* Participant Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => {
          setAnchorEl(null);
          setSelectedParticipant(null);
        }}
      >
        {selectedParticipant && isHost && (
          <>
            <MenuItem onClick={() => handleParticipantAction('mute', selectedParticipant)}>
              <MicOffIcon sx={{ mr: 1 }} />
              {t('meeting.muteParticipant')}
            </MenuItem>
            <MenuItem onClick={() => handleParticipantAction('promote', selectedParticipant)}>
              <PresentIcon sx={{ mr: 1 }} />
              {t('meeting.makePresenter')}
            </MenuItem>
            <MenuItem 
              onClick={() => handleParticipantAction('remove', selectedParticipant)}
              sx={{ color: 'error.main' }}
            >
              <CallEndIcon sx={{ mr: 1 }} />
              {t('meeting.removeParticipant')}
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
};

export default MeetingRoom;