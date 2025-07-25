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
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Checkbox,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Tab,
  Tabs,
  useTheme,
  alpha,
} from '@mui/material';
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  School as SchoolIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as ManagerIcon,
  Person as UserIcon,
  Download as ExportIcon,
  Upload as ImportIcon,
  Security as SecurityIcon,
  Visibility as ViewIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format, formatDistanceToNow } from 'date-fns';
import {
  User,
  UserRole,
  UserStatus,
  UserStats,
  AuditLog,
} from '../../types/userManagement';

interface UserManagementDashboardProps {
  users: User[];
  roles: UserRole[];
  stats: UserStats;
  auditLogs: AuditLog[];
  onCreateUser: () => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onToggleUserStatus: (userId: string, status: UserStatus) => void;
  onBulkAction: (userIds: string[], action: string) => void;
  onExportUsers: (filters: any) => void;
  onImportUsers: () => void;
  onViewUserDetails: (user: User) => void;
  onViewAuditLog: (userId: string) => void;
  currentUser: User;
  canManageUsers?: boolean;
  canViewAudit?: boolean;
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
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const UserManagementDashboard: React.FC<UserManagementDashboardProps> = ({
  users,
  roles,
  stats,
  auditLogs,
  onCreateUser,
  onEditUser,
  onDeleteUser,
  onToggleUserStatus,
  onBulkAction,
  onExportUsers,
  onImportUsers,
  onViewUserDetails,
  onViewAuditLog,
  currentUser,
  canManageUsers = false,
  canViewAudit = false,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof User>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        if (
          !user.firstName.toLowerCase().includes(search) &&
          !user.lastName.toLowerCase().includes(search) &&
          !user.email.toLowerCase().includes(search) &&
          !user.username.toLowerCase().includes(search) &&
          !(user.profile.schoolName?.toLowerCase().includes(search))
        ) {
          return false;
        }
      }

      // Role filter
      if (roleFilter !== 'all' && user.role.id !== roleFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && user.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
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
  }, [filteredUsers, orderBy, order]);

  const paginatedUsers = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return sortedUsers.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedUsers, page, rowsPerPage]);

  const handleSort = (property: keyof User) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllUsers = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedUsers(paginatedUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleUserAction = (user: User, action: string) => {
    setAnchorEl(null);
    setSelectedUser(null);

    switch (action) {
      case 'view':
        onViewUserDetails(user);
        break;
      case 'edit':
        onEditUser(user);
        break;
      case 'delete':
        onDeleteUser(user.id);
        break;
      case 'activate':
        onToggleUserStatus(user.id, 'active');
        break;
      case 'deactivate':
        onToggleUserStatus(user.id, 'inactive');
        break;
      case 'suspend':
        onToggleUserStatus(user.id, 'suspended');
        break;
      case 'audit':
        onViewAuditLog(user.id);
        break;
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedUsers.length > 0) {
      onBulkAction(selectedUsers, action);
      setSelectedUsers([]);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    if (role.name.includes('admin')) return <AdminIcon />;
    if (role.name.includes('manager')) return <ManagerIcon />;
    return <UserIcon />;
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return theme.palette.success.main;
      case 'inactive':
        return theme.palette.grey[500];
      case 'suspended':
        return theme.palette.error.main;
      case 'pending_verification':
        return theme.palette.warning.main;
      case 'locked':
        return theme.palette.error.dark;
      default:
        return theme.palette.grey[500];
    }
  };

  const renderUserStats = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ backgroundColor: theme.palette.primary.light }}>
                <PeopleIcon />
              </Avatar>
              <Box>
                <Typography variant="h4">{stats.totalUsers}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('users.totalUsers')}
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
                <ActiveIcon />
              </Avatar>
              <Box>
                <Typography variant="h4">{stats.activeUsers}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('users.activeUsers')}
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
              <Avatar sx={{ backgroundColor: theme.palette.info.light }}>
                <TrendingUpIcon />
              </Avatar>
              <Box>
                <Typography variant="h4">{stats.newUsersThisMonth}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('users.newThisMonth')}
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
                <SecurityIcon />
              </Avatar>
              <Box>
                <Typography variant="h4">{stats.securityEvents}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('users.securityEvents')}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderUserFilters = () => (
    <Stack direction="row" spacing={2} alignItems="center">
      <TextField
        placeholder={t('common.search')}
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
        <InputLabel>{t('users.role')}</InputLabel>
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          label={t('users.role')}
        >
          <MenuItem value="all">{t('common.all')}</MenuItem>
          {roles.map(role => (
            <MenuItem key={role.id} value={role.id}>
              {i18n.language === 'km' ? role.displayNameKh || role.displayName : role.displayName}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>{t('users.status')}</InputLabel>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'all')}
          label={t('users.status')}
        >
          <MenuItem value="all">{t('common.all')}</MenuItem>
          <MenuItem value="active">{t('users.status.active')}</MenuItem>
          <MenuItem value="inactive">{t('users.status.inactive')}</MenuItem>
          <MenuItem value="suspended">{t('users.status.suspended')}</MenuItem>
          <MenuItem value="pending_verification">{t('users.status.pending_verification')}</MenuItem>
          <MenuItem value="locked">{t('users.status.locked')}</MenuItem>
        </Select>
      </FormControl>

      <Box sx={{ flexGrow: 1 }} />

      {selectedUsers.length > 0 && (
        <Stack direction="row" spacing={1}>
          <Chip
            label={t('users.selected', { count: selectedUsers.length })}
            onDelete={() => setSelectedUsers([])}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleBulkAction('activate')}
          >
            {t('users.activate')}
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleBulkAction('deactivate')}
          >
            {t('users.deactivate')}
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => handleBulkAction('delete')}
          >
            {t('common.delete')}
          </Button>
        </Stack>
      )}

      {canManageUsers && (
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<ImportIcon />}
            onClick={onImportUsers}
            size="small"
          >
            {t('users.import')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={() => onExportUsers({ roleFilter, statusFilter, searchQuery })}
            size="small"
          >
            {t('users.export')}
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={onCreateUser}
            size="small"
          >
            {t('users.createUser')}
          </Button>
        </Stack>
      )}
    </Stack>
  );

  const renderUserTable = () => (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                indeterminate={selectedUsers.length > 0 && selectedUsers.length < paginatedUsers.length}
                onChange={handleSelectAllUsers}
              />
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'firstName'}
                direction={orderBy === 'firstName' ? order : 'asc'}
                onClick={() => handleSort('firstName')}
              >
                {t('users.user')}
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'role'}
                direction={orderBy === 'role' ? order : 'asc'}
                onClick={() => handleSort('role')}
              >
                {t('users.role')}
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'status'}
                direction={orderBy === 'status' ? order : 'asc'}
                onClick={() => handleSort('status')}
              >
                {t('users.status')}
              </TableSortLabel>
            </TableCell>
            <TableCell>{t('users.school')}</TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'lastLogin'}
                direction={orderBy === 'lastLogin' ? order : 'asc'}
                onClick={() => handleSort('lastLogin')}
              >
                {t('users.lastLogin')}
              </TableSortLabel>
            </TableCell>
            <TableCell align="right">{t('common.actions')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedUsers.map((user) => (
            <TableRow
              key={user.id}
              hover
              selected={selectedUsers.includes(user.id)}
              sx={{
                opacity: user.isActive ? 1 : 0.6,
                backgroundColor: user.status === 'suspended' 
                  ? alpha(theme.palette.error.main, 0.05) 
                  : 'transparent',
              }}
            >
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => handleSelectUser(user.id)}
                />
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Badge
                    variant="dot"
                    color={user.sessions.some(s => s.isActive) ? 'success' : 'default'}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  >
                    <Avatar
                      src={user.avatar}
                      sx={{ width: 40, height: 40 }}
                    >
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </Avatar>
                  </Badge>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {user.firstName} {user.lastName}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        {user.email}
                      </Typography>
                      {user.phone && (
                        <>
                          <Typography variant="caption" color="text.secondary">•</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.phone}
                          </Typography>
                        </>
                      )}
                    </Stack>
                  </Box>
                </Stack>
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={1} alignItems="center">
                  {getRoleIcon(user.role)}
                  <Typography variant="body2">
                    {i18n.language === 'km' ? user.role.displayNameKh || user.role.displayName : user.role.displayName}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>
                <Chip
                  label={t(`users.status.${user.status}`)}
                  size="small"
                  sx={{
                    backgroundColor: alpha(getStatusColor(user.status), 0.1),
                    color: getStatusColor(user.status),
                    border: `1px solid ${getStatusColor(user.status)}`,
                  }}
                />
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={1} alignItems="center">
                  <SchoolIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {user.profile.schoolName || t('users.noSchool')}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {user.lastLogin 
                    ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })
                    : t('users.neverLoggedIn')
                  }
                </Typography>
              </TableCell>
              <TableCell align="right">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    setAnchorEl(e.currentTarget);
                    setSelectedUser(user);
                  }}
                >
                  <MoreIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TablePagination
        component="div"
        count={filteredUsers.length}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </TableContainer>
  );

  const renderAuditLogs = () => (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('audit.timestamp')}</TableCell>
            <TableCell>{t('audit.user')}</TableCell>
            <TableCell>{t('audit.action')}</TableCell>
            <TableCell>{t('audit.resource')}</TableCell>
            <TableCell>{t('audit.details')}</TableCell>
            <TableCell>{t('audit.ipAddress')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {auditLogs.slice(0, 10).map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                <Typography variant="body2">
                  {format(new Date(log.timestamp), 'PPp')}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{log.userEmail}</Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={t(`audit.actions.${log.action}`)}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">{log.resource}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {JSON.stringify(log.details)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {log.ipAddress}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={2} alignItems="center">
              <GroupIcon color="primary" />
              <Typography variant="h5">{t('users.management')}</Typography>
            </Stack>
            <IconButton>
              <SettingsIcon />
            </IconButton>
          </Stack>

          {/* Stats */}
          {renderUserStats()}

          {/* Tabs */}
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={t('users.users')} />
            {canViewAudit && <Tab label={t('users.auditLog')} />}
          </Tabs>

          {/* Tab Panels */}
          <TabPanel value={tabValue} index={0}>
            <Stack spacing={3}>
              {/* Filters */}
              {renderUserFilters()}

              {/* User Table */}
              {renderUserTable()}
            </Stack>
          </TabPanel>

          {canViewAudit && (
            <TabPanel value={tabValue} index={1}>
              <Stack spacing={2}>
                <Typography variant="h6">{t('users.recentActivity')}</Typography>
                {renderAuditLogs()}
              </Stack>
            </TabPanel>
          )}
        </Stack>
      </Paper>

      {/* User Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => {
          setAnchorEl(null);
          setSelectedUser(null);
        }}
      >
        <MenuItem onClick={() => selectedUser && handleUserAction(selectedUser, 'view')}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('users.viewDetails')}</ListItemText>
        </MenuItem>

        {canManageUsers && [
          <MenuItem key="edit" onClick={() => selectedUser && handleUserAction(selectedUser, 'edit')}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('common.edit')}</ListItemText>
          </MenuItem>,

          <Divider key="divider1" />,

          selectedUser?.status === 'active' ? (
            <MenuItem key="deactivate" onClick={() => selectedUser && handleUserAction(selectedUser, 'deactivate')}>
              <ListItemIcon>
                <InactiveIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('users.deactivate')}</ListItemText>
            </MenuItem>
          ) : (
            <MenuItem key="activate" onClick={() => selectedUser && handleUserAction(selectedUser, 'activate')}>
              <ListItemIcon>
                <ActiveIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('users.activate')}</ListItemText>
            </MenuItem>
          ),

          <MenuItem key="suspend" onClick={() => selectedUser && handleUserAction(selectedUser, 'suspend')}>
            <ListItemIcon>
              <BlockIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('users.suspend')}</ListItemText>
          </MenuItem>,

          <Divider key="divider2" />,

          <MenuItem 
            key="delete" 
            onClick={() => selectedUser && handleUserAction(selectedUser, 'delete')}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>{t('common.delete')}</ListItemText>
          </MenuItem>,
        ]}

        {canViewAudit && [
          <Divider key="divider3" />,
          <MenuItem key="audit" onClick={() => selectedUser && handleUserAction(selectedUser, 'audit')}>
            <ListItemIcon>
              <HistoryIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('users.viewAuditLog')}</ListItemText>
          </MenuItem>,
        ]}
      </Menu>
    </Box>
  );
};

export default UserManagementDashboard;