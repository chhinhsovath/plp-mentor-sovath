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
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Tooltip,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  School as SchoolIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Palette as ThemeIcon,
  Language as LanguageIcon,
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ContactEmergency as EmergencyIcon,
  Certificate as CertificateIcon,
  Psychology as SkillIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  User,
  UserProfile,
  UserPreferences,
  Qualification,
  EmergencyContact,
  Address,
  UserSession,
} from '../../types/userManagement';

interface UserProfileManagerProps {
  user: User;
  isOwnProfile: boolean;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  onUpdateAvatar: (file: File) => Promise<void>;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  onTerminateSession: (sessionId: string) => Promise<void>;
  onAddQualification: (qualification: Omit<Qualification, 'verified'>) => Promise<void>;
  onUpdateQualification: (index: number, qualification: Qualification) => Promise<void>;
  onRemoveQualification: (index: number) => Promise<void>;
  canEditProfile?: boolean;
  canViewSessions?: boolean;
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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const UserProfileManager: React.FC<UserProfileManagerProps> = ({
  user,
  isOwnProfile,
  onUpdateProfile,
  onUpdatePreferences,
  onUpdateAvatar,
  onChangePassword,
  onTerminateSession,
  onAddQualification,
  onUpdateQualification,
  onRemoveQualification,
  canEditProfile = false,
  canViewSessions = false,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [editing, setEditing] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showQualificationDialog, setShowQualificationDialog] = useState(false);
  const [editingQualification, setEditingQualification] = useState<{ index: number; qualification: Qualification } | null>(null);

  const [profileForm, setProfileForm] = useState<UserProfile>(user.profile);
  const [preferencesForm, setPreferencesForm] = useState<UserPreferences>(user.preferences);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [qualificationForm, setQualificationForm] = useState<Omit<Qualification, 'verified'>>({
    type: 'degree',
    title: '',
    institution: '',
    year: new Date().getFullYear(),
    documents: [],
  });

  const handleSaveProfile = async () => {
    try {
      await onUpdateProfile(profileForm);
      setEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleSavePreferences = async () => {
    try {
      await onUpdatePreferences(preferencesForm);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return; // Show error
    }

    try {
      await onChangePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setShowPasswordDialog(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Failed to change password:', error);
    }
  };

  const handleAddQualification = async () => {
    try {
      await onAddQualification(qualificationForm);
      setShowQualificationDialog(false);
      setQualificationForm({
        type: 'degree',
        title: '',
        institution: '',
        year: new Date().getFullYear(),
        documents: [],
      });
    } catch (error) {
      console.error('Failed to add qualification:', error);
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpdateAvatar(file);
    }
  };

  const getSessionStatus = (session: UserSession) => {
    if (session.isActive) {
      return { color: 'success', label: t('sessions.active') };
    } else if (session.logoutReason === 'timeout') {
      return { color: 'warning', label: t('sessions.timeout') };
    } else if (session.logoutReason === 'security') {
      return { color: 'error', label: t('sessions.security') };
    }
    return { color: 'default', label: t('sessions.ended') };
  };

  const renderBasicInfo = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Stack spacing={3} alignItems="center">
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  canEditProfile ? (
                    <IconButton
                      size="small"
                      component="label"
                      sx={{
                        backgroundColor: 'primary.main',
                        color: 'white',
                        '&:hover': { backgroundColor: 'primary.dark' },
                      }}
                    >
                      <UploadIcon fontSize="small" />
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleAvatarUpload}
                      />
                    </IconButton>
                  ) : null
                }
              >
                <Avatar
                  src={user.avatar}
                  sx={{ width: 120, height: 120, fontSize: '2rem' }}
                >
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </Avatar>
              </Badge>

              <Stack spacing={1} alignItems="center">
                <Typography variant="h5">
                  {user.firstName} {user.lastName}
                </Typography>
                <Chip
                  label={i18n.language === 'km' ? user.role.displayNameKh || user.role.displayName : user.role.displayName}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={t(`users.status.${user.status}`)}
                  color={user.isActive ? 'success' : 'default'}
                  size="small"
                />
              </Stack>

              <Divider sx={{ width: '100%' }} />

              <Stack spacing={2} sx={{ width: '100%' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <EmailIcon color="action" />
                  <Typography variant="body2">{user.email}</Typography>
                </Stack>
                {user.phone && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PhoneIcon color="action" />
                    <Typography variant="body2">{user.phone}</Typography>
                  </Stack>
                )}
                {user.profile.schoolName && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <SchoolIcon color="action" />
                    <Typography variant="body2">{user.profile.schoolName}</Typography>
                  </Stack>
                )}
                {user.profile.position && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <WorkIcon color="action" />
                    <Typography variant="body2">{user.profile.position}</Typography>
                  </Stack>
                )}
              </Stack>

              {user.profile.biography && (
                <>
                  <Divider sx={{ width: '100%' }} />
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    {i18n.language === 'km' ? user.profile.biographyKh || user.profile.biography : user.profile.biography}
                  </Typography>
                </>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">{t('profile.details')}</Typography>
              {canEditProfile && (
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => setEditing(!editing)}
                  variant={editing ? 'contained' : 'outlined'}
                >
                  {editing ? t('common.cancel') : t('common.edit')}
                </Button>
              )}
            </Stack>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('profile.firstName')}
                  value={editing ? profileForm.firstName || '' : user.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  disabled={!editing}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('profile.lastName')}
                  value={editing ? profileForm.lastName || '' : user.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  disabled={!editing}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('profile.email')}
                  value={user.email}
                  disabled
                  helperText={t('profile.emailHelp')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('profile.phone')}
                  value={editing ? profileForm.phone || '' : user.phone || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  disabled={!editing}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('profile.position')}
                  value={editing ? profileForm.position || '' : user.profile.position || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, position: e.target.value })}
                  disabled={!editing}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('profile.department')}
                  value={editing ? profileForm.department || '' : user.profile.department || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                  disabled={!editing}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('profile.employeeId')}
                  value={editing ? profileForm.employeeId || '' : user.profile.employeeId || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, employeeId: e.target.value })}
                  disabled={!editing}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!editing}>
                  <InputLabel>{t('profile.gender')}</InputLabel>
                  <Select
                    value={editing ? profileForm.gender || '' : user.profile.gender || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value as any })}
                    label={t('profile.gender')}
                  >
                    <MenuItem value="male">{t('profile.male')}</MenuItem>
                    <MenuItem value="female">{t('profile.female')}</MenuItem>
                    <MenuItem value="other">{t('profile.other')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={t('profile.biography')}
                  value={editing ? profileForm.biography || '' : user.profile.biography || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, biography: e.target.value })}
                  disabled={!editing}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={t('profile.biographyKh')}
                  value={editing ? profileForm.biographyKh || '' : user.profile.biographyKh || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, biographyKh: e.target.value })}
                  disabled={!editing}
                />
              </Grid>
            </Grid>

            {editing && (
              <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
                <Button onClick={() => setEditing(false)}>
                  {t('common.cancel')}
                </Button>
                <Button variant="contained" onClick={handleSaveProfile}>
                  {t('common.save')}
                </Button>
              </Stack>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderQualifications = () => (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">{t('profile.qualifications')}</Typography>
          {canEditProfile && (
            <Button
              startIcon={<AddIcon />}
              onClick={() => setShowQualificationDialog(true)}
              variant="outlined"
            >
              {t('profile.addQualification')}
            </Button>
          )}
        </Stack>

        <List>
          {user.profile.qualifications.map((qualification, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <CertificateIcon color={qualification.verified ? 'success' : 'action'} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body1">{qualification.title}</Typography>
                    <Chip
                      label={t(`profile.qualificationType.${qualification.type}`)}
                      size="small"
                      variant="outlined"
                    />
                    {qualification.verified && (
                      <Chip
                        label={t('profile.verified')}
                        size="small"
                        color="success"
                        icon={<CheckIcon />}
                      />
                    )}
                  </Stack>
                }
                secondary={
                  <Stack spacing={0.5}>
                    <Typography variant="body2">
                      {qualification.institution} • {qualification.year}
                    </Typography>
                    {qualification.documents && qualification.documents.length > 0 && (
                      <Typography variant="caption" color="primary">
                        {t('profile.documentsAttached', { count: qualification.documents.length })}
                      </Typography>
                    )}
                  </Stack>
                }
              />
              {canEditProfile && (
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => {
                      setEditingQualification({ index, qualification });
                      setQualificationForm(qualification);
                      setShowQualificationDialog(true);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={() => onRemoveQualification(index)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              )}
            </ListItem>
          ))}
          {user.profile.qualifications.length === 0 && (
            <ListItem>
              <ListItemText
                primary={
                  <Typography variant="body2" color="text.secondary" align="center">
                    {t('profile.noQualifications')}
                  </Typography>
                }
              />
            </ListItem>
          )}
        </List>
      </CardContent>
    </Card>
  );

  const renderPreferences = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('preferences.general')}
            </Typography>
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel>{t('preferences.language')}</InputLabel>
                <Select
                  value={preferencesForm.language}
                  onChange={(e) => {
                    const newPrefs = { ...preferencesForm, language: e.target.value as 'en' | 'km' };
                    setPreferencesForm(newPrefs);
                    onUpdatePreferences(newPrefs);
                  }}
                  label={t('preferences.language')}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="km">ខ្មែរ</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>{t('preferences.theme')}</InputLabel>
                <Select
                  value={preferencesForm.theme}
                  onChange={(e) => {
                    const newPrefs = { ...preferencesForm, theme: e.target.value as any };
                    setPreferencesForm(newPrefs);
                    onUpdatePreferences(newPrefs);
                  }}
                  label={t('preferences.theme')}
                >
                  <MenuItem value="light">{t('preferences.light')}</MenuItem>
                  <MenuItem value="dark">{t('preferences.dark')}</MenuItem>
                  <MenuItem value="auto">{t('preferences.auto')}</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>{t('preferences.timezone')}</InputLabel>
                <Select
                  value={preferencesForm.timezone}
                  onChange={(e) => {
                    const newPrefs = { ...preferencesForm, timezone: e.target.value };
                    setPreferencesForm(newPrefs);
                    onUpdatePreferences(newPrefs);
                  }}
                  label={t('preferences.timezone')}
                >
                  <MenuItem value="Asia/Phnom_Penh">Asia/Phnom_Penh</MenuItem>
                  <MenuItem value="UTC">UTC</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('preferences.notifications')}
            </Typography>
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferencesForm.notifications.email}
                    onChange={(e) => {
                      const newPrefs = {
                        ...preferencesForm,
                        notifications: {
                          ...preferencesForm.notifications,
                          email: e.target.checked,
                        },
                      };
                      setPreferencesForm(newPrefs);
                      onUpdatePreferences(newPrefs);
                    }}
                  />
                }
                label={t('preferences.emailNotifications')}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferencesForm.notifications.push}
                    onChange={(e) => {
                      const newPrefs = {
                        ...preferencesForm,
                        notifications: {
                          ...preferencesForm.notifications,
                          push: e.target.checked,
                        },
                      };
                      setPreferencesForm(newPrefs);
                      onUpdatePreferences(newPrefs);
                    }}
                  />
                }
                label={t('preferences.pushNotifications')}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferencesForm.notifications.sms}
                    onChange={(e) => {
                      const newPrefs = {
                        ...preferencesForm,
                        notifications: {
                          ...preferencesForm.notifications,
                          sms: e.target.checked,
                        },
                      };
                      setPreferencesForm(newPrefs);
                      onUpdatePreferences(newPrefs);
                    }}
                  />
                }
                label={t('preferences.smsNotifications')}
              />

              <Divider />

              <Typography variant="subtitle2">
                {t('preferences.notificationCategories')}
              </Typography>

              {Object.entries(preferencesForm.notifications.categories).map(([category, enabled]) => (
                <FormControlLabel
                  key={category}
                  control={
                    <Switch
                      checked={enabled}
                      onChange={(e) => {
                        const newPrefs = {
                          ...preferencesForm,
                          notifications: {
                            ...preferencesForm.notifications,
                            categories: {
                              ...preferencesForm.notifications.categories,
                              [category]: e.target.checked,
                            },
                          },
                        };
                        setPreferencesForm(newPrefs);
                        onUpdatePreferences(newPrefs);
                      }}
                    />
                  }
                  label={t(`preferences.${category}`)}
                />
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('preferences.privacy')}
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('preferences.profileVisibility')}</InputLabel>
                  <Select
                    value={preferencesForm.privacy.profileVisibility}
                    onChange={(e) => {
                      const newPrefs = {
                        ...preferencesForm,
                        privacy: {
                          ...preferencesForm.privacy,
                          profileVisibility: e.target.value as any,
                        },
                      };
                      setPreferencesForm(newPrefs);
                      onUpdatePreferences(newPrefs);
                    }}
                    label={t('preferences.profileVisibility')}
                  >
                    <MenuItem value="public">{t('preferences.public')}</MenuItem>
                    <MenuItem value="colleagues">{t('preferences.colleagues')}</MenuItem>
                    <MenuItem value="private">{t('preferences.private')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  {[
                    'showEmail',
                    'showPhone',
                    'showLocation',
                    'allowDirectMessages',
                    'dataSharing',
                    'analytics',
                  ].map((setting) => (
                    <FormControlLabel
                      key={setting}
                      control={
                        <Switch
                          checked={preferencesForm.privacy[setting as keyof typeof preferencesForm.privacy] as boolean}
                          onChange={(e) => {
                            const newPrefs = {
                              ...preferencesForm,
                              privacy: {
                                ...preferencesForm.privacy,
                                [setting]: e.target.checked,
                              },
                            };
                            setPreferencesForm(newPrefs);
                            onUpdatePreferences(newPrefs);
                          }}
                        />
                      }
                      label={t(`preferences.${setting}`)}
                    />
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderSecurity = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('security.password')}
            </Typography>
            <Stack spacing={3}>
              <Alert severity="info">
                {t('security.passwordInfo')}
              </Alert>
              <Button
                variant="outlined"
                startIcon={<SecurityIcon />}
                onClick={() => setShowPasswordDialog(true)}
                disabled={!isOwnProfile}
              >
                {t('security.changePassword')}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('security.accountInfo')}
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('profile.memberSince')}
                </Typography>
                <Typography variant="body1">
                  {format(new Date(user.createdAt), 'PPP')}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('profile.lastLogin')}
                </Typography>
                <Typography variant="body1">
                  {user.lastLogin 
                    ? format(new Date(user.lastLogin), 'PPp')
                    : t('users.neverLoggedIn')
                  }
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('profile.emailVerified')}
                </Typography>
                <Chip
                  label={user.isVerified ? t('common.yes') : t('common.no')}
                  color={user.isVerified ? 'success' : 'warning'}
                  size="small"
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {canViewSessions && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('security.activeSessions')}
              </Typography>
              <List>
                {user.sessions.map((session) => {
                  const status = getSessionStatus(session);
                  return (
                    <ListItem key={session.id}>
                      <ListItemIcon>
                        <Chip
                          label={status.label}
                          color={status.color as any}
                          size="small"
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2">
                              {session.deviceInfo.browser} on {session.deviceInfo.os}
                            </Typography>
                            {session.location && (
                              <Typography variant="caption" color="text.secondary">
                                • {session.location.city}, {session.location.country}
                              </Typography>
                            )}
                          </Stack>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {t('security.started')}: {format(new Date(session.startTime), 'PPp')} • 
                            {t('security.lastActivity')}: {format(new Date(session.lastActivity), 'PPp')}
                          </Typography>
                        }
                      />
                      {session.isActive && (
                        <ListItemSecondaryAction>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => onTerminateSession(session.id)}
                          >
                            {t('security.terminate')}
                          </Button>
                        </ListItemSecondaryAction>
                      )}
                    </ListItem>
                  );
                })}
              </List>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Tabs */}
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab icon={<PersonIcon />} label={t('profile.profile')} />
            <Tab icon={<CertificateIcon />} label={t('profile.qualifications')} />
            <Tab icon={<SettingsIcon />} label={t('profile.preferences')} />
            <Tab icon={<SecurityIcon />} label={t('profile.security')} />
          </Tabs>

          {/* Tab Panels */}
          <TabPanel value={tabValue} index={0}>
            {renderBasicInfo()}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {renderQualifications()}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {renderPreferences()}
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            {renderSecurity()}
          </TabPanel>
        </Stack>
      </Paper>

      {/* Password Dialog */}
      <Dialog
        open={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('security.changePassword')}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              type="password"
              label={t('security.currentPassword')}
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              required
            />
            <TextField
              fullWidth
              type="password"
              label={t('security.newPassword')}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              required
            />
            <TextField
              fullWidth
              type="password"
              label={t('security.confirmPassword')}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              error={passwordForm.newPassword !== passwordForm.confirmPassword && passwordForm.confirmPassword !== ''}
              helperText={
                passwordForm.newPassword !== passwordForm.confirmPassword && passwordForm.confirmPassword !== ''
                  ? t('security.passwordMismatch')
                  : undefined
              }
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPasswordDialog(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleChangePassword}
            disabled={
              !passwordForm.currentPassword ||
              !passwordForm.newPassword ||
              passwordForm.newPassword !== passwordForm.confirmPassword
            }
          >
            {t('security.changePassword')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Qualification Dialog */}
      <Dialog
        open={showQualificationDialog}
        onClose={() => {
          setShowQualificationDialog(false);
          setEditingQualification(null);
          setQualificationForm({
            type: 'degree',
            title: '',
            institution: '',
            year: new Date().getFullYear(),
            documents: [],
          });
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingQualification ? t('profile.editQualification') : t('profile.addQualification')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>{t('profile.qualificationType')}</InputLabel>
              <Select
                value={qualificationForm.type}
                onChange={(e) => setQualificationForm({ ...qualificationForm, type: e.target.value as any })}
                label={t('profile.qualificationType')}
              >
                <MenuItem value="degree">{t('profile.qualificationType.degree')}</MenuItem>
                <MenuItem value="certificate">{t('profile.qualificationType.certificate')}</MenuItem>
                <MenuItem value="training">{t('profile.qualificationType.training')}</MenuItem>
                <MenuItem value="other">{t('profile.qualificationType.other')}</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label={t('profile.qualificationTitle')}
              value={qualificationForm.title}
              onChange={(e) => setQualificationForm({ ...qualificationForm, title: e.target.value })}
              required
            />

            <TextField
              fullWidth
              label={t('profile.institution')}
              value={qualificationForm.institution}
              onChange={(e) => setQualificationForm({ ...qualificationForm, institution: e.target.value })}
              required
            />

            <TextField
              fullWidth
              type="number"
              label={t('profile.year')}
              value={qualificationForm.year}
              onChange={(e) => setQualificationForm({ ...qualificationForm, year: parseInt(e.target.value) })}
              inputProps={{ min: 1950, max: new Date().getFullYear() }}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowQualificationDialog(false);
              setEditingQualification(null);
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={editingQualification ? () => onUpdateQualification(editingQualification.index, qualificationForm as Qualification) : handleAddQualification}
            disabled={!qualificationForm.title || !qualificationForm.institution}
          >
            {editingQualification ? t('common.update') : t('common.add')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserProfileManager;