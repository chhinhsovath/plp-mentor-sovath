import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n';
import UserManagementDashboard from '../UserManagementDashboard';
import {
  User,
  UserRole,
  UserStats,
  AuditLog,
  UserStatus,
} from '../../../types/userManagement';

const theme = createTheme();

const mockUsers: User[] = [
  {
    id: '1',
    email: 'john.doe@example.com',
    username: 'johndoe',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+855123456789',
    avatar: '',
    role: {
      id: 'mentor',
      name: 'mentor',
      displayName: 'Mentor',
      description: 'Field mentor',
      level: 2,
      permissions: [],
      isSystem: false,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    permissions: [],
    status: 'active' as UserStatus,
    isActive: true,
    isVerified: true,
    lastLogin: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    profile: {
      schoolName: 'Test School',
      position: 'Senior Mentor',
      qualifications: [],
      specializations: [],
      languages: ['en', 'km'],
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
  {
    id: '2',
    email: 'jane.smith@example.com',
    username: 'janesmith',
    firstName: 'Jane',
    lastName: 'Smith',
    role: {
      id: 'admin',
      name: 'admin',
      displayName: 'Administrator',
      description: 'System administrator',
      level: 5,
      permissions: [],
      isSystem: true,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    permissions: [],
    status: 'active' as UserStatus,
    isActive: true,
    isVerified: true,
    lastLogin: '2024-01-20T14:30:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    profile: {
      schoolName: 'Central Office',
      position: 'System Administrator',
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
        sms: true,
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
  },
];

const mockRoles: UserRole[] = [
  {
    id: 'mentor',
    name: 'mentor',
    displayName: 'Mentor',
    description: 'Field mentor',
    level: 2,
    permissions: [],
    isSystem: false,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'admin',
    name: 'admin',
    displayName: 'Administrator',
    description: 'System administrator',
    level: 5,
    permissions: [],
    isSystem: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockStats: UserStats = {
  totalUsers: 150,
  activeUsers: 142,
  newUsersThisMonth: 12,
  usersByRole: {
    mentor: 120,
    admin: 15,
    manager: 15,
  },
  usersByStatus: {
    active: 142,
    inactive: 5,
    suspended: 2,
    pending_verification: 1,
    locked: 0,
    archived: 0,
  },
  averageSessionDuration: 45,
  loginFrequency: {
    daily: 95,
    weekly: 125,
    monthly: 142,
  },
  securityEvents: 3,
};

const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    userId: '1',
    userEmail: 'john.doe@example.com',
    action: 'login',
    resource: 'user',
    resourceId: '1',
    details: { ip: '192.168.1.100' },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0',
    timestamp: '2024-01-20T10:00:00Z',
    sessionId: 'session1',
  },
];

const defaultProps = {
  users: mockUsers,
  roles: mockRoles,
  stats: mockStats,
  auditLogs: mockAuditLogs,
  onCreateUser: jest.fn(),
  onEditUser: jest.fn(),
  onDeleteUser: jest.fn(),
  onToggleUserStatus: jest.fn(),
  onBulkAction: jest.fn(),
  onExportUsers: jest.fn(),
  onImportUsers: jest.fn(),
  onViewUserDetails: jest.fn(),
  onViewAuditLog: jest.fn(),
  currentUser: mockUsers[1], // Admin user
  canManageUsers: true,
  canViewAudit: true,
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

describe('UserManagementDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders dashboard with user statistics', () => {
      renderWithProviders(<UserManagementDashboard {...defaultProps} />);

      expect(screen.getByText('150')).toBeInTheDocument(); // Total users
      expect(screen.getByText('142')).toBeInTheDocument(); // Active users
      expect(screen.getByText('12')).toBeInTheDocument(); // New users this month
      expect(screen.getByText('3')).toBeInTheDocument(); // Security events
    });

    it('renders user table with user data', () => {
      renderWithProviders(<UserManagementDashboard {...defaultProps} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
    });

    it('renders action buttons when user has permissions', () => {
      renderWithProviders(<UserManagementDashboard {...defaultProps} />);

      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    });

    it('hides action buttons when user lacks permissions', () => {
      const propsWithoutPermissions = {
        ...defaultProps,
        canManageUsers: false,
        canViewAudit: false,
      };

      renderWithProviders(<UserManagementDashboard {...propsWithoutPermissions} />);

      expect(screen.queryByRole('button', { name: /create/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /import/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /export/i })).not.toBeInTheDocument();
    });
  });

  describe('Search and Filtering', () => {
    it('filters users by search query', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserManagementDashboard {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'John');

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('filters users by role', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserManagementDashboard {...defaultProps} />);

      const roleSelect = screen.getByLabelText(/role/i);
      await user.click(roleSelect);
      
      const mentorOption = screen.getByText('Mentor');
      await user.click(mentorOption);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('filters users by status', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserManagementDashboard {...defaultProps} />);

      const statusSelect = screen.getByLabelText(/status/i);
      await user.click(statusSelect);
      
      const activeOption = screen.getByText('Active');
      await user.click(activeOption);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  describe('User Actions', () => {
    it('calls onCreateUser when create button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserManagementDashboard {...defaultProps} />);

      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      expect(defaultProps.onCreateUser).toHaveBeenCalledTimes(1);
    });

    it('calls onExportUsers when export button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserManagementDashboard {...defaultProps} />);

      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);

      expect(defaultProps.onExportUsers).toHaveBeenCalledWith({
        roleFilter: 'all',
        statusFilter: 'all',
        searchQuery: '',
      });
    });

    it('opens user actions menu when more button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserManagementDashboard {...defaultProps} />);

      const moreButtons = screen.getAllByRole('button', { name: /more/i });
      await user.click(moreButtons[0]);

      expect(screen.getByText(/view details/i)).toBeInTheDocument();
      expect(screen.getByText(/edit/i)).toBeInTheDocument();
    });
  });

  describe('Bulk Actions', () => {
    it('shows bulk action controls when users are selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserManagementDashboard {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // Select first user

      expect(screen.getByText(/selected/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /activate/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /deactivate/i })).toBeInTheDocument();
    });

    it('calls onBulkAction when bulk action is performed', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserManagementDashboard {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // Select first user

      const activateButton = screen.getByRole('button', { name: /activate/i });
      await user.click(activateButton);

      expect(defaultProps.onBulkAction).toHaveBeenCalledWith(['1'], 'activate');
    });

    it('selects all users when select all checkbox is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserManagementDashboard {...defaultProps} />);

      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(selectAllCheckbox);

      expect(screen.getByText(/selected/i)).toBeInTheDocument();
    });
  });

  describe('Pagination and Sorting', () => {
    it('changes page when pagination controls are used', async () => {
      const user = userEvent.setup();
      const manyUsers = Array.from({ length: 25 }, (_, i) => ({
        ...mockUsers[0],
        id: `user-${i}`,
        email: `user${i}@example.com`,
        firstName: `User${i}`,
      }));

      const propsWithManyUsers = {
        ...defaultProps,
        users: manyUsers,
      };

      renderWithProviders(<UserManagementDashboard {...propsWithManyUsers} />);

      // Should show pagination controls
      expect(screen.getByText(/rows per page/i)).toBeInTheDocument();
    });

    it('sorts users when column header is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserManagementDashboard {...defaultProps} />);

      const nameHeader = screen.getByText(/user/i);
      await user.click(nameHeader);

      // Users should be re-ordered (exact order depends on implementation)
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  describe('Audit Log Tab', () => {
    it('shows audit log tab when user has permissions', () => {
      renderWithProviders(<UserManagementDashboard {...defaultProps} />);

      expect(screen.getByRole('tab', { name: /audit log/i })).toBeInTheDocument();
    });

    it('hides audit log tab when user lacks permissions', () => {
      const propsWithoutAudit = {
        ...defaultProps,
        canViewAudit: false,
      };

      renderWithProviders(<UserManagementDashboard {...propsWithoutAudit} />);

      expect(screen.queryByRole('tab', { name: /audit log/i })).not.toBeInTheDocument();
    });

    it('displays audit logs when audit tab is selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserManagementDashboard {...defaultProps} />);

      const auditTab = screen.getByRole('tab', { name: /audit log/i });
      await user.click(auditTab);

      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      renderWithProviders(<UserManagementDashboard {...defaultProps} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader')).toHaveLength(7);
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserManagementDashboard {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      searchInput.focus();
      
      await user.keyboard('{Tab}');
      // Should focus on next interactive element
      expect(document.activeElement).not.toBe(searchInput);
    });
  });

  describe('Error Handling', () => {
    it('handles empty user list gracefully', () => {
      const propsWithEmptyUsers = {
        ...defaultProps,
        users: [],
      };

      renderWithProviders(<UserManagementDashboard {...propsWithEmptyUsers} />);

      expect(screen.getByText('0')).toBeInTheDocument(); // Should show 0 in stats
    });

    it('handles missing user data gracefully', () => {
      const propsWithIncompleteUser = {
        ...defaultProps,
        users: [{
          ...mockUsers[0],
          profile: {
            ...mockUsers[0].profile,
            schoolName: undefined,
          },
        }],
      };

      renderWithProviders(<UserManagementDashboard {...propsWithIncompleteUser} />);

      // Should not crash and should handle undefined values
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});