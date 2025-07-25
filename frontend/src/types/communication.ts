// Communication and Real-Time Collaboration Types

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: MessageType;
  attachments?: MessageAttachment[];
  replyToId?: string;
  editedAt?: string;
  readBy: MessageRead[];
  reactions: MessageReaction[];
  timestamp: string;
  isDeleted: boolean;
  deliveryStatus: MessageDeliveryStatus;
}

export type MessageType = 
  | 'text'
  | 'file'
  | 'image'
  | 'video'
  | 'audio'
  | 'voice_note'
  | 'location'
  | 'system'
  | 'observation_link'
  | 'plan_link'
  | 'meeting_invite';

export type MessageDeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  downloadUrl: string;
  uploadedAt: string;
}

export interface MessageRead {
  userId: string;
  readAt: string;
}

export interface MessageReaction {
  userId: string;
  reaction: string; // emoji or reaction type
  timestamp: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  title?: string;
  description?: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  isArchived: boolean;
  isMuted: boolean;
  contextId?: string; // Links to observation_session, improvement_plan, etc.
  contextType?: ConversationContextType;
  createdAt: string;
  updatedAt: string;
  settings: ConversationSettings;
}

export type ConversationType = 
  | 'direct'        // One-on-one conversation
  | 'group'         // Group chat
  | 'observation'   // Observation session discussion
  | 'planning'      // Improvement planning discussion
  | 'community'     // Community/forum discussion
  | 'announcement'  // Broadcast/announcement channel
  | 'support';      // Support/help channel

export type ConversationContextType = 
  | 'observation_session'
  | 'improvement_plan'
  | 'school'
  | 'district'
  | 'province'
  | 'subject'
  | 'grade_level'
  | 'mentoring_circle';

export interface ConversationParticipant {
  userId: string;
  name: string;
  avatar?: string;
  role: ParticipantRole;
  permissions: ParticipantPermissions;
  joinedAt: string;
  lastSeenAt?: string;
  isOnline: boolean;
  isTyping: boolean;
}

export type ParticipantRole = 
  | 'owner'
  | 'admin'
  | 'moderator'
  | 'member'
  | 'observer'
  | 'guest';

export interface ParticipantPermissions {
  canSendMessages: boolean;
  canSendFiles: boolean;
  canAddParticipants: boolean;
  canRemoveParticipants: boolean;
  canEditConversation: boolean;
  canDeleteMessages: boolean;
  canPinMessages: boolean;
  canCreatePolls: boolean;
}

export interface ConversationSettings {
  allowFileSharing: boolean;
  allowVoiceMessages: boolean;
  allowVideoMessages: boolean;
  allowReactions: boolean;
  allowPolls: boolean;
  autoArchiveAfterDays: number;
  notificationLevel: NotificationLevel;
  requireApprovalForNewMembers: boolean;
  retentionPeriodDays?: number;
}

export type NotificationLevel = 'all' | 'mentions' | 'none';

export interface ChatState {
  conversations: Conversation[];
  activeConversationId?: string;
  messages: Record<string, Message[]>;
  typingUsers: Record<string, TypingUser[]>;
  connectionStatus: ConnectionStatus;
  unreadCount: number;
}

export interface TypingUser {
  userId: string;
  name: string;
  timestamp: string;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

// Notification System Types
export interface Notification {
  id: string;
  recipientId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  titleKh?: string;
  message: string;
  messageKh?: string;
  data: NotificationData;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  status: NotificationStatus;
  scheduledFor?: string;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
  expiresAt?: string;
}

export type NotificationType = 
  | 'message'
  | 'mention'
  | 'observation_due'
  | 'observation_completed'
  | 'plan_due'
  | 'plan_approved'
  | 'plan_rejected'
  | 'meeting_invite'
  | 'meeting_reminder'
  | 'system_announcement'
  | 'security_alert'
  | 'deadline_reminder'
  | 'achievement'
  | 'feedback_request'
  | 'file_shared'
  | 'user_joined'
  | 'user_left';

export type NotificationCategory = 
  | 'chat'
  | 'observations'
  | 'planning'
  | 'meetings'
  | 'system'
  | 'security'
  | 'achievements'
  | 'deadlines';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push' | 'webhook';

export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'cancelled';

export interface NotificationData {
  conversationId?: string;
  messageId?: string;
  observationId?: string;
  planId?: string;
  meetingId?: string;
  userId?: string;
  url?: string;
  actionRequired?: boolean;
  customData?: Record<string, any>;
}

export interface NotificationPreferences {
  userId: string;
  channels: Record<NotificationChannel, boolean>;
  categories: Record<NotificationCategory, NotificationChannelPreference>;
  quietHours: QuietHours;
  frequency: NotificationFrequency;
  language: 'en' | 'km';
  timezone: string;
}

export interface NotificationChannelPreference {
  enabled: boolean;
  channels: NotificationChannel[];
  priority: NotificationPriority;
}

export interface QuietHours {
  enabled: boolean;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  timezone: string;
  weekdays: boolean[];
}

export type NotificationFrequency = 'immediate' | 'hourly' | 'daily' | 'weekly';

// Video Conferencing Types
export interface Meeting {
  id: string;
  title: string;
  titleKh?: string;
  description?: string;
  descriptionKh?: string;
  hostId: string;
  participants: MeetingParticipant[];
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  status: MeetingStatus;
  type: MeetingType;
  settings: MeetingSettings;
  recordingUrl?: string;
  transcriptUrl?: string;
  notes?: string;
  contextId?: string;
  contextType?: string;
  createdAt: string;
  updatedAt: string;
}

export type MeetingStatus = 
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type MeetingType = 
  | 'observation_session'
  | 'planning_meeting'
  | 'training_session'
  | 'team_meeting'
  | 'one_on_one'
  | 'community_session'
  | 'workshop';

export interface MeetingParticipant {
  userId: string;
  name: string;
  email: string;
  role: MeetingRole;
  status: ParticipantStatus;
  joinedAt?: string;
  leftAt?: string;
  duration: number; // in minutes
}

export type MeetingRole = 'host' | 'co_host' | 'presenter' | 'participant' | 'observer';

export type ParticipantStatus = 'invited' | 'accepted' | 'declined' | 'tentative' | 'joined' | 'left';

export interface MeetingSettings {
  allowRecording: boolean;
  autoRecord: boolean;
  allowScreenShare: boolean;
  allowChat: boolean;
  allowFileSharing: boolean;
  waitingRoom: boolean;
  muteOnJoin: boolean;
  allowParticipantUnmute: boolean;
  maxParticipants: number;
  requirePassword: boolean;
  password?: string;
  allowJoinBeforeHost: boolean;
  endMeetingForAll: boolean;
}

// Collaborative Document Types
export interface Document {
  id: string;
  title: string;
  titleKh?: string;
  content: string;
  contentKh?: string;
  type: DocumentType;
  format: DocumentFormat;
  version: number;
  isLocked: boolean;
  lockedBy?: string;
  lockedAt?: string;
  ownerId: string;
  collaborators: DocumentCollaborator[];
  permissions: DocumentPermissions;
  tags: string[];
  folderId?: string;
  parentId?: string;
  contextId?: string;
  contextType?: string;
  createdAt: string;
  updatedAt: string;
  lastEditedBy: string;
  lastEditedAt: string;
}

export type DocumentType = 
  | 'improvement_plan'
  | 'observation_notes'
  | 'teaching_resource'
  | 'training_material'
  | 'policy_document'
  | 'template'
  | 'report'
  | 'minutes'
  | 'worksheet'
  | 'presentation';

export type DocumentFormat = 'rich_text' | 'markdown' | 'html' | 'pdf' | 'docx' | 'xlsx' | 'pptx';

export interface DocumentCollaborator {
  userId: string;
  name: string;
  avatar?: string;
  permission: CollaboratorPermission;
  addedAt: string;
  lastActiveAt?: string;
  isOnline: boolean;
  cursor?: CursorPosition;
}

export type CollaboratorPermission = 'view' | 'comment' | 'edit' | 'admin';

export interface CursorPosition {
  line: number;
  column: number;
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

export interface DocumentPermissions {
  isPublic: boolean;
  allowComments: boolean;
  allowSuggestions: boolean;
  allowDownload: boolean;
  allowPrint: boolean;
  allowCopy: boolean;
  requireApprovalForChanges: boolean;
  viewerCanComment: boolean;
  viewerCanSuggest: boolean;
}

export interface DocumentComment {
  id: string;
  documentId: string;
  authorId: string;
  authorName: string;
  content: string;
  position: CommentPosition;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  replies: DocumentComment[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentPosition {
  line: number;
  column: number;
  selectedText?: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  title: string;
  content: string;
  changes: DocumentChange[];
  createdBy: string;
  createdAt: string;
  size: number;
  checksum: string;
}

export interface DocumentChange {
  type: 'insert' | 'delete' | 'modify';
  position: number;
  content: string;
  userId: string;
  timestamp: string;
}

// Community and Discussion Types
export interface CommunityForum {
  id: string;
  name: string;
  nameKh?: string;
  description: string;
  descriptionKh?: string;
  category: ForumCategory;
  type: ForumType;
  access: ForumAccess;
  moderators: string[];
  subscriberCount: number;
  postCount: number;
  settings: ForumSettings;
  tags: string[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ForumCategory = 
  | 'general'
  | 'subject_specific'
  | 'grade_level'
  | 'methodology'
  | 'resources'
  | 'announcements'
  | 'questions'
  | 'best_practices'
  | 'troubleshooting';

export type ForumType = 'discussion' | 'q_and_a' | 'resource_sharing' | 'announcement';

export type ForumAccess = 'public' | 'restricted' | 'private';

export interface ForumSettings {
  allowPosts: boolean;
  allowComments: boolean;
  allowVoting: boolean;
  allowFileSharing: boolean;
  requireModeration: boolean;
  allowAnonymous: boolean;
  autoArchiveAfterDays: number;
}

export interface ForumPost {
  id: string;
  forumId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  title: string;
  titleKh?: string;
  content: string;
  contentKh?: string;
  type: PostType;
  tags: string[];
  attachments: MessageAttachment[];
  votes: PostVote[];
  comments: PostComment[];
  views: number;
  isSticky: boolean;
  isLocked: boolean;
  isFeatured: boolean;
  isAnswered?: boolean;
  acceptedAnswerId?: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
}

export type PostType = 'discussion' | 'question' | 'resource' | 'announcement' | 'poll';

export interface PostVote {
  userId: string;
  type: 'up' | 'down';
  timestamp: string;
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  parentId?: string;
  replies: PostComment[];
  votes: PostVote[];
  isAcceptedAnswer: boolean;
  createdAt: string;
  updatedAt: string;
}

// Real-time Event Types
export interface RealTimeEvent {
  type: RealTimeEventType;
  data: any;
  timestamp: string;
  userId?: string;
  conversationId?: string;
  metadata?: Record<string, any>;
}

export type RealTimeEventType = 
  | 'message_sent'
  | 'message_received'
  | 'message_read'
  | 'user_typing'
  | 'user_stopped_typing'
  | 'user_joined'
  | 'user_left'
  | 'user_online'
  | 'user_offline'
  | 'conversation_created'
  | 'conversation_updated'
  | 'notification_received'
  | 'document_updated'
  | 'cursor_moved'
  | 'meeting_started'
  | 'meeting_ended'
  | 'participant_joined'
  | 'participant_left';

// WebSocket Connection Types
export interface WebSocketConnection {
  id: string;
  userId: string;
  status: ConnectionStatus;
  connectedAt: string;
  lastPingAt: string;
  deviceInfo: {
    type: 'desktop' | 'mobile' | 'tablet';
    userAgent: string;
    ipAddress: string;
  };
}

// File Sharing Types
export interface SharedFile {
  id: string;
  name: string;
  originalName: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  downloadUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  conversationId?: string;
  documentId?: string;
  isPublic: boolean;
  permissions: FilePermissions;
  downloadCount: number;
  virus_scan_status: 'pending' | 'clean' | 'infected' | 'failed';
  expiresAt?: string;
}

export interface FilePermissions {
  allowView: boolean;
  allowDownload: boolean;
  allowShare: boolean;
  allowDelete: boolean;
  requiredRole?: string;
}

// Search and Discovery Types
export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  content?: string;
  author?: string;
  timestamp: string;
  relevanceScore: number;
  highlights: string[];
  contextData?: Record<string, any>;
}

export type SearchResultType = 
  | 'message'
  | 'conversation'
  | 'document'
  | 'forum_post'
  | 'user'
  | 'file';

export interface SearchFilters {
  type?: SearchResultType[];
  dateRange?: {
    start: string;
    end: string;
  };
  author?: string[];
  conversation?: string[];
  tags?: string[];
  fileTypes?: string[];
}

// Analytics and Insights Types
export interface CommunicationAnalytics {
  userId: string;
  period: AnalyticsPeriod;
  messagesSent: number;
  messagesReceived: number;
  conversationsStarted: number;
  filesShared: number;
  meetingsHosted: number;
  meetingsAttended: number;
  forumPostsCreated: number;
  documentsCreated: number;
  documentsEdited: number;
  responseTime: {
    average: number;
    median: number;
  };
  engagementScore: number;
  collaborationScore: number;
}

export type AnalyticsPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

// Integration Types
export interface IntegrationConfig {
  id: string;
  name: string;
  type: IntegrationType;
  isEnabled: boolean;
  settings: Record<string, any>;
  webhookUrl?: string;
  apiKey?: string;
  lastSyncAt?: string;
  syncStatus: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export type IntegrationType = 
  | 'email'
  | 'sms'
  | 'calendar'
  | 'video_conferencing'
  | 'file_storage'
  | 'learning_management_system'
  | 'student_information_system';