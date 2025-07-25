// Communication System Components
// Task 17: Communication and Real-Time Collaboration System

// Messaging Components
export { default as ChatInterface } from './Messaging/ChatInterface';
export { default as ConversationList } from './Messaging/ConversationList';

// Notification Components
export { default as NotificationCenter } from './Notifications/NotificationCenter';
export { default as AlertSystem, useAlertSystem } from './Notifications/AlertSystem';

// Collaboration Components
export { default as DocumentEditor } from './Collaboration/DocumentEditor';

// Video Conferencing Components
export { default as MeetingRoom } from './VideoConferencing/MeetingRoom';

// Community Components
export { default as CommunityForum } from './Community/CommunityForum';

// Re-export types for convenience
export type {
  // Core Communication Types
  Message,
  Conversation,
  ConversationType,
  ConversationParticipant,
  MessageType,
  MessageAttachment,
  MessageReaction,
  
  // Notification Types
  Notification,
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  NotificationStatus,
  NotificationPreferences,
  
  // Document Types
  Document,
  DocumentCollaborator,
  DocumentComment,
  DocumentVersion,
  DocumentChange,
  CollaboratorPermission,
  CursorPosition,
  
  // Meeting Types
  Meeting,
  MeetingParticipant,
  MeetingRole,
  MeetingSettings,
  ParticipantStatus,
  
  // Forum Types
  ForumPost,
  ForumThread,
  ForumCategory,
  ForumReaction,
  ForumComment,
  PostType,
  PostStatus,
} from '../../types/communication';

// Communication System Overview:
//
// This comprehensive communication system provides:
//
// 1. **Real-time Messaging**
//    - Direct messaging between users
//    - Group conversations
//    - Context-specific chats (observations, planning)
//    - Message reactions, replies, and attachments
//    - Online presence indicators
//
// 2. **Smart Notifications**
//    - Multi-channel delivery (in-app, email, SMS, push)
//    - Priority-based display and sounds
//    - Category filtering and preferences
//    - Read/unread tracking and bulk actions
//
// 3. **Collaborative Documents**
//    - Real-time collaborative editing
//    - Version history and change tracking
//    - Comments and annotations
//    - Permission management
//    - Export capabilities
//
// 4. **Video Conferencing**
//    - HD video calls with multiple participants
//    - Screen sharing and recording
//    - Real-time chat during meetings
//    - Host controls and participant management
//    - Connection quality monitoring
//
// 5. **Community Forums**
//    - Discussion posts with voting
//    - Q&A functionality
//    - Resource sharing
//    - Category organization
//    - Moderation tools
//
// Usage Examples:
//
// ```tsx
// // Real-time Chat
// <ChatInterface
//   conversations={conversations}
//   activeConversation={activeConv}
//   messages={messages}
//   currentUser={user}
//   onSendMessage={handleSendMessage}
//   onReaction={handleReaction}
// />
//
// // Notification Center
// <NotificationCenter
//   notifications={notifications}
//   preferences={notifPrefs}
//   currentUser={user}
//   onMarkAsRead={handleMarkRead}
//   onUpdatePreferences={updatePrefs}
//   isOpen={showNotifications}
//   onClose={() => setShowNotifications(false)}
// />
//
// // Collaborative Document
// <DocumentEditor
//   document={document}
//   collaborators={collaborators}
//   comments={comments}
//   currentUser={user}
//   onSave={handleSave}
//   onAddComment={handleComment}
//   canEdit={hasEditPermission}
// />
//
// // Video Meeting
// <MeetingRoom
//   meeting={meeting}
//   participants={participants}
//   currentUser={user}
//   localStream={localStream}
//   remoteStreams={remoteStreams}
//   isHost={isHost}
//   onToggleMic={toggleMic}
//   onToggleCamera={toggleCamera}
//   onScreenShare={shareScreen}
// />
//
// // Community Forum
// <CommunityForum
//   posts={forumPosts}
//   categories={categories}
//   currentUser={user}
//   onCreatePost={createPost}
//   onReactToPost={reactToPost}
//   onAddComment={addComment}
// />
// ```
//
// Integration Notes:
//
// - All components support bilingual content (English/Khmer)
// - Real-time features require WebSocket connection
// - Video conferencing uses WebRTC for peer-to-peer communication
// - Offline support with sync when connection restored
// - Comprehensive accessibility support
// - Mobile-responsive design
// - Error handling and loading states
// - Performance optimized for large datasets