import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  Tabs,
  Tab,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  History as HistoryIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as ExportIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Create as CreateIcon,
  Update as UpdateIcon,
  Visibility as ViewIcon,
  Assignment as AssignIcon,
  Lock as LockIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  DateRange as DateRangeIcon,
  LocationOn as LocationIcon,
  Computer as ComputerIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format, formatDistanceToNow, startOfDay, endOfDay, subDays } from 'date-fns';
import {
  AuditLog,
  AuditAction,
  UserActivity,
  ActivityType,
  User,
  DeviceInfo,
} from '../../types/userManagement';

interface AuditLogViewerProps {
  auditLogs: AuditLog[];
  userActivities: UserActivity[];
  users: User[];
  onRefresh: () => Promise<void>;
  onExportLogs: (filters: any) => Promise<void>;
  onViewLogDetails: (log: AuditLog) => void;
  currentUser: User;
  canViewAllLogs?: boolean;
  canExportLogs?: boolean;
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
      id={`audit-tabpanel-${index}`}
      aria-labelledby={`audit-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  auditLogs,
  userActivities,
  users,
  onRefresh,
  onExportLogs,
  onViewLogDetails,
  currentUser,
  canViewAllLogs = false,
  canExportLogs = false,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<AuditAction | 'all'>('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [orderBy, setOrderBy] = useState<keyof AuditLog>('timestamp');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showLogDetails, setShowLogDetails] = useState(false);
  const [loading, setLoading] = useState(false);

  const dateRangeOptions = [
    { value: '1d', label: t('audit.dateRange.today') },
    { value: '7d', label: t('audit.dateRange.week') },
    { value: '30d', label: t('audit.dateRange.month') },
    { value: '90d', label: t('audit.dateRange.quarter') },
    { value: 'all', label: t('audit.dateRange.all') },
  ];

  const filteredLogs = useMemo(() => {
    let filtered = [...auditLogs];

    // Date range filter
    if (dateRange !== 'all') {
      const days = parseInt(dateRange.replace('d', ''));
      const startDate = startOfDay(subDays(new Date(), days));
      filtered = filtered.filter(log => new Date(log.timestamp) >= startDate);
    }

    // Search filter
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      filtered = filtered.filter(log =>
        log.userEmail.toLowerCase().includes(search) ||
        log.action.toLowerCase().includes(search) ||
        log.resource.toLowerCase().includes(search) ||
        log.ipAddress.includes(search) ||
        JSON.stringify(log.details).toLowerCase().includes(search)
      );
    }

    // Action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    // Resource filter
    if (resourceFilter !== 'all') {
      filtered = filtered.filter(log => log.resource === resourceFilter);
    }

    // User filter
    if (userFilter !== 'all') {
      filtered = filtered.filter(log => log.userId === userFilter);
    }

    // Permission filter - if user can't view all logs, only show their own
    if (!canViewAllLogs) {
      filtered = filtered.filter(log => log.userId === currentUser.id);
    }

    return filtered;
  }, [auditLogs, searchQuery, actionFilter, resourceFilter, userFilter, dateRange, canViewAllLogs, currentUser.id]);

  const sortedLogs = useMemo(() => {
    return [...filteredLogs].sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return order === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return order === 'asc' 
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      return 0;
    });
  }, [filteredLogs, orderBy, order]);

  const paginatedLogs = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return sortedLogs.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedLogs, page, rowsPerPage]);

  const activityStats = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const thisWeek = subDays(today, 7);
    const thisMonth = subDays(today, 30);

    const todayActivities = userActivities.filter(activity => 
      new Date(activity.timestamp) >= today
    );
    const weekActivities = userActivities.filter(activity => 
      new Date(activity.timestamp) >= thisWeek
    );
    const monthActivities = userActivities.filter(activity => 
      new Date(activity.timestamp) >= thisMonth
    );

    return {
      today: todayActivities.length,
      week: weekActivities.length,
      month: monthActivities.length,
      total: userActivities.length,
    };
  }, [userActivities]);

  const handleSort = (property: keyof AuditLog) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      await onExportLogs({
        searchQuery,
        actionFilter,
        resourceFilter,
        userFilter,
        dateRange,
        orderBy,
        order,
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: AuditAction) => {
    switch (action) {
      case 'login': return <LoginIcon />;
      case 'logout': return <LogoutIcon />;
      case 'create': return <CreateIcon />;
      case 'update': return <UpdateIcon />;
      case 'delete': return <DeleteIcon />;
      case 'view': return <ViewIcon />;
      case 'assign': return <AssignIcon />;
      case 'permission_change': return <SecurityIcon />;
      case 'password_change': return <LockIcon />;
      case 'security_event': return <WarningIcon />;
      default: return <InfoIcon />;
    }
  };

  const getActionColor = (action: AuditAction) => {
    switch (action) {
      case 'create': return theme.palette.success.main;
      case 'update': return theme.palette.info.main;
      case 'delete': return theme.palette.error.main;
      case 'login': return theme.palette.primary.main;
      case 'logout': return theme.palette.grey[500];
      case 'security_event': return theme.palette.warning.main;
      default: return theme.palette.text.secondary;
    }
  };

  const getDeviceIcon = (deviceInfo: DeviceInfo) => {
    switch (deviceInfo.type) {
      case 'mobile': return <SmartphoneIcon />;
      case 'tablet': return <TabletIcon />;
      case 'desktop': return <ComputerIcon />;
      default: return <ComputerIcon />;
    }
  };

  const renderAuditStats = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ backgroundColor: theme.palette.info.light }}>
                <AnalyticsIcon />
              </Avatar>
              <Box>
                <Typography variant="h4">{activityStats.today}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('audit.stats.today')}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ backgroundColor: theme.palette.primary.light }}>
                <HistoryIcon />
              </Avatar>
              <Box>
                <Typography variant="h4">{activityStats.week}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('audit.stats.thisWeek')}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ backgroundColor: theme.palette.success.light }}>
                <SecurityIcon />
              </Avatar>
              <Box>
                <Typography variant="h4">
                  {filteredLogs.filter(log => log.action === 'security_event').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('audit.stats.securityEvents')}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ backgroundColor: theme.palette.warning.light }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="h4">
                  {new Set(filteredLogs.map(log => log.userId)).size}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('audit.stats.activeUsers')}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderFilters = () => (
    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" gap={2}>
      <TextField
        placeholder={t('audit.searchPlaceholder')}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ minWidth: 250 }}
      />

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>{t('audit.action')}</InputLabel>
        <Select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value as AuditAction | 'all')}
          label={t('audit.action')}
        >
          <MenuItem value="all">{t('common.all')}</MenuItem>
          <MenuItem value="login">{t('audit.actions.login')}</MenuItem>
          <MenuItem value="logout">{t('audit.actions.logout')}</MenuItem>
          <MenuItem value="create">{t('audit.actions.create')}</MenuItem>
          <MenuItem value="update">{t('audit.actions.update')}</MenuItem>
          <MenuItem value="delete">{t('audit.actions.delete')}</MenuItem>
          <MenuItem value="view">{t('audit.actions.view')}</MenuItem>
          <MenuItem value="security_event">{t('audit.actions.security_event')}</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>{t('audit.dateRange')}</InputLabel>
        <Select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          label={t('audit.dateRange')}
        >
          {dateRangeOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {canViewAllLogs && (
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>{t('audit.user')}</InputLabel>
          <Select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            label={t('audit.user')}
          >
            <MenuItem value="all">{t('common.all')}</MenuItem>
            {users.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.firstName} {user.lastName} ({user.email})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <Box sx={{ flexGrow: 1 }} />

      <Stack direction="row" spacing={1}>
        <Tooltip title={t('common.refresh')}>
          <IconButton onClick={handleRefresh} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        {canExportLogs && (
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExport}
            disabled={loading}
            size="small"
          >
            {t('audit.export')}
          </Button>
        )}
      </Stack>
    </Stack>
  );

  const renderAuditTable = () => (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'timestamp'}
                direction={orderBy === 'timestamp' ? order : 'asc'}
                onClick={() => handleSort('timestamp')}
              >
                {t('audit.timestamp')}
              </TableSortLabel>
            </TableCell>
            <TableCell>{t('audit.user')}</TableCell>
            <TableCell>{t('audit.action')}</TableCell>
            <TableCell>{t('audit.resource')}</TableCell>
            <TableCell>{t('audit.device')}</TableCell>
            <TableCell>{t('audit.location')}</TableCell>
            <TableCell align="right">{t('common.actions')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedLogs.map((log) => {
            const user = users.find(u => u.id === log.userId);
            return (
              <TableRow key={log.id} hover>
                <TableCell>
                  <Typography variant="body2">
                    {format(new Date(log.timestamp), 'PPp')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar
                      src={user?.avatar}
                      sx={{ width: 32, height: 32 }}
                    >
                      {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : '?'}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">
                        {user ? `${user.firstName} ${user.lastName}` : log.userEmail}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {log.userEmail}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        color: getActionColor(log.action),
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {getActionIcon(log.action)}
                    </Box>
                    <Chip
                      label={t(`audit.actions.${log.action}`)}
                      size="small"
                      sx={{
                        backgroundColor: alpha(getActionColor(log.action), 0.1),
                        color: getActionColor(log.action),
                      }}
                    />
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {log.resource}
                  </Typography>
                  {log.resourceId && (
                    <Typography variant="caption" color="text.secondary">
                      ID: {log.resourceId}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocationIcon fontSize="small" color="action" />
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {log.ipAddress}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {log.userAgent?.split(' ')[0] || 'Unknown'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedLog(log);
                      setShowLogDetails(true);
                    }}
                  >
                    <ViewIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <TablePagination
        component="div"
        count={filteredLogs.length}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />
    </TableContainer>
  );

  const renderActivityTimeline = () => (
    <Timeline>
      {userActivities.slice(0, 20).map((activity, index) => {
        const user = users.find(u => u.id === activity.userId);
        return (
          <TimelineItem key={`${activity.userId}-${activity.timestamp}-${index}`}>
            <TimelineOppositeContent sx={{ m: 'auto 0' }} variant="body2" color="text.secondary">
              {format(new Date(activity.timestamp), 'HH:mm')}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot
                sx={{
                  backgroundColor: getActionColor(activity.activity as AuditAction),
                }}
              >
                {getActionIcon(activity.activity as AuditAction)}
              </TimelineDot>
              {index < userActivities.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent sx={{ py: '12px', px: 2 }}>
              <Typography variant="h6" component="span">
                {t(`audit.activities.${activity.activity}`)}
              </Typography>
              <Typography color="text.secondary">
                {user ? `${user.firstName} ${user.lastName}` : 'Unknown User'}
                {activity.location && ` • ${activity.location}`}
              </Typography>
              {activity.details && (
                <Typography variant="caption" color="text.secondary">
                  {JSON.stringify(activity.details)}
                </Typography>
              )}
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={2} alignItems="center">
              <HistoryIcon color="primary" />
              <Typography variant="h5">{t('audit.title')}</Typography>
            </Stack>
            {loading && <LinearProgress sx={{ width: 200 }} />}
          </Stack>

          {/* Stats */}
          {renderAuditStats()}

          {/* Tabs */}
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={t('audit.auditLogs')} />
            <Tab label={t('audit.activityTimeline')} />
          </Tabs>

          {/* Tab Panels */}
          <TabPanel value={tabValue} index={0}>
            <Stack spacing={3}>
              {/* Filters */}
              {renderFilters()}

              {/* Audit Table */}
              {renderAuditTable()}
            </Stack>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Stack spacing={2}>
              <Typography variant="h6">{t('audit.recentActivity')}</Typography>
              {renderActivityTimeline()}
            </Stack>
          </TabPanel>
        </Stack>
      </Paper>

      {/* Log Details Dialog */}
      <Dialog
        open={showLogDetails}
        onClose={() => setShowLogDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {t('audit.logDetails')}
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('audit.timestamp')}
                  </Typography>
                  <Typography variant="body2">
                    {format(new Date(selectedLog.timestamp), 'PPP p')}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('audit.user')}
                  </Typography>
                  <Typography variant="body2">
                    {selectedLog.userEmail}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('audit.action')}
                  </Typography>
                  <Chip
                    label={t(`audit.actions.${selectedLog.action}`)}
                    size="small"
                    sx={{
                      backgroundColor: alpha(getActionColor(selectedLog.action), 0.1),
                      color: getActionColor(selectedLog.action),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('audit.resource')}
                  </Typography>
                  <Typography variant="body2">
                    {selectedLog.resource}
                    {selectedLog.resourceId && ` (ID: ${selectedLog.resourceId})`}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('audit.ipAddress')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {selectedLog.ipAddress}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('audit.userAgent')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {selectedLog.userAgent}
                  </Typography>
                </Grid>
              </Grid>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {t('audit.details')}
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}
                  >
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </Typography>
                </Paper>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLogDetails(false)}>
            {t('common.close')}
          </Button>
          {selectedLog && (
            <Button variant="contained" onClick={() => onViewLogDetails(selectedLog)}>
              {t('audit.viewFullDetails')}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditLogViewer;