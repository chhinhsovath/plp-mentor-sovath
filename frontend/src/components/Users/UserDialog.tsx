import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { User, CreateUserDto, UpdateUserDto, userService } from '../../services/user.service';

interface UserDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  user?: User | null;
  mode: 'create' | 'edit';
}

const UserDialog: React.FC<UserDialogProps> = ({ open, onClose, onSave, user, mode }) => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Array<{ id: string; name: string; displayName: string }>>([]);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    roleId: '',
    status: 'active' as 'active' | 'inactive',
    preferredLanguage: 'en',
    bio: '',
  });

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    if (user && mode === 'edit') {
      setFormData({
        username: user.username,
        email: user.email,
        password: '',
        confirmPassword: '',
        fullName: user.fullName,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
        roleId: user.role.id,
        status: user.status === 'suspended' ? 'inactive' : user.status,
        preferredLanguage: user.preferredLanguage || 'en',
        bio: user.bio || '',
      });
    } else {
      // Reset form for create mode
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        roleId: '',
        status: 'active',
        preferredLanguage: 'en',
        bio: '',
      });
    }
  }, [user, mode]);

  const loadRoles = async () => {
    try {
      const rolesList = await userService.getRoles();
      setRoles(rolesList);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.username && mode === 'create') {
      setError(t('validation.required', { field: t('users.username') }));
      return false;
    }
    if (!formData.email) {
      setError(t('validation.required', { field: t('users.email') }));
      return false;
    }
    if (!formData.fullName) {
      setError(t('validation.required', { field: t('users.fullName') }));
      return false;
    }
    if (!formData.roleId) {
      setError(t('validation.required', { field: t('users.role') }));
      return false;
    }
    if (mode === 'create') {
      if (!formData.password) {
        setError(t('validation.required', { field: t('users.password') }));
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError(t('validation.passwordMismatch'));
        return false;
      }
      if (formData.password.length < 6) {
        setError(t('validation.passwordLength'));
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      if (mode === 'create') {
        const createData: CreateUserDto = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          roleId: formData.roleId,
          status: formData.status,
          preferredLanguage: formData.preferredLanguage,
          bio: formData.bio,
        };
        await userService.createUser(createData);
      } else if (user) {
        const updateData: UpdateUserDto = {
          email: formData.email,
          fullName: formData.fullName,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          roleId: formData.roleId,
          status: formData.status,
          preferredLanguage: formData.preferredLanguage,
          bio: formData.bio,
        };
        await userService.updateUser(user.id, updateData);
      }
      
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || t('errors.operationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === 'create' ? t('users.createUser') : t('users.editUser')}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('users.username')}
                value={formData.username}
                onChange={handleChange('username')}
                disabled={mode === 'edit'}
                required={mode === 'create'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('users.email')}
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                required
              />
            </Grid>
            
            {mode === 'create' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('users.password')}
                    type="password"
                    value={formData.password}
                    onChange={handleChange('password')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('users.confirmPassword')}
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange('confirmPassword')}
                    required
                  />
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('users.fullName')}
                value={formData.fullName}
                onChange={handleChange('fullName')}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('users.firstName')}
                value={formData.firstName}
                onChange={handleChange('firstName')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('users.lastName')}
                value={formData.lastName}
                onChange={handleChange('lastName')}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('users.phoneNumber')}
                value={formData.phoneNumber}
                onChange={handleChange('phoneNumber')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>{t('users.role')}</InputLabel>
                <Select
                  value={formData.roleId}
                  onChange={handleChange('roleId')}
                  label={t('users.role')}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t('users.status')}</InputLabel>
                <Select
                  value={formData.status}
                  onChange={handleChange('status')}
                  label={t('users.status')}
                >
                  <MenuItem value="active">{t('users.statuses.active')}</MenuItem>
                  <MenuItem value="inactive">{t('users.statuses.inactive')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t('users.preferredLanguage')}</InputLabel>
                <Select
                  value={formData.preferredLanguage}
                  onChange={handleChange('preferredLanguage')}
                  label={t('users.preferredLanguage')}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="km">ខ្មែរ</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('users.bio')}
                multiline
                rows={3}
                value={formData.bio}
                onChange={handleChange('bio')}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {mode === 'create' ? t('common.create') : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserDialog;