import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Button,
  Chip,
  Badge,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Tabs,
  Tab,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  Fab,
  Pagination,
  useTheme,
  alpha,
  Collapse,
  Grid,
} from '@mui/material';
import {
  Forum as ForumIcon,
  Add as AddIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Reply as ReplyIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Report as ReportIcon,
  Close as CloseIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Poll as PollIcon,
  Event as EventIcon,
  School as SchoolIcon,
  Group as GroupIcon,
  TrendingUp as TrendingIcon,
  Schedule as ScheduleIcon,
  Visibility as ViewIcon,
  Comment as CommentIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Star as StarIcon,
  CheckCircle as SolvedIcon,
  Help as QuestionIcon,
  Announcement as AnnouncementIcon,
  LocalLibrary as ResourceIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import {
  ForumPost,
  ForumThread,
  ForumCategory,
  ForumReaction,
  ForumComment,
  PostType,
  PostStatus,
} from '../../../types/communication';
import { User } from '../../../types/userManagement';

interface CommunityForumProps {
  posts: ForumPost[];
  threads: ForumThread[];
  categories: ForumCategory[];
  currentUser: User;
  onCreatePost: (post: Partial<ForumPost>) => Promise<void>;
  onUpdatePost: (postId: string, updates: Partial<ForumPost>) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
  onReactToPost: (postId: string, reaction: ForumReaction) => Promise<void>;
  onBookmarkPost: (postId: string, bookmark: boolean) => Promise<void>;
  onSharePost: (postId: string) => Promise<void>;
  onReportPost: (postId: string, reason: string) => Promise<void>;
  onAddComment: (postId: string, content: string) => Promise<void>;
  onUploadFile: (file: File) => Promise<string>;
  canModerate?: boolean;
  isLoading?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`forum-tabpanel-${index}`}
      aria-labelledby={`forum-tab-${index}`}
      {...other}
    >
      {value === index && children}
    </div>
  );
};

const CommunityForum: React.FC<CommunityForumProps> = ({
  posts,
  threads,
  categories,
  currentUser,
  onCreatePost,
  onUpdatePost,
  onDeletePost,
  onReactToPost,
  onBookmarkPost,
  onSharePost,
  onReportPost,
  onAddComment,
  onUploadFile,
  canModerate = false,
  isLoading = false,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent');
  const [filterType, setFilterType] = useState<PostType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [postsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [newPostData, setNewPostData] = useState({
    title: '',
    content: '',
    type: 'discussion' as PostType,
    categoryId: '',
    tags: [] as string[],
  });

  const filteredPosts = useMemo(() => {
    let filtered = [...posts];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.categoryId === selectedCategory);
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(post => post.type === filterType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort posts
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          const aScore = (a.reactions?.likes || 0) - (a.reactions?.dislikes || 0);
          const bScore = (b.reactions?.likes || 0) - (b.reactions?.dislikes || 0);
          return bScore - aScore;
        case 'trending':
          // Calculate trending score based on recent activity and engagement
          const now = new Date().getTime();
          const aActivity = new Date(a.lastActivityAt || a.createdAt).getTime();
          const bActivity = new Date(b.lastActivityAt || b.createdAt).getTime();
          const aAge = now - new Date(a.createdAt).getTime();
          const bAge = now - new Date(b.createdAt).getTime();
          const aTrending = ((a.reactions?.likes || 0) + (a.commentCount || 0)) / Math.max(aAge / (1000 * 60 * 60), 1); // per hour
          const bTrending = ((b.reactions?.likes || 0) + (b.commentCount || 0)) / Math.max(bAge / (1000 * 60 * 60), 1);
          return bTrending - aTrending;
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [posts, selectedCategory, filterType, searchQuery, sortBy]);

  const paginatedPosts = useMemo(() => {
    const startIndex = (page - 1) * postsPerPage;
    return filteredPosts.slice(startIndex, startIndex + postsPerPage);
  }, [filteredPosts, page, postsPerPage]);

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const getPostIcon = (type: PostType) => {
    switch (type) {
      case 'question': return <QuestionIcon />;
      case 'announcement': return <AnnouncementIcon />;
      case 'resource': return <ResourceIcon />;
      case 'poll': return <PollIcon />;
      case 'event': return <EventIcon />;
      case 'discussion':
      default: return <ForumIcon />;
    }
  };

  const getPostTypeColor = (type: PostType) => {
    switch (type) {
      case 'question': return theme.palette.info.main;
      case 'announcement': return theme.palette.warning.main;
      case 'resource': return theme.palette.success.main;
      case 'poll': return theme.palette.secondary.main;
      case 'event': return theme.palette.primary.main;
      case 'discussion':
      default: return theme.palette.text.primary;
    }
  };

  const handleCreatePost = async () => {
    try {
      await onCreatePost({
        ...newPostData,
        authorId: currentUser.id,
        status: 'published',
        createdAt: new Date().toISOString(),
      });
      setNewPostData({
        title: '',
        content: '',
        type: 'discussion',
        categoryId: '',
        tags: [],
      });
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  const handlePostAction = (action: string, post: ForumPost) => {
    setAnchorEl(null);
    setSelectedPost(null);

    switch (action) {
      case 'bookmark':
        onBookmarkPost(post.id, !post.isBookmarked);
        break;
      case 'share':
        onSharePost(post.id);
        break;
      case 'edit':
        // Open edit dialog
        break;
      case 'delete':
        onDeletePost(post.id);
        break;
      case 'report':
        // Open report dialog
        break;
    }
  };

  const renderCreatePostDialog = () => (
    <Dialog
      open={showCreateDialog}
      onClose={() => setShowCreateDialog(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>{t('forum.createPost')}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label={t('forum.postTitle')}
            value={newPostData.title}
            onChange={(e) => setNewPostData({ ...newPostData, title: e.target.value })}
            placeholder={t('forum.postTitlePlaceholder')}
          />

          <FormControl fullWidth>
            <InputLabel>{t('forum.postType')}</InputLabel>
            <Select
              value={newPostData.type}
              onChange={(e) => setNewPostData({ ...newPostData, type: e.target.value as PostType })}
              label={t('forum.postType')}
            >
              <MenuItem value="discussion">{t('forum.types.discussion')}</MenuItem>
              <MenuItem value="question">{t('forum.types.question')}</MenuItem>
              <MenuItem value="announcement">{t('forum.types.announcement')}</MenuItem>
              <MenuItem value="resource">{t('forum.types.resource')}</MenuItem>
              <MenuItem value="poll">{t('forum.types.poll')}</MenuItem>
              <MenuItem value="event">{t('forum.types.event')}</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>{t('forum.category')}</InputLabel>
            <Select
              value={newPostData.categoryId}
              onChange={(e) => setNewPostData({ ...newPostData, categoryId: e.target.value })}
              label={t('forum.category')}
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={6}
            label={t('forum.postContent')}
            value={newPostData.content}
            onChange={(e) => setNewPostData({ ...newPostData, content: e.target.value })}
            placeholder={t('forum.postContentPlaceholder')}
          />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {t('forum.attachments')}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button startIcon={<AttachFileIcon />} size="small">
                {t('forum.attachFile')}
              </Button>
              <Button startIcon={<ImageIcon />} size="small">
                {t('forum.attachImage')}
              </Button>
              <Button startIcon={<LinkIcon />} size="small">
                {t('forum.attachLink')}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowCreateDialog(false)}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleCreatePost}
          disabled={!newPostData.title.trim() || !newPostData.content.trim()}
        >
          {t('forum.createPost')}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderPostCard = (post: ForumPost) => {
    const isExpanded = expandedPost === post.id;
    const category = categories.find(c => c.id === post.categoryId);
    const reactionScore = (post.reactions?.likes || 0) - (post.reactions?.dislikes || 0);
    
    return (
      <Card
        key={post.id}
        sx={{
          mb: 2,
          '&:hover': {
            boxShadow: theme.shadows[4],
          },
          transition: 'box-shadow 0.2s ease-in-out',
        }}
      >
        <CardContent>
          <Stack direction="row" spacing={2}>
            {/* Post Stats */}
            <Box sx={{ textAlign: 'center', minWidth: 60 }}>
              <Typography variant="h6" color={reactionScore > 0 ? 'success.main' : 'text.primary'}>
                {reactionScore}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('forum.score')}
              </Typography>
              
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2">
                  {post.commentCount || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('forum.replies')}
                </Typography>
              </Box>
              
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2">
                  {post.viewCount || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('forum.views')}
                </Typography>
              </Box>
            </Box>

            {/* Post Content */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" alignItems="flex-start" spacing={1} mb={1}>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: getPostTypeColor(post.type),
                  }}
                >
                  {getPostIcon(post.type)}
                </Avatar>
                
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                    <Typography
                      variant="h6"
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { color: 'primary.main' },
                        flex: 1,
                        minWidth: 0,
                      }}
                      onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                      noWrap
                    >
                      {post.title}
                    </Typography>
                    
                    {post.status === 'solved' && (
                      <Chip
                        icon={<SolvedIcon />}
                        label={t('forum.solved')}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    )}
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <Chip
                      label={t(`forum.types.${post.type}`)}
                      size="small"
                      sx={{ bgcolor: alpha(getPostTypeColor(post.type), 0.1) }}
                    />
                    {category && (
                      <Chip
                        label={category.name}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {post.tags.slice(0, 3).map((tag) => (
                      <Chip
                        key={tag}
                        label={`#${tag}`}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    ))}
                  </Stack>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: isExpanded ? 'none' : 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      mb: 1,
                    }}
                  >
                    {post.content}
                  </Typography>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 24, height: 24 }}>
                        {post.authorName?.charAt(0)}
                      </Avatar>
                      <Typography variant="caption" color="text.secondary">
                        {t('forum.by')} {post.authorName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={0.5}>
                      <IconButton
                        size="small"
                        onClick={() => onReactToPost(post.id, 'like')}
                        color={post.userReaction === 'like' ? 'primary' : 'default'}
                      >
                        <ThumbUpIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="caption" sx={{ alignSelf: 'center' }}>
                        {post.reactions?.likes || 0}
                      </Typography>

                      <IconButton
                        size="small"
                        onClick={() => onReactToPost(post.id, 'dislike')}
                        color={post.userReaction === 'dislike' ? 'error' : 'default'}
                      >
                        <ThumbDownIcon fontSize="small" />
                      </IconButton>

                      <IconButton size="small" onClick={() => setExpandedPost(isExpanded ? null : post.id)}>
                        <ReplyIcon fontSize="small" />
                      </IconButton>

                      <IconButton
                        size="small"
                        onClick={() => onBookmarkPost(post.id, !post.isBookmarked)}
                        color={post.isBookmarked ? 'primary' : 'default'}
                      >
                        {post.isBookmarked ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                      </IconButton>

                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setAnchorEl(e.currentTarget);
                          setSelectedPost(post);
                        }}
                      >
                        <MoreIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </CardContent>

        {/* Expanded Content */}
        <Collapse in={isExpanded}>
          <CardContent sx={{ pt: 0 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1" paragraph>
              {post.content}
            </Typography>
            
            {post.attachments && post.attachments.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('forum.attachments')}
                </Typography>
                <Stack direction="row" spacing={1}>
                  {post.attachments.map((attachment, index) => (
                    <Chip
                      key={index}
                      label={attachment.name}
                      icon={<AttachFileIcon />}
                      variant="outlined"
                      clickable
                    />
                  ))}
                </Stack>
              </Box>
            )}

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('forum.addComment')}
              </Typography>
              <Stack direction="row" spacing={1}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t('forum.commentPlaceholder')}
                  multiline
                  rows={2}
                />
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  sx={{ alignSelf: 'flex-end' }}
                >
                  {t('forum.reply')}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Collapse>
      </Card>
    );
  };

  const renderFilters = () => (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            size="small"
            placeholder={t('forum.searchPosts')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Grid>
        
        <Grid item xs={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>{t('forum.category')}</InputLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              label={t('forum.category')}
            >
              <MenuItem value="all">{t('common.all')}</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>{t('forum.type')}</InputLabel>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as PostType | 'all')}
              label={t('forum.type')}
            >
              <MenuItem value="all">{t('common.all')}</MenuItem>
              <MenuItem value="discussion">{t('forum.types.discussion')}</MenuItem>
              <MenuItem value="question">{t('forum.types.question')}</MenuItem>
              <MenuItem value="announcement">{t('forum.types.announcement')}</MenuItem>
              <MenuItem value="resource">{t('forum.types.resource')}</MenuItem>
              <MenuItem value="poll">{t('forum.types.poll')}</MenuItem>
              <MenuItem value="event">{t('forum.types.event')}</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>{t('forum.sortBy')}</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'popular' | 'trending')}
              label={t('forum.sortBy')}
            >
              <MenuItem value="recent">{t('forum.recent')}</MenuItem>
              <MenuItem value="popular">{t('forum.popular')}</MenuItem>
              <MenuItem value="trending">{t('forum.trending')}</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={6} md={2}>
          <Typography variant="body2" color="text.secondary" align="center">
            {filteredPosts.length} {t('forum.posts')}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={2}>
            <ForumIcon color="primary" />
            <Typography variant="h5">{t('forum.title')}</Typography>
          </Stack>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowCreateDialog(true)}
          >
            {t('forum.newPost')}
          </Button>
        </Stack>
      </Paper>

      {/* Filters */}
      {renderFilters()}

      {/* Posts List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {paginatedPosts.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <ForumIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('forum.noPosts')}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {searchQuery ? t('forum.noSearchResults') : t('forum.startFirstPost')}
            </Typography>
            {!searchQuery && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowCreateDialog(true)}
              >
                {t('forum.createFirstPost')}
              </Button>
            )}
          </Paper>
        ) : (
          <Stack spacing={0}>
            {paginatedPosts.map(renderPostCard)}
          </Stack>
        )}
      </Box>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setShowCreateDialog(true)}
      >
        <AddIcon />
      </Fab>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => {
          setAnchorEl(null);
          setSelectedPost(null);
        }}
      >
        {selectedPost && (
          <>
            <MenuItem onClick={() => handlePostAction('bookmark', selectedPost)}>
              {selectedPost.isBookmarked ? <BookmarkIcon sx={{ mr: 1 }} /> : <BookmarkBorderIcon sx={{ mr: 1 }} />}
              {selectedPost.isBookmarked ? t('forum.removeBookmark') : t('forum.addBookmark')}
            </MenuItem>
            <MenuItem onClick={() => handlePostAction('share', selectedPost)}>
              <ShareIcon sx={{ mr: 1 }} />
              {t('forum.share')}
            </MenuItem>
            {(selectedPost.authorId === currentUser.id || canModerate) && (
              <>
                <Divider />
                <MenuItem onClick={() => handlePostAction('edit', selectedPost)}>
                  <EditIcon sx={{ mr: 1 }} />
                  {t('forum.edit')}
                </MenuItem>
                <MenuItem 
                  onClick={() => handlePostAction('delete', selectedPost)}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteIcon sx={{ mr: 1 }} />
                  {t('forum.delete')}
                </MenuItem>
              </>
            )}
            <Divider />
            <MenuItem onClick={() => handlePostAction('report', selectedPost)}>
              <ReportIcon sx={{ mr: 1 }} />
              {t('forum.report')}
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Create Post Dialog */}
      {renderCreatePostDialog()}
    </Box>
  );
};

export default CommunityForum;