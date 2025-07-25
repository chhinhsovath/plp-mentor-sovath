import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  Box,
  Chip,
  Stack,
  TextField,
  MenuItem,
  IconButton,
  Collapse,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Create as SignedIcon,
  Verified as VerifiedIcon,
  Cancel as RejectedIcon,
  Edit as ModifiedIcon,
  Delete as DeletedIcon,
  Person as UserIcon,
  Schedule as TimeIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

interface AuditEvent {
  id: string;
  action: 'signature_created' | 'signature_verified' | 'signature_rejected' | 'signature_modified' | 'signature_deleted' | 'approval' | 'rejection' | 'delegation';
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: string;
  metadata: {
    signatureRole?: string;
    reason?: string;
    changes?: string[];
    ipAddress?: string;
    userAgent?: string;
    delegatedTo?: string;
  };
}

interface SignatureAuditTrailProps {
  sessionId: string;
  events: AuditEvent[];
  onRefresh?: () => void;
}

const SignatureAuditTrail: React.FC<SignatureAuditTrailProps> = ({
  sessionId,
  events,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const getEventIcon = (action: string) => {
    switch (action) {
      case 'signature_created':
        return <SignedIcon />;
      case 'signature_verified':
        return <VerifiedIcon />;
      case 'signature_rejected':
        return <RejectedIcon />;
      case 'signature_modified':
        return <ModifiedIcon />;
      case 'signature_deleted':
        return <DeletedIcon />;
      case 'approval':
        return <VerifiedIcon />;
      case 'rejection':
        return <RejectedIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getEventColor = (action: string): 'primary' | 'success' | 'error' | 'warning' | 'info' => {
    switch (action) {
      case 'signature_created':
        return 'primary';
      case 'signature_verified':
      case 'approval':
        return 'success';
      case 'signature_rejected':
      case 'rejection':
        return 'error';
      case 'signature_modified':
        return 'warning';
      case 'signature_deleted':
        return 'error';
      default:
        return 'info';
    }
  };

  const formatEventDescription = (event: AuditEvent): string => {
    const baseDesc = t(`audit.actions.${event.action}`, {
      user: event.userName,
      role: event.metadata.signatureRole || event.userRole,
    });

    if (event.metadata.delegatedTo) {
      return `${baseDesc} ${t('audit.delegatedTo', { name: event.metadata.delegatedTo })}`;
    }

    return baseDesc;
  };

  const filterEvents = (): AuditEvent[] => {
    let filtered = [...events];

    // Action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter((e) => e.action === actionFilter);
    }

    // User filter
    if (userFilter !== 'all') {
      filtered = filtered.filter((e) => e.userId === userFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter((e) =>
            isAfter(e.timestamp, startOfDay(now)) && isBefore(e.timestamp, endOfDay(now))
          );
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter((e) => isAfter(e.timestamp, weekAgo));
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter((e) => isAfter(e.timestamp, monthAgo));
          break;
      }
    }

    // Sort by timestamp descending
    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const uniqueUsers = Array.from(new Set(events.map((e) => e.userId))).map((id) => {
    const user = events.find((e) => e.userId === id);
    return { id, name: user?.userName || id };
  });

  const filteredEvents = filterEvents();
  const paginatedEvents = filteredEvents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (isMobile) {
    return (
      <Paper elevation={3} sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{t('audit.title')}</Typography>
            <IconButton onClick={() => setFilterExpanded(!filterExpanded)}>
              {filterExpanded ? <CollapseIcon /> : <FilterIcon />}
            </IconButton>
          </Stack>

          <Collapse in={filterExpanded}>
            <Stack spacing={2} sx={{ mb: 2 }}>
              <TextField
                select
                size="small"
                label={t('audit.filter.action')}
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                fullWidth
              >
                <MenuItem value="all">{t('common.all')}</MenuItem>
                <MenuItem value="signature_created">{t('audit.actions.signature_created')}</MenuItem>
                <MenuItem value="signature_verified">{t('audit.actions.signature_verified')}</MenuItem>
                <MenuItem value="approval">{t('audit.actions.approval')}</MenuItem>
                <MenuItem value="rejection">{t('audit.actions.rejection')}</MenuItem>
              </TextField>

              <TextField
                select
                size="small"
                label={t('audit.filter.user')}
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                fullWidth
              >
                <MenuItem value="all">{t('common.all')}</MenuItem>
                {uniqueUsers.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                size="small"
                label={t('audit.filter.date')}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                fullWidth
              >
                <MenuItem value="all">{t('common.all')}</MenuItem>
                <MenuItem value="today">{t('audit.filter.today')}</MenuItem>
                <MenuItem value="week">{t('audit.filter.thisWeek')}</MenuItem>
                <MenuItem value="month">{t('audit.filter.thisMonth')}</MenuItem>
              </TextField>
            </Stack>
          </Collapse>

          <Timeline position="right">
            {paginatedEvents.map((event, index) => (
              <TimelineItem key={event.id}>
                <TimelineOppositeContent sx={{ display: 'none' }} />
                <TimelineSeparator>
                  <TimelineDot color={getEventColor(event.action)}>
                    {getEventIcon(event.action)}
                  </TimelineDot>
                  {index < paginatedEvents.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {formatEventDescription(event)}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                      <Chip
                        icon={<TimeIcon />}
                        label={format(event.timestamp, 'MMM d, h:mm a')}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        icon={<UserIcon />}
                        label={event.userRole}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                    {event.metadata.reason && (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        <Typography variant="caption">{event.metadata.reason}</Typography>
                      </Alert>
                    )}
                  </Paper>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>

          <TablePagination
            component="div"
            count={filteredEvents.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {t('audit.title')}
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton onClick={() => setFilterExpanded(!filterExpanded)}>
            <FilterIcon />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            {t('audit.showing', { count: filteredEvents.length, total: events.length })}
          </Typography>
        </Stack>

        <Collapse in={filterExpanded}>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <TextField
              select
              size="small"
              label={t('audit.filter.action')}
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="all">{t('common.all')}</MenuItem>
              <MenuItem value="signature_created">{t('audit.actions.signature_created')}</MenuItem>
              <MenuItem value="signature_verified">{t('audit.actions.signature_verified')}</MenuItem>
              <MenuItem value="signature_rejected">{t('audit.actions.signature_rejected')}</MenuItem>
              <MenuItem value="approval">{t('audit.actions.approval')}</MenuItem>
              <MenuItem value="rejection">{t('audit.actions.rejection')}</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label={t('audit.filter.user')}
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="all">{t('common.all')}</MenuItem>
              {uniqueUsers.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label={t('audit.filter.date')}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">{t('common.all')}</MenuItem>
              <MenuItem value="today">{t('audit.filter.today')}</MenuItem>
              <MenuItem value="week">{t('audit.filter.thisWeek')}</MenuItem>
              <MenuItem value="month">{t('audit.filter.thisMonth')}</MenuItem>
            </TextField>
          </Stack>
        </Collapse>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('audit.table.timestamp')}</TableCell>
              <TableCell>{t('audit.table.action')}</TableCell>
              <TableCell>{t('audit.table.user')}</TableCell>
              <TableCell>{t('audit.table.details')}</TableCell>
              <TableCell>{t('audit.table.metadata')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedEvents.map((event) => (
              <TableRow key={event.id} hover>
                <TableCell>
                  <Typography variant="body2">
                    {format(event.timestamp, 'MMM d, yyyy')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(event.timestamp, 'h:mm:ss a')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getEventIcon(event.action)}
                    label={t(`audit.actions.${event.action}`)}
                    size="small"
                    color={getEventColor(event.action)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{event.userName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t(`roles.${event.userRole}`)}
                  </Typography>
                </TableCell>
                <TableCell>
                  {event.metadata.reason && (
                    <Typography variant="body2">{event.metadata.reason}</Typography>
                  )}
                  {event.metadata.delegatedTo && (
                    <Typography variant="body2">
                      {t('audit.delegatedTo', { name: event.metadata.delegatedTo })}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    {event.metadata.ipAddress && (
                      <Tooltip title="IP Address">
                        <Chip label={event.metadata.ipAddress} size="small" />
                      </Tooltip>
                    )}
                    {event.metadata.signatureRole && (
                      <Chip 
                        label={t(`roles.${event.metadata.signatureRole}`)} 
                        size="small" 
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredEvents.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {t('audit.noEvents')}
        </Alert>
      )}

      <TablePagination
        component="div"
        count={filteredEvents.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 25, 50]}
      />
    </Paper>
  );
};

export default SignatureAuditTrail;