import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n';
import RolePermissionManager from '../RolePermissionManager';
import {
  UserRole,
  Permission,
  PermissionAction,
  PermissionScope,
  User,
  UserStatus,
} from '../../../types/userManagement';

const theme = createTheme();

const mockPermissions: Permission[] = [
  {
    id: 'perm1',
    resource: 'users',
    action: 'read' as PermissionAction,
    scope: 'school' as PermissionScope,
    description: 'View users in same school',
  },
  {
    id: 'perm2',
    resource: 'users',
    action: 'create' as PermissionAction,
    scope: 'school' as PermissionScope,
    description: 'Create users in same school',
  },
  {
    id: 'perm3',
    resource: 'observations',
    action: 'manage' as PermissionAction,
    scope: 'national' as PermissionScope,
    description: 'Manage all observations',
  },
];

const mockRoles: UserRole[] = [
  {
    id: 'role1',
    name: 'mentor',
    displayName: 'Field Mentor',
    displayNameKh: 'គ្រូបណ្តុះបណ្តាល',
    description: 'Basic field mentor role',
    descriptionKh: 'តួនាទីគ្រូបណ្តុះបណ្តាលចាំបាច់',
    level: 2,
    permissions: [mockPermissions[0]],
    isSystem: false,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'role2',
    name: 'admin',
    displayName: 'Administrator',
    description: 'System administrator',
    level: 5,
    permissions: mockPermissions,
    isSystem: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockUsers: User[] = [
  {
    id: 'user1',
    email: 'mentor@example.com',
    username: 'mentor1',
    firstName: 'John',
    lastName: 'Mentor',
    role: mockRoles[0],
    permissions: [],
    status: 'active' as UserStatus,
    isActive: true,
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    profile: {
      qualifications: [],
      specializations: [],
      languages: ['en'],
    },
    preferences: {
      language: 'en' as const,
      timezone: 'Asia/Phnom_Penh',
      dateFormat: 'PPP',
      notifications: {
        email: true,
        push: true,
        sms: false,
        categories: {
          observations: true,
          plans: true,
          feedback: true,
          reports: true,
          system: true,
          reminders: true,
        },
        frequency: 'immediate' as const,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '07:00',
        },
      },
      theme: 'light' as const,
      accessibility: {
        fontSize: 'medium' as const,
        highContrast: false,
        reduceMotion: false,
        screenReader: false,
        keyboardNavigation: false,
      },
      privacy: {
        profileVisibility: 'colleagues' as const,
        showEmail: true,
        showPhone: false,
        showLocation: true,
        allowDirectMessages: true,
        dataSharing: false,
        analytics: true,
      },
    },
    sessions: [],
  },
];

const mockCurrentUser: User = {
  id: 'admin1',
  email: 'admin@example.com',
  username: 'admin',
  firstName: 'Admin',
  lastName: 'User',
  role: mockRoles[1],
  permissions: mockPermissions,
  status: 'active' as UserStatus,
  isActive: true,
  isVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  profile: {
    qualifications: [],
    specializations: [],
    languages: ['en'],
  },
  preferences: {
    language: 'en' as const,
    timezone: 'Asia/Phnom_Penh',
    dateFormat: 'PPP',
    notifications: {
      email: true,
      push: true,
      sms: false,
      categories: {
        observations: true,
        plans: true,
        feedback: true,
        reports: true,
        system: true,
        reminders: true,
      },
      frequency: 'immediate' as const,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00',
      },
    },
    theme: 'light' as const,
    accessibility: {
      fontSize: 'medium' as const,
      highContrast: false,
      reduceMotion: false,
      screenReader: false,
      keyboardNavigation: false,
    },
    privacy: {
      profileVisibility: 'public' as const,
      showEmail: true,
      showPhone: true,
      showLocation: true,
      allowDirectMessages: true,
      dataSharing: true,
      analytics: true,
    },
  },
  sessions: [],
};

const defaultProps = {
  roles: mockRoles,
  permissions: mockPermissions,
  users: mockUsers,
  onCreateRole: jest.fn(),
  onUpdateRole: jest.fn(),
  onDeleteRole: jest.fn(),
  onCreatePermission: jest.fn(),
  onUpdatePermission: jest.fn(),
  onDeletePermission: jest.fn(),
  onAssignRoleToUsers: jest.fn(),
  currentUser: mockCurrentUser,
  canManageRoles: true,
  canManagePermissions: true,
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <I18nextProvider i18n={i18n}>
        {component}
      </I18nextProvider>
    </ThemeProvider>
  );
};

describe('RolePermissionManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders roles tab by default', () => {
      renderWithProviders(<RolePermissionManager {...defaultProps} />);

      expect(screen.getByText('Field Mentor')).toBeInTheDocument();
      expect(screen.getByText('Administrator')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /roles/i })).toHaveAttribute('aria-pressed', 'true');
    });

    it('renders permissions tab when selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RolePermissionManager {...defaultProps} />);

      const permissionsTab = screen.getByRole('button', { name: /permissions/i });
      await user.click(permissionsTab);

      expect(screen.getByText('View users in same school')).toBeInTheDocument();
      expect(screen.getByText('Manage all observations')).toBeInTheDocument();
    });

    it('shows role cards with correct information', () => {
      renderWithProviders(<RolePermissionManager {...defaultProps} />);

      // Check mentor role
      expect(screen.getByText('Field Mentor')).toBeInTheDocument();
      expect(screen.getByText('Basic field mentor role')).toBeInTheDocument();
      expect(screen.getByText(/Level: 2/)).toBeInTheDocument();
      expect(screen.getByText(/Permissions: 1/)).toBeInTheDocument();

      // Check admin role
      expect(screen.getByText('Administrator')).toBeInTheDocument();
      expect(screen.getByText('System administrator')).toBeInTheDocument();
      expect(screen.getByText(/Level: 5/)).toBeInTheDocument();
      expect(screen.getByText(/Permissions: 3/)).toBeInTheDocument();
    });

    it('shows system role indicator', () => {
      renderWithProviders(<RolePermissionManager {...defaultProps} />);

      expect(screen.getByText('System')).toBeInTheDocument();
    });
  });

  describe('Role Management', () => {
    it('opens create role dialog when create button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RolePermissionManager {...defaultProps} />);

      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      expect(screen.getByText(/create role/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    });

    it('opens edit role dialog when edit button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RolePermissionManager {...defaultProps} />);

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      expect(screen.getByText(/edit role/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('mentor')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Field Mentor')).toBeInTheDocument();
    });

    it('creates a new role when form is submitted', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RolePermissionManager {...defaultProps} />);

      // Open create dialog
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      // Fill form
      await user.type(screen.getByLabelText(/^name/i), 'supervisor');
      await user.type(screen.getByLabelText(/display name/i), 'Supervisor');
      await user.type(screen.getByLabelText(/description/i), 'School supervisor');
      await user.clear(screen.getByLabelText(/level/i));
      await user.type(screen.getByLabelText(/level/i), '3');

      // Submit
      const submitButton = screen.getByRole('button', { name: /create$/i });
      await user.click(submitButton);

      expect(defaultProps.onCreateRole).toHaveBeenCalledWith({
        name: 'supervisor',
        displayName: 'Supervisor',
        displayNameKh: '',
        description: 'School supervisor',
        descriptionKh: '',
        level: 3,
        permissions: [],
        isSystem: false,
        isActive: true,
      });
    });

    it('updates role when edit form is submitted', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RolePermissionManager {...defaultProps} />);

      // Open edit dialog
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      // Modify form
      const displayNameInput = screen.getByDisplayValue('Field Mentor');
      await user.clear(displayNameInput);
      await user.type(displayNameInput, 'Senior Mentor');

      // Submit
      const updateButton = screen.getByRole('button', { name: /update/i });
      await user.click(updateButton);

      expect(defaultProps.onUpdateRole).toHaveBeenCalledWith('role1', expect.objectContaining({
        displayName: 'Senior Mentor',
      }));
    });

    it('deletes role when delete button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RolePermissionManager {...defaultProps} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(defaultProps.onDeleteRole).toHaveBeenCalledWith('role1');
    });

    it('opens assign role dialog when assign button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RolePermissionManager {...defaultProps} />);

      const assignButtons = screen.getAllByRole('button', { name: /assign/i });
      await user.click(assignButtons[0]);

      expect(screen.getByText(/assign to users/i)).toBeInTheDocument();
      expect(screen.getByText('John Mentor')).toBeInTheDocument();
    });
  });

  describe('Permission Management', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      renderWithProviders(<RolePermissionManager {...defaultProps} />);
      
      const permissionsTab = screen.getByRole('button', { name: /permissions/i });
      await user.click(permissionsTab);
    });

    it('displays permission table with correct data', () => {
      expect(screen.getByText('users')).toBeInTheDocument();
      expect(screen.getByText('observations')).toBeInTheDocument();
      expect(screen.getByText('read')).toBeInTheDocument();
      expect(screen.getByText('manage')).toBeInTheDocument();
    });

    it('opens create permission dialog when create button is clicked', async () => {
      const user = userEvent.setup();
      
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      expect(screen.getByText(/create permission/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/resource/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/action/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/scope/i)).toBeInTheDocument();
    });

    it('creates new permission when form is submitted', async () => {
      const user = userEvent.setup();
      
      // Open create dialog
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      // Fill form
      await user.click(screen.getByLabelText(/resource/i));
      await user.click(screen.getByText('reports'));

      await user.click(screen.getByLabelText(/action/i));
      await user.click(screen.getByText('export'));

      await user.click(screen.getByLabelText(/scope/i));
      await user.click(screen.getByText('Own'));

      await user.type(screen.getByLabelText(/^description/i), 'Export own reports');

      // Submit
      const submitButton = screen.getByRole('button', { name: /create$/i });
      await user.click(submitButton);

      expect(defaultProps.onCreatePermission).toHaveBeenCalledWith({
        resource: 'reports',
        action: 'export',
        scope: 'own',
        description: 'Export own reports',
        descriptionKh: '',
        conditions: [],
      });
    });

    it('opens edit permission dialog when edit button is clicked', async () => {
      const user = userEvent.setup();
      
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      expect(screen.getByText(/edit permission/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('users')).toBeInTheDocument();
    });

    it('deletes permission when delete button is clicked', async () => {
      const user = userEvent.setup();
      
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(defaultProps.onDeletePermission).toHaveBeenCalledWith('perm1');
    });
  });

  describe('Permission Assignment', () => {
    it('shows permissions in role creation dialog', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RolePermissionManager {...defaultProps} />);

      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      // Should show permission checkboxes
      expect(screen.getByText('users - read')).toBeInTheDocument();
      expect(screen.getByText('users - create')).toBeInTheDocument();
      expect(screen.getByText('observations - manage')).toBeInTheDocument();
    });

    it('allows selecting permissions for role', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RolePermissionManager {...defaultProps} />);

      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      // Fill basic role info
      await user.type(screen.getByLabelText(/^name/i), 'test-role');
      await user.type(screen.getByLabelText(/display name/i), 'Test Role');

      // Select permissions
      const permissionCheckboxes = screen.getAllByRole('checkbox');
      await user.click(permissionCheckboxes[1]); // First permission checkbox
      await user.click(permissionCheckboxes[2]); // Second permission checkbox

      const submitButton = screen.getByRole('button', { name: /create$/i });
      await user.click(submitButton);

      expect(defaultProps.onCreateRole).toHaveBeenCalledWith(
        expect.objectContaining({
          permissions: expect.arrayContaining([
            expect.objectContaining({ id: 'perm1' }),
            expect.objectContaining({ id: 'perm2' }),
          ]),
        })
      );
    });
  });

  describe('User Assignment', () => {
    it('shows available users for role assignment', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RolePermissionManager {...defaultProps} />);

      const assignButtons = screen.getAllByRole('button', { name: /assign/i });
      await user.click(assignButtons[0]);

      expect(screen.getByText('John Mentor')).toBeInTheDocument();
      expect(screen.getByText('mentor@example.com')).toBeInTheDocument();
    });

    it('assigns role to selected users', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RolePermissionManager {...defaultProps} />);

      const assignButtons = screen.getAllByRole('button', { name: /assign/i });
      await user.click(assignButtons[0]);

      // Select user
      const userCheckbox = screen.getByRole('checkbox');
      await user.click(userCheckbox);

      // Assign
      const assignButton = screen.getByRole('button', { name: /assign$/i });
      await user.click(assignButton);

      expect(defaultProps.onAssignRoleToUsers).toHaveBeenCalledWith('role1', ['user1']);
    });
  });

  describe('Permissions and Access Control', () => {
    it('hides management buttons when user lacks permissions', () => {
      const propsWithoutPermissions = {
        ...defaultProps,
        canManageRoles: false,
        canManagePermissions: false,
      };

      renderWithProviders(<RolePermissionManager {...propsWithoutPermissions} />);

      expect(screen.queryByRole('button', { name: /create/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });

    it('disables edit button for system roles without system permissions', () => {
      const propsWithLimitedPermissions = {
        ...defaultProps,
        currentUser: {
          ...mockCurrentUser,
          permissions: mockCurrentUser.permissions.filter(p => p.resource !== 'system'),
        },
      };

      renderWithProviders(<RolePermissionManager {...propsWithLimitedPermissions} />);

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      // System role edit button should be disabled
      expect(editButtons[1]).toBeDisabled();
    });

    it('hides delete button for system roles', () => {
      renderWithProviders(<RolePermissionManager {...defaultProps} />);

      const roleCards = screen.getAllByTestId(/role-card/i);
      
      // Non-system role should have delete button
      expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(1);
    });
  });

  describe('Role Details and Expansion', () => {
    it('expands role to show permissions when clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RolePermissionManager {...defaultProps} />);

      const expandButton = screen.getAllByRole('button', { name: /view permissions/i })[0];
      await user.click(expandButton);

      expect(screen.getByText('read')).toBeInTheDocument();
      expect(screen.getByText('users')).toBeInTheDocument();
    });

    it('shows user count badge on roles', () => {
      renderWithProviders(<RolePermissionManager {...defaultProps} />);

      // Should show user count for mentor role
      expect(screen.getByText('1')).toBeInTheDocument(); // Badge count
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderWithProviders(<RolePermissionManager {...defaultProps} />);

      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(2);
      expect(screen.getByRole('button', { name: /roles/i })).toHaveAttribute('aria-pressed');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RolePermissionManager {...defaultProps} />);

      const rolesTab = screen.getByRole('button', { name: /roles/i });
      rolesTab.focus();
      
      await user.keyboard('{Tab}');
      // Should focus on permissions tab
      expect(screen.getByRole('button', { name: /permissions/i })).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('handles empty roles list', () => {
      const propsWithEmptyRoles = {
        ...defaultProps,
        roles: [],
      };

      renderWithProviders(<RolePermissionManager {...propsWithEmptyRoles} />);

      // Should not crash and should show no roles
      expect(screen.queryByText('Field Mentor')).not.toBeInTheDocument();
    });

    it('handles empty permissions list', async () => {
      const user = userEvent.setup();
      const propsWithEmptyPermissions = {
        ...defaultProps,
        permissions: [],
      };

      renderWithProviders(<RolePermissionManager {...propsWithEmptyPermissions} />);

      const permissionsTab = screen.getByRole('button', { name: /permissions/i });
      await user.click(permissionsTab);

      // Should not crash and should show empty table
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });
});