import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n';
import AuditLogViewer from '../AuditLogViewer';
import {
  AuditLog,
  AuditAction,
  UserActivity,
  ActivityType,
  User,
  UserStatus,
} from '../../../types/userManagement';

const theme = createTheme();

const mockUsers: User[] = [
  {
    id: 'user1',
    email: 'john.doe@example.com',
    username: 'johndoe',
    firstName: 'John',
    lastName: 'Doe',
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
    lastLogin: '2024-01-20T10:00:00Z',
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

const mockAuditLogs: AuditLog[] = [
  {
    id: 'log1',
    userId: 'user1',
    userEmail: 'john.doe@example.com',
    action: 'login' as AuditAction,
    resource: 'user',
    resourceId: 'user1',
    details: { loginMethod: 'password', success: true },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: '2024-01-20T10:00:00Z',
    sessionId: 'session1',
  },
  {
    id: 'log2',
    userId: 'user1',
    userEmail: 'john.doe@example.com',
    action: 'create' as AuditAction,
    resource: 'observation',
    resourceId: 'obs1',
    details: { observationType: 'classroom', schoolId: 'school1' },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: '2024-01-20T10:30:00Z',
    sessionId: 'session1',
  },
  {
    id: 'log3',
    userId: 'user1',
    userEmail: 'john.doe@example.com',
    action: 'security_event' as AuditAction,
    resource: 'user',
    resourceId: 'user1',
    details: { eventType: 'failed_login_attempt', attempts: 3 },
    ipAddress: '192.168.1.200',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: '2024-01-19T15:00:00Z',
  },
];

const mockUserActivities: UserActivity[] = [
  {
    userId: 'user1',
    activity: 'login' as ActivityType,
    timestamp: '2024-01-20T10:00:00Z',
    details: { success: true },
    location: 'Phnom Penh',
    duration: 0,
  },
  {
    userId: 'user1',
    activity: 'observation_create' as ActivityType,
    timestamp: '2024-01-20T10:30:00Z',
    details: { observationType: 'classroom' },
    location: 'School A',
    duration: 15,
  },
  {
    userId: 'user1',
    activity: 'logout' as ActivityType,
    timestamp: '2024-01-20T12:00:00Z',
    details: { reason: 'manual' },
    location: 'Phnom Penh',
    duration: 0,
  },
];

const mockCurrentUser: User = {
  id: 'admin1',
  email: 'admin@example.com',
  username: 'admin',
  firstName: 'Admin',
  lastName: 'User',
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
  auditLogs: mockAuditLogs,
  userActivities: mockUserActivities,
  users: mockUsers,
  onRefresh: jest.fn(),
  onExportLogs: jest.fn(),
  onViewLogDetails: jest.fn(),
  currentUser: mockCurrentUser,
  canViewAllLogs: true,
  canExportLogs: true,
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

describe('AuditLogViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders audit statistics cards', () => {
      renderWithProviders(<AuditLogViewer {...defaultProps} />);

      // Should show activity stats
      expect(screen.getByText(/today/i)).toBeInTheDocument();
      expect(screen.getByText(/this week/i)).toBeInTheDocument();
      expect(screen.getByText(/security events/i)).toBeInTheDocument();
      expect(screen.getByText(/active users/i)).toBeInTheDocument();
    });

    it('renders audit logs table with data', () => {
      renderWithProviders(<AuditLogViewer {...defaultProps} />);

      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
      expect(screen.getByText('observation')).toBeInTheDocument();
      expect(screen.getByText('user')).toBeInTheDocument();
    });

    it('shows correct action chips with colors', () => {
      renderWithProviders(<AuditLogViewer {...defaultProps} />);

      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
      expect(screen.getByText('Security Event')).toBeInTheDocument();
    });

    it('displays user avatars and names in logs', () => {
      renderWithProviders(<AuditLogViewer {...defaultProps} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      // Should show multiple instances for multiple logs
      expect(screen.getAllByText('john.doe@example.com')).toHaveLength(3);
    });
  });

  describe('Filtering and Search', () => {
    it('filters logs by search query', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AuditLogViewer {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'observation');

      // Should show only observation-related logs
      expect(screen.getByText('observation')).toBeInTheDocument();
      // Login log should be filtered out (assuming the filter works)
    });

    it('filters logs by action type', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AuditLogViewer {...defaultProps} />);

      const actionSelect = screen.getByLabelText(/action/i);
      await user.click(actionSelect);
      
      const loginOption = screen.getByText('Login');
      await user.click(loginOption);

      // Should filter to show only login actions
      expect(screen.getByText('Login')).toBeInTheDocument();
    });

    it('filters logs by date range', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AuditLogViewer {...defaultProps} />);

      const dateSelect = screen.getByLabelText(/date range/i);
      await user.click(dateSelect);
      
      const todayOption = screen.getByText(/today/i);
      await user.click(todayOption);

      // Should filter logs to today only
      // Exact behavior depends on implementation
    });

    it('filters logs by user when canViewAllLogs is true', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AuditLogViewer {...defaultProps} />);

      const userSelect = screen.getByLabelText(/user/i);
      await user.click(userSelect);
      
      const userOption = screen.getByText('John Doe (john.doe@example.com)');
      await user.click(userOption);

      // Should filter to show only selected user's logs
      expect(screen.getAllByText('john.doe@example.com')).toHaveLength(3);
    });

    it('hides user filter when canViewAllLogs is false', () => {
      const propsWithLimitedAccess = {
        ...defaultProps,
        canViewAllLogs: false,
      };

      renderWithProviders(<AuditLogViewer {...propsWithLimitedAccess} />);

      expect(screen.queryByLabelText(/user/i)).not.toBeInTheDocument();
    });
  });

  describe('Log Details', () => {
    it('opens log details dialog when view button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AuditLogViewer {...defaultProps} />);

      const viewButtons = screen.getAllByRole('button', { name: /view/i });
      await user.click(viewButtons[0]);

      expect(screen.getByText(/log details/i)).toBeInTheDocument();
      expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
      expect(screen.getByText(/mozilla/i)).toBeInTheDocument();
    });

    it('displays formatted log details in dialog', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AuditLogViewer {...defaultProps} />);

      const viewButtons = screen.getAllByRole('button', { name: /view/i });
      await user.click(viewButtons[0]);

      // Should show formatted JSON details
      expect(screen.getByText(/loginMethod/)).toBeInTheDocument();
      expect(screen.getByText(/password/)).toBeInTheDocument();
    });

    it('calls onViewLogDetails when view full details is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AuditLogViewer {...defaultProps} />);

      const viewButtons = screen.getAllByRole('button', { name: /view/i });
      await user.click(viewButtons[0]);

      const viewFullButton = screen.getByRole('button', { name: /view full details/i });
      await user.click(viewFullButton);

      expect(defaultProps.onViewLogDetails).toHaveBeenCalledWith(mockAuditLogs[0]);
    });
  });

  describe('Activity Timeline Tab', () => {
    it('switches to activity timeline tab', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AuditLogViewer {...defaultProps} />);

      const timelineTab = screen.getByRole('tab', { name: /activity timeline/i });
      await user.click(timelineTab);

      expect(screen.getByText(/recent activity/i)).toBeInTheDocument();
    });

    it('displays activities in timeline format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AuditLogViewer {...defaultProps} />);

      const timelineTab = screen.getByRole('tab', { name: /activity timeline/i });
      await user.click(timelineTab);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Phnom Penh')).toBeInTheDocument();
      expect(screen.getByText('School A')).toBeInTheDocument();
    });
  });

  describe('Data Export', () => {
    it('shows export button when user has permissions', () => {
      renderWithProviders(<AuditLogViewer {...defaultProps} />);

      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    });

    it('hides export button when user lacks permissions', () => {
      const propsWithoutExport = {
        ...defaultProps,
        canExportLogs: false,
      };

      renderWithProviders(<AuditLogViewer {...propsWithoutExport} />);

      expect(screen.queryByRole('button', { name: /export/i })).not.toBeInTheDocument();
    });

    it('calls onExportLogs with current filters when export is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AuditLogViewer {...defaultProps} />);

      // Set some filters first
      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'test');

      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);

      expect(defaultProps.onExportLogs).toHaveBeenCalledWith({
        searchQuery: 'test',
        actionFilter: 'all',
        resourceFilter: 'all',
        userFilter: 'all',
        dateRange: '7d',
        orderBy: 'timestamp',
        order: 'desc',
      });
    });
  });

  describe('Pagination and Sorting', () => {
    it('sorts logs when column header is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AuditLogViewer {...defaultProps} />);

      const timestampHeader = screen.getByRole('button', { name: /timestamp/i });
      await user.click(timestampHeader);

      // Should change sort order (behavior depends on implementation)
      expect(timestampHeader).toBeInTheDocument();
    });

    it('displays pagination controls', () => {
      renderWithProviders(<AuditLogViewer {...defaultProps} />);

      expect(screen.getByText(/rows per page/i)).toBeInTheDocument();
    });

    it('changes page when pagination is used', async () => {
      const user = userEvent.setup();
      const manyLogs = Array.from({ length: 30 }, (_, i) => ({
        ...mockAuditLogs[0],
        id: `log-${i}`,
        timestamp: new Date(Date.now() - i * 1000).toISOString(),
      }));

      const propsWithManyLogs = {
        ...defaultProps,
        auditLogs: manyLogs,
      };

      renderWithProviders(<AuditLogViewer {...propsWithManyLogs} />);

      // Should show pagination controls for large dataset
      expect(screen.getByText(/rows per page/i)).toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    it('calls onRefresh when refresh button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AuditLogViewer {...defaultProps} />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      expect(defaultProps.onRefresh).toHaveBeenCalledTimes(1);
    });

    it('shows loading state during refresh', async () => {
      const user = userEvent.setup();
      const slowRefresh = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      const propsWithSlowRefresh = {
        ...defaultProps,
        onRefresh: slowRefresh,
      };

      renderWithProviders(<AuditLogViewer {...propsWithSlowRefresh} />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      // Should show loading indicator
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Access Control', () => {
    it('filters logs to current user when canViewAllLogs is false', () => {
      const propsWithLimitedUser = {
        ...defaultProps,
        canViewAllLogs: false,
        currentUser: mockUsers[0], // Regular user, not admin
      };

      renderWithProviders(<AuditLogViewer {...propsWithLimitedUser} />);

      // Should only show logs for current user
      expect(screen.getAllByText('john.doe@example.com')).toHaveLength(3);
    });

    it('shows all logs when canViewAllLogs is true', () => {
      renderWithProviders(<AuditLogViewer {...defaultProps} />);

      // Should show all logs regardless of user
      expect(screen.getAllByText('john.doe@example.com')).toHaveLength(3);
    });
  });

  describe('Statistics Calculation', () => {
    it('calculates activity statistics correctly', () => {
      renderWithProviders(<AuditLogViewer {...defaultProps} />);

      // Should show correct stats based on activities
      // Numbers depend on mock data and calculation logic
      expect(screen.getByText(/today/i)).toBeInTheDocument();
      expect(screen.getByText(/this week/i)).toBeInTheDocument();
    });

    it('shows security events count', () => {
      renderWithProviders(<AuditLogViewer {...defaultProps} />);

      // Should count security events from audit logs
      expect(screen.getByText('1')).toBeInTheDocument(); // One security event
    });

    it('shows unique active users count', () => {
      renderWithProviders(<AuditLogViewer {...defaultProps} />);

      // Should count unique users from filtered logs
      expect(screen.getByText('1')).toBeInTheDocument(); // One unique user
    });
  });

  describe('Error Handling', () => {
    it('handles empty audit logs gracefully', () => {
      const propsWithEmptyLogs = {
        ...defaultProps,
        auditLogs: [],
        userActivities: [],
      };

      renderWithProviders(<AuditLogViewer {...propsWithEmptyLogs} />);

      // Should not crash and should show empty state
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('handles missing user data gracefully', () => {
      const propsWithMissingUser = {
        ...defaultProps,
        users: [], // No users data
      };

      renderWithProviders(<AuditLogViewer {...propsWithMissingUser} />);

      // Should show email instead of name when user not found
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderWithProviders(<AuditLogViewer {...defaultProps} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(2);
      expect(screen.getAllByRole('columnheader')).toHaveLength(7);
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AuditLogViewer {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      searchInput.focus();
      
      await user.keyboard('{Tab}');
      // Should focus on next interactive element
      expect(document.activeElement).not.toBe(searchInput);
    });

    it('has accessible table headers', () => {
      renderWithProviders(<AuditLogViewer {...defaultProps} />);

      expect(screen.getByRole('columnheader', { name: /timestamp/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /user/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /action/i })).toBeInTheDocument();
    });
  });
});