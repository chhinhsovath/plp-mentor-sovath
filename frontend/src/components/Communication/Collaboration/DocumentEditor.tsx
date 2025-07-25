import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Toolbar,
  IconButton,
  Button,
  TextField,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  Badge,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Drawer,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Save as SaveIcon,
  Share as ShareIcon,
  History as HistoryIcon,
  Comment as CommentIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  MoreVert as MoreIcon,
  PersonAdd as AddCollaboratorIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatListBulleted as BulletListIcon,
  FormatListNumbered as NumberedListIcon,
  FormatAlignLeft as AlignLeftIcon,
  FormatAlignCenter as AlignCenterIcon,
  FormatAlignRight as AlignRightIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  Code as CodeIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  Document,
  DocumentCollaborator,
  DocumentComment,
  DocumentVersion,
  DocumentChange,
  CollaboratorPermission,
  CursorPosition,
} from '../../../types/communication';
import { User } from '../../../types/userManagement';

interface DocumentEditorProps {
  document: Document;
  collaborators: DocumentCollaborator[];
  comments: DocumentComment[];
  versions: DocumentVersion[];
  currentUser: User;
  onSave: (content: string, title?: string) => Promise<void>;
  onShare: (userIds: string[], permission: CollaboratorPermission) => Promise<void>;
  onLock: (lock: boolean) => Promise<void>;
  onAddComment: (content: string, position: any) => Promise<void>;
  onResolveComment: (commentId: string) => Promise<void>;
  onContentChange: (content: string, change: DocumentChange) => void;
  onCursorMove: (position: CursorPosition) => void;
  onExport: (format: 'pdf' | 'docx' | 'html') => Promise<void>;
  canEdit?: boolean;
  canComment?: boolean;
  isLoading?: boolean;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({
  document,
  collaborators,
  comments,
  versions,
  currentUser,
  onSave,
  onShare,
  onLock,
  onAddComment,
  onResolveComment,
  onContentChange,
  onCursorMove,
  onExport,
  canEdit = false,
  canComment = false,
  isLoading = false,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const editorRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState(document.content);
  const [title, setTitle] = useState(document.title);
  const [showVersions, setShowVersions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState<any>(null);
  const [commentText, setCommentText] = useState('');
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      if (content !== document.content && canEdit) {
        handleSave();
      }
    }, 2000);

    return () => clearTimeout(autoSaveTimer);
  }, [content, document.content, canEdit]);

  // Handle text selection for comments
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim() && canComment) {
        setSelectedText(selection.toString());
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectionPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          text: selection.toString(),
          range: range,
        });
      } else {
        setSelectedText('');
        setSelectionPosition(null);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('keyup', handleSelection);
    };
  }, [canComment]);

  const handleSave = async () => {
    if (!canEdit || saving) return;

    setSaving(true);
    try {
      await onSave(content, title);
      setLastSaved(new Date());
    } finally {
      setSaving(false);
    }
  };

  const handleContentChange = (newContent: string) => {
    if (!canEdit) return;

    const change: DocumentChange = {
      type: 'modify',
      position: 0, // This would be calculated based on cursor position
      content: newContent,
      userId: currentUser.id,
      timestamp: new Date().toISOString(),
    };

    setContent(newContent);
    onContentChange(newContent, change);
  };

  const handleFormatText = (command: string, value?: string) => {
    if (!canEdit) return;

    document.execCommand(command, false, value);
    const newContent = editorRef.current?.innerHTML || '';
    handleContentChange(newContent);
  };

  const handleAddComment = async () => {
    if (!selectedText || !commentText.trim()) return;

    try {
      await onAddComment(commentText, {
        selectedText,
        position: selectionPosition,
      });
      setCommentText('');
      setShowCommentDialog(false);
      setSelectedText('');
      setSelectionPosition(null);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleLockDocument = async () => {
    try {
      await onLock(!document.isLocked);
    } catch (error) {
      console.error('Failed to lock/unlock document:', error);
    }
  };

  const renderToolbar = () => (
    <Toolbar 
      sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        minHeight: 56,
        px: 2,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
        {/* Document Actions */}
        <Stack direction="row" spacing={1}>
          <Button
            startIcon={saving ? <SaveIcon /> : <SaveIcon />}
            onClick={handleSave}
            disabled={!canEdit || saving || content === document.content}
            size="small"
          >
            {saving ? t('documents.saving') : t('documents.save')}
          </Button>
          
          <Button
            startIcon={<ShareIcon />}
            onClick={() => setShowShareDialog(true)}
            size="small"
          >
            {t('documents.share')}
          </Button>

          <IconButton
            onClick={handleLockDocument}
            disabled={!canEdit}
            color={document.isLocked ? 'error' : 'default'}
          >
            {document.isLocked ? <LockIcon /> : <UnlockIcon />}
          </IconButton>
        </Stack>

        <Divider orientation="vertical" flexItem />

        {/* Formatting Tools */}
        {canEdit && (
          <Stack direction="row" spacing={0.5}>
            <IconButton
              onClick={() => handleFormatText('bold')}
              size="small"
            >
              <BoldIcon />
            </IconButton>
            <IconButton
              onClick={() => handleFormatText('italic')}
              size="small"
            >
              <ItalicIcon />
            </IconButton>
            <IconButton
              onClick={() => handleFormatText('underline')}
              size="small"
            >
              <UnderlineIcon />
            </IconButton>
            
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            
            <IconButton
              onClick={() => handleFormatText('insertUnorderedList')}
              size="small"
            >
              <BulletListIcon />
            </IconButton>
            <IconButton
              onClick={() => handleFormatText('insertOrderedList')}
              size="small"
            >
              <NumberedListIcon />
            </IconButton>
            
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            
            <IconButton
              onClick={() => handleFormatText('justifyLeft')}
              size="small"
            >
              <AlignLeftIcon />
            </IconButton>
            <IconButton
              onClick={() => handleFormatText('justifyCenter')}
              size="small"
            >
              <AlignCenterIcon />
            </IconButton>
            <IconButton
              onClick={() => handleFormatText('justifyRight')}
              size="small"
            >
              <AlignRightIcon />
            </IconButton>
          </Stack>
        )}

        <Box sx={{ flexGrow: 1 }} />

        {/* Collaboration Tools */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Badge badgeContent={comments.filter(c => !c.isResolved).length} color="primary">
            <IconButton
              onClick={() => setShowComments(!showComments)}
              color={showComments ? 'primary' : 'default'}
            >
              <CommentIcon />
            </IconButton>
          </Badge>

          <IconButton onClick={() => setShowVersions(!showVersions)}>
            <HistoryIcon />
          </IconButton>

          <Stack direction="row" spacing={-1}>
            {collaborators.slice(0, 3).map((collaborator) => (
              <Tooltip key={collaborator.userId} title={collaborator.name}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                  color={collaborator.isOnline ? 'success' : 'default'}
                >
                  <Avatar
                    sx={{ width: 32, height: 32, border: 2, borderColor: 'background.paper' }}
                    src={collaborator.avatar}
                  >
                    {collaborator.name.charAt(0)}
                  </Avatar>
                </Badge>
              </Tooltip>
            ))}
            {collaborators.length > 3 && (
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.400' }}>
                +{collaborators.length - 3}
              </Avatar>
            )}
          </Stack>

          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <MoreIcon />
          </IconButton>
        </Stack>
      </Stack>
    </Toolbar>
  );

  const renderEditor = () => (
    <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Main Editor */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Title */}
        <TextField
          fullWidth
          variant="standard"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!canEdit}
          sx={{
            p: 3,
            '& .MuiInput-root': {
              fontSize: '2rem',
              fontWeight: 600,
            },
          }}
          placeholder={t('documents.documentTitle')}
        />

        {/* Content Editor */}
        <Box
          ref={editorRef}
          contentEditable={canEdit}
          suppressContentEditableWarning
          dangerouslySetInnerHTML={{ __html: content }}
          onInput={(e) => handleContentChange(e.currentTarget.innerHTML)}
          sx={{
            flex: 1,
            p: 3,
            overflow: 'auto',
            outline: 'none',
            minHeight: 400,
            fontFamily: theme.typography.body1.fontFamily,
            fontSize: theme.typography.body1.fontSize,
            lineHeight: 1.6,
            '& p': { margin: 0, marginBottom: 1 },
            '& h1, & h2, & h3, & h4, & h5, & h6': { marginBottom: 1 },
            '& ul, & ol': { paddingLeft: 2 },
            '& blockquote': {
              borderLeft: `4px solid ${theme.palette.primary.main}`,
              paddingLeft: 2,
              margin: 0,
              marginBottom: 1,
              fontStyle: 'italic',
            },
          }}
        />

        {/* Status Bar */}
        <Box
          sx={{
            p: 1,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {content.length} {t('documents.characters')}
          </Typography>
          
          {lastSaved && (
            <Typography variant="caption" color="text.secondary">
              {t('documents.lastSaved')}: {format(lastSaved, 'HH:mm')}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Comments Sidebar */}
      {showComments && (
        <Paper
          sx={{
            width: 350,
            borderLeft: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">{t('documents.comments')}</Typography>
              <IconButton onClick={() => setShowComments(false)}>
                <CloseIcon />
              </IconButton>
            </Stack>
          </Box>

          <List sx={{ flex: 1, overflow: 'auto' }}>
            {comments.map((comment) => (
              <ListItem key={comment.id} sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {comment.authorName.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2">{comment.authorName}</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {comment.content}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(comment.createdAt), 'MMM dd, HH:mm')}
                    </Typography>
                    
                    {!comment.isResolved && canComment && (
                      <Button
                        size="small"
                        onClick={() => onResolveComment(comment.id)}
                        sx={{ mt: 1 }}
                      >
                        {t('documents.resolve')}
                      </Button>
                    )}
                  </Box>
                </Stack>
                
                {comment.isResolved && (
                  <Chip
                    label={t('documents.resolved')}
                    size="small"
                    color="success"
                    sx={{ alignSelf: 'flex-start', mt: 1 }}
                  />
                )}
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Versions Sidebar */}
      {showVersions && (
        <Paper
          sx={{
            width: 300,
            borderLeft: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">{t('documents.versions')}</Typography>
              <IconButton onClick={() => setShowVersions(false)}>
                <CloseIcon />
              </IconButton>
            </Stack>
          </Box>

          <List sx={{ flex: 1, overflow: 'auto' }}>
            {versions.map((version) => (
              <ListItem key={version.id} button>
                <ListItemText
                  primary={`${t('documents.version')} ${version.version}`}
                  secondary={
                    <Box>
                      <Typography variant="caption" display="block">
                        {format(new Date(version.createdAt), 'MMM dd, yyyy HH:mm')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {version.changes.length} {t('documents.changes')}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );

  // Comment button for selected text
  const renderCommentButton = () => {
    if (!selectedText || !selectionPosition) return null;

    return (
      <Box
        sx={{
          position: 'absolute',
          top: selectionPosition.top,
          left: selectionPosition.left,
          zIndex: 1000,
        }}
      >
        <Button
          size="small"
          variant="contained"
          startIcon={<CommentIcon />}
          onClick={() => setShowCommentDialog(true)}
          sx={{ boxShadow: theme.shadows[8] }}
        >
          {t('documents.addComment')}
        </Button>
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {renderToolbar()}
      {renderEditor()}
      {renderCommentButton()}

      {/* Comment Dialog */}
      <Dialog
        open={showCommentDialog}
        onClose={() => setShowCommentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('documents.addComment')}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('documents.selectedText')}: "{selectedText}"
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder={t('documents.commentPlaceholder')}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCommentDialog(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleAddComment}
            disabled={!commentText.trim()}
          >
            {t('documents.addComment')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog
        open={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('documents.shareDocument')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            {t('documents.shareDescription')}
          </Typography>
          {/* Share form would go here */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowShareDialog(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="contained">
            {t('documents.share')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* More Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => onExport('pdf')}>
          <DownloadIcon sx={{ mr: 1 }} />
          {t('documents.exportPDF')}
        </MenuItem>
        <MenuItem onClick={() => onExport('docx')}>
          <DownloadIcon sx={{ mr: 1 }} />
          {t('documents.exportWord')}
        </MenuItem>
        <MenuItem onClick={() => window.print()}>
          <PrintIcon sx={{ mr: 1 }} />
          {t('documents.print')}
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default DocumentEditor;