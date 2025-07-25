import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Shield as ShieldIcon,
  Key as KeyIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  Public as PublicIcon,
  Assignment as AssignmentIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import {
  UserRole,
  Permission,
  PermissionAction,
  PermissionScope,
  PermissionCondition,
  User,
} from '../../types/userManagement';

interface RolePermissionManagerProps {
  roles: UserRole[];
  permissions: Permission[];
  users: User[];
  onCreateRole: (role: Omit<UserRole, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateRole: (roleId: string, updates: Partial<UserRole>) => Promise<void>;
  onDeleteRole: (roleId: string) => Promise<void>;
  onCreatePermission: (permission: Omit<Permission, 'id'>) => Promise<void>;
  onUpdatePermission: (permissionId: string, updates: Partial<Permission>) => Promise<void>;
  onDeletePermission: (permissionId: string) => Promise<void>;
  onAssignRoleToUsers: (roleId: string, userIds: string[]) => Promise<void>;
  currentUser: User;
  canManageRoles?: boolean;
  canManagePermissions?: boolean;
}

interface RoleFormData {
  name: string;
  displayName: string;
  displayNameKh: string;
  description: string;
  descriptionKh: string;
  level: number;
  permissions: string[];
  isActive: boolean;
}

interface PermissionFormData {
  resource: string;
  action: PermissionAction;
  scope: PermissionScope;
  description: string;
  descriptionKh: string;
  conditions: PermissionCondition[];
}

const RolePermissionManager: React.FC<RolePermissionManagerProps> = ({
  roles,
  permissions,
  users,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
  onCreatePermission,
  onUpdatePermission,
  onDeletePermission,
  onAssignRoleToUsers,
  currentUser,
  canManageRoles = false,
  canManagePermissions = false,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState<'roles' | 'permissions'>('roles');
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [expandedRoles, setExpandedRoles] = useState<string[]>([]);

  const [roleForm, setRoleForm] = useState<RoleFormData>({
    name: '',
    displayName: '',
    displayNameKh: '',
    description: '',
    descriptionKh: '',
    level: 1,
    permissions: [],
    isActive: true,
  });

  const [permissionForm, setPermissionForm] = useState<PermissionFormData>({
    resource: '',
    action: 'read',
    scope: 'own',
    description: '',
    descriptionKh: '',
    conditions: [],
  });

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const resources = [
    'users',
    'roles',
    'permissions',
    'observations',
    'improvement_plans',
    'feedback',
    'reports',
    'analytics',
    'schools',
    'districts',
    'provinces',
    'settings',
    'audit_logs',
  ];

  const actions: PermissionAction[] = [
    'create',
    'read',
    'update',
    'delete',
    'approve',
    'assign',
    'export',
    'import',
    'manage',
  ];

  const scopes: PermissionScope[] = [
    'own',
    'school',
    'district',
    'province',
    'national',
    'assigned',
  ];

  const handleCreateRole = async () => {
    try {
      await onCreateRole({
        name: roleForm.name,
        displayName: roleForm.displayName,
        displayNameKh: roleForm.displayNameKh,
        description: roleForm.description,
        descriptionKh: roleForm.descriptionKh,
        level: roleForm.level,
        permissions: permissions.filter(p => roleForm.permissions.includes(p.id)),
        isSystem: false,
        isActive: roleForm.isActive,
      });
      setShowRoleDialog(false);
      resetRoleForm();
    } catch (error) {
      console.error('Failed to create role:', error);
    }
  };

  const handleUpdateRole = async () => {
    if (editingRole) {
      try {
        await onUpdateRole(editingRole.id, {
          displayName: roleForm.displayName,
          displayNameKh: roleForm.displayNameKh,
          description: roleForm.description,
          descriptionKh: roleForm.descriptionKh,
          level: roleForm.level,
          permissions: permissions.filter(p => roleForm.permissions.includes(p.id)),
          isActive: roleForm.isActive,
        });
        setShowRoleDialog(false);
        setEditingRole(null);
        resetRoleForm();
      } catch (error) {
        console.error('Failed to update role:', error);
      }
    }
  };

  const handleCreatePermission = async () => {
    try {
      await onCreatePermission(permissionForm);
      setShowPermissionDialog(false);
      resetPermissionForm();
    } catch (error) {
      console.error('Failed to create permission:', error);
    }
  };

  const handleUpdatePermission = async () => {
    if (editingPermission) {
      try {
        await onUpdatePermission(editingPermission.id, permissionForm);
        setShowPermissionDialog(false);
        setEditingPermission(null);
        resetPermissionForm();
      } catch (error) {
        console.error('Failed to update permission:', error);
      }
    }
  };

  const handleAssignRole = async () => {
    if (selectedRole && selectedUsers.length > 0) {
      try {
        await onAssignRoleToUsers(selectedRole.id, selectedUsers);
        setShowAssignDialog(false);
        setSelectedRole(null);
        setSelectedUsers([]);
      } catch (error) {
        console.error('Failed to assign role:', error);
      }
    }
  };

  const resetRoleForm = () => {
    setRoleForm({
      name: '',
      displayName: '',
      displayNameKh: '',
      description: '',
      descriptionKh: '',
      level: 1,
      permissions: [],
      isActive: true,
    });
  };

  const resetPermissionForm = () => {
    setPermissionForm({
      resource: '',
      action: 'read',
      scope: 'own',
      description: '',
      descriptionKh: '',
      conditions: [],
    });
  };

  const openEditRole = (role: UserRole) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      displayName: role.displayName,
      displayNameKh: role.displayNameKh || '',
      description: role.description,
      descriptionKh: role.descriptionKh || '',
      level: role.level,
      permissions: role.permissions.map(p => p.id),
      isActive: role.isActive,
    });
    setShowRoleDialog(true);
  };

  const openEditPermission = (permission: Permission) => {
    setEditingPermission(permission);
    setPermissionForm({
      resource: permission.resource,
      action: permission.action,
      scope: permission.scope,
      description: permission.description,
      descriptionKh: permission.descriptionKh || '',
      conditions: permission.conditions || [],
    });
    setShowPermissionDialog(true);
  };

  const toggleRoleExpanded = (roleId: string) => {
    setExpandedRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const getScopeIcon = (scope: PermissionScope) => {
    switch (scope) {
      case 'own':
        return <PersonIcon />;
      case 'school':
        return <SchoolIcon />;
      case 'district':
        return <BusinessIcon />;
      case 'province':
        return <BusinessIcon />;
      case 'national':
        return <PublicIcon />;
      case 'assigned':
        return <AssignmentIcon />;
      default:
        return <PersonIcon />;
    }
  };

  const getActionColor = (action: PermissionAction) => {
    switch (action) {
      case 'create':
        return theme.palette.success.main;
      case 'read':
        return theme.palette.info.main;
      case 'update':
        return theme.palette.warning.main;
      case 'delete':
        return theme.palette.error.main;
      case 'manage':
        return theme.palette.primary.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const renderRoles = () => (
    <Stack spacing={3}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">{t('roles.title')}</Typography>
        {canManageRoles && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingRole(null);
              resetRoleForm();
              setShowRoleDialog(true);
            }}
          >
            {t('roles.create')}
          </Button>
        )}
      </Stack>

      {/* Roles List */}
      <Grid container spacing={2}>
        {roles.map((role) => {
          const userCount = users.filter(u => u.role.id === role.id).length;
          return (
            <Grid item xs={12} md={6} lg={4} key={role.id}>
              <Card
                variant="outlined"
                sx={{
                  opacity: role.isActive ? 1 : 0.6,
                  borderColor: role.isSystem ? theme.palette.primary.main : theme.palette.divider,
                }}
              >
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <ShieldIcon color={role.isActive ? 'primary' : 'disabled'} />
                        <Typography variant="h6">
                          {i18n.language === 'km' ? role.displayNameKh || role.displayName : role.displayName}
                        </Typography>
                        {role.isSystem && (
                          <Chip label={t('roles.system')} size="small" color="primary" />
                        )}
                      </Stack>
                      <Badge badgeContent={userCount} color="primary" showZero>
                        <GroupIcon color="action" />
                      </Badge>
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      {i18n.language === 'km' ? role.descriptionKh || role.description : role.description}
                    </Typography>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        {t('roles.level')}: {role.level}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        | {t('roles.permissions')}: {role.permissions.length}
                      </Typography>
                    </Stack>

                    <Accordion
                      expanded={expandedRoles.includes(role.id)}
                      onChange={() => toggleRoleExpanded(role.id)}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="body2">
                          {t('roles.viewPermissions')}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={1}>
                          {role.permissions.map((permission) => (
                            <Stack
                              key={permission.id}
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              {getScopeIcon(permission.scope)}
                              <Chip
                                label={permission.action}
                                size="small"
                                sx={{
                                  backgroundColor: alpha(getActionColor(permission.action), 0.1),
                                  color: getActionColor(permission.action),
                                }}
                              />
                              <Typography variant="caption">
                                {permission.resource}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  </Stack>
                </CardContent>

                {canManageRoles && (
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => openEditRole(role)}
                      disabled={role.isSystem && !currentUser.permissions.some(p => p.resource === 'system' && p.action === 'manage')}
                    >
                      {t('common.edit')}
                    </Button>
                    <Button
                      size="small"
                      startIcon={<GroupIcon />}
                      onClick={() => {
                        setSelectedRole(role);
                        setShowAssignDialog(true);
                      }}
                    >
                      {t('roles.assign')}
                    </Button>
                    {!role.isSystem && (
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => onDeleteRole(role.id)}
                      >
                        {t('common.delete')}
                      </Button>
                    )}
                  </CardActions>
                )}
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );

  const renderPermissions = () => (
    <Stack spacing={3}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">{t('permissions.title')}</Typography>
        {canManagePermissions && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingPermission(null);
              resetPermissionForm();
              setShowPermissionDialog(true);
            }}
          >
            {t('permissions.create')}
          </Button>
        )}
      </Stack>

      {/* Permissions Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('permissions.resource')}</TableCell>
              <TableCell>{t('permissions.action')}</TableCell>
              <TableCell>{t('permissions.scope')}</TableCell>
              <TableCell>{t('permissions.description')}</TableCell>
              <TableCell>{t('permissions.conditions')}</TableCell>
              {canManagePermissions && <TableCell align="right">{t('common.actions')}</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {permissions.map((permission) => (
              <TableRow key={permission.id}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {permission.resource}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={permission.action}
                    size="small"
                    sx={{
                      backgroundColor: alpha(getActionColor(permission.action), 0.1),
                      color: getActionColor(permission.action),
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {getScopeIcon(permission.scope)}
                    <Typography variant="body2">
                      {t(`permissions.scope.${permission.scope}`)}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {i18n.language === 'km' ? permission.descriptionKh || permission.description : permission.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  {permission.conditions && permission.conditions.length > 0 ? (
                    <Chip
                      label={t('permissions.hasConditions', { count: permission.conditions.length })}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      {t('permissions.noConditions')}
                    </Typography>
                  )}
                </TableCell>
                {canManagePermissions && (
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton
                        size="small"
                        onClick={() => openEditPermission(permission)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDeletePermission(permission.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={2} alignItems="center">
              <SecurityIcon color="primary" />
              <Typography variant="h5">{t('rbac.title')}</Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                variant={selectedTab === 'roles' ? 'contained' : 'outlined'}
                onClick={() => setSelectedTab('roles')}
                startIcon={<ShieldIcon />}
              >
                {t('rbac.roles')}
              </Button>
              <Button
                variant={selectedTab === 'permissions' ? 'contained' : 'outlined'}
                onClick={() => setSelectedTab('permissions')}
                startIcon={<KeyIcon />}
              >
                {t('rbac.permissions')}
              </Button>
            </Stack>
          </Stack>

          {/* Content */}
          {selectedTab === 'roles' ? renderRoles() : renderPermissions()}
        </Stack>
      </Paper>

      {/* Role Dialog */}
      <Dialog
        open={showRoleDialog}
        onClose={() => {
          setShowRoleDialog(false);
          setEditingRole(null);
          resetRoleForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingRole ? t('roles.edit') : t('roles.create')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label={t('roles.name')}
              value={roleForm.name}
              onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              disabled={!!editingRole}
              required
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('roles.displayName')}
                  value={roleForm.displayName}
                  onChange={(e) => setRoleForm({ ...roleForm, displayName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('roles.displayNameKh')}
                  value={roleForm.displayNameKh}
                  onChange={(e) => setRoleForm({ ...roleForm, displayNameKh: e.target.value })}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={t('roles.description')}
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={t('roles.descriptionKh')}
                  value={roleForm.descriptionKh}
                  onChange={(e) => setRoleForm({ ...roleForm, descriptionKh: e.target.value })}
                />
              </Grid>
            </Grid>

            <TextField
              type="number"
              label={t('roles.level')}
              value={roleForm.level}
              onChange={(e) => setRoleForm({ ...roleForm, level: parseInt(e.target.value) })}
              inputProps={{ min: 1, max: 100 }}
              helperText={t('roles.levelHelp')}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={roleForm.isActive}
                  onChange={(e) => setRoleForm({ ...roleForm, isActive: e.target.checked })}
                />
              }
              label={t('roles.active')}
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('roles.permissions')}
              </Typography>
              <Grid container spacing={1}>
                {permissions.map((permission) => (
                  <Grid item xs={12} sm={6} md={4} key={permission.id}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={roleForm.permissions.includes(permission.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRoleForm({
                                ...roleForm,
                                permissions: [...roleForm.permissions, permission.id],
                              });
                            } else {
                              setRoleForm({
                                ...roleForm,
                                permissions: roleForm.permissions.filter(id => id !== permission.id),
                              });
                            }
                          }}
                        />
                      }
                      label={
                        <Stack spacing={0.5}>
                          <Typography variant="body2">
                            {permission.resource} - {permission.action}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {permission.description}
                          </Typography>
                        </Stack>
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowRoleDialog(false);
              setEditingRole(null);
              resetRoleForm();
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={editingRole ? handleUpdateRole : handleCreateRole}
            disabled={!roleForm.name || !roleForm.displayName}
          >
            {editingRole ? t('common.update') : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Permission Dialog */}
      <Dialog
        open={showPermissionDialog}
        onClose={() => {
          setShowPermissionDialog(false);
          setEditingPermission(null);
          resetPermissionForm();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingPermission ? t('permissions.edit') : t('permissions.create')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>{t('permissions.resource')}</InputLabel>
              <Select
                value={permissionForm.resource}
                onChange={(e) => setPermissionForm({ ...permissionForm, resource: e.target.value })}
                label={t('permissions.resource')}
              >
                {resources.map((resource) => (
                  <MenuItem key={resource} value={resource}>
                    {resource}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>{t('permissions.action')}</InputLabel>
              <Select
                value={permissionForm.action}
                onChange={(e) => setPermissionForm({ ...permissionForm, action: e.target.value as PermissionAction })}
                label={t('permissions.action')}
              >
                {actions.map((action) => (
                  <MenuItem key={action} value={action}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: getActionColor(action),
                        }}
                      />
                      {action}
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>{t('permissions.scope')}</InputLabel>
              <Select
                value={permissionForm.scope}
                onChange={(e) => setPermissionForm({ ...permissionForm, scope: e.target.value as PermissionScope })}
                label={t('permissions.scope')}
              >
                {scopes.map((scope) => (
                  <MenuItem key={scope} value={scope}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {getScopeIcon(scope)}
                      {t(`permissions.scope.${scope}`)}
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label={t('permissions.description')}
                  value={permissionForm.description}
                  onChange={(e) => setPermissionForm({ ...permissionForm, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label={t('permissions.descriptionKh')}
                  value={permissionForm.descriptionKh}
                  onChange={(e) => setPermissionForm({ ...permissionForm, descriptionKh: e.target.value })}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowPermissionDialog(false);
              setEditingPermission(null);
              resetPermissionForm();
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={editingPermission ? handleUpdatePermission : handleCreatePermission}
            disabled={!permissionForm.resource || !permissionForm.action || !permissionForm.scope}
          >
            {editingPermission ? t('common.update') : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Role Dialog */}
      <Dialog
        open={showAssignDialog}
        onClose={() => {
          setShowAssignDialog(false);
          setSelectedRole(null);
          setSelectedUsers([]);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {t('roles.assignToUsers')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {selectedRole && (
              <Alert severity="info">
                {t('roles.assigningRole', { role: selectedRole.displayName })}
              </Alert>
            )}

            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {users
                .filter(user => user.role.id !== selectedRole?.id)
                .map((user) => (
                  <ListItem
                    key={user.id}
                    button
                    onClick={() => {
                      setSelectedUsers(prev =>
                        prev.includes(user.id)
                          ? prev.filter(id => id !== user.id)
                          : [...prev, user.id]
                      );
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox checked={selectedUsers.includes(user.id)} />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${user.firstName} ${user.lastName}`}
                      secondary={
                        <Stack direction="row" spacing={1}>
                          <span>{user.email}</span>
                          <Chip
                            label={user.role.displayName}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>
                      }
                    />
                  </ListItem>
                ))}
            </List>

            {selectedUsers.length > 0 && (
              <Alert severity="warning">
                {t('roles.assignWarning', { count: selectedUsers.length })}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowAssignDialog(false);
              setSelectedRole(null);
              setSelectedUsers([]);
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleAssignRole}
            disabled={selectedUsers.length === 0}
          >
            {t('roles.assign')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RolePermissionManager;