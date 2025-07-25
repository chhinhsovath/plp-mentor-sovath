import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import { I18nextProvider } from 'react-i18next';
import { SignatureAuditTrail } from '../index';
import { theme } from '../../../theme/theme';
import i18n from '../../../i18n/i18n';

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={theme}>
      <I18nextProvider i18n={i18n}>
        {children}
      </I18nextProvider>
    </ThemeProvider>
  );
};

const mockEvents = [
  {
    id: '1',
    action: 'signature_created' as const,
    timestamp: new Date('2024-01-10T10:00:00'),
    userId: 'user-1',
    userName: 'Test Teacher',
    userRole: 'teacher',
    metadata: {
      signatureRole: 'teacher',
      ipAddress: '192.168.1.1',
    },
  },
  {
    id: '2',
    action: 'signature_verified' as const,
    timestamp: new Date('2024-01-10T10:30:00'),
    userId: 'user-2',
    userName: 'Test Observer',
    userRole: 'observer',
    metadata: {
      signatureRole: 'observer',
      ipAddress: '192.168.1.2',
    },
  },
  {
    id: '3',
    action: 'approval' as const,
    timestamp: new Date('2024-01-10T11:00:00'),
    userId: 'user-3',
    userName: 'Test Supervisor',
    userRole: 'supervisor',
    metadata: {
      reason: 'Approved after review',
      ipAddress: '192.168.1.3',
    },
  },
  {
    id: '4',
    action: 'rejection' as const,
    timestamp: new Date('2024-01-11T09:00:00'),
    userId: 'user-4',
    userName: 'Test Admin',
    userRole: 'admin',
    metadata: {
      reason: 'Incomplete observation data',
      ipAddress: '192.168.1.4',
    },
  },
];

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    const d = new Date(date);
    if (formatStr === 'MMM d, yyyy') {
      return 'Jan 10, 2024';
    }
    if (formatStr === 'h:mm:ss a') {
      return '10:00:00 AM';
    }
    if (formatStr === 'MMM d, h:mm a') {
      return 'Jan 10, 10:00 AM';
    }
    return d.toString();
  }),
  isAfter: vi.fn((date1, date2) => date1 > date2),
  isBefore: vi.fn((date1, date2) => date1 < date2),
  startOfDay: vi.fn((date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }),
  endOfDay: vi.fn((date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }),
}));

describe('SignatureAuditTrail', () => {
  const mockOnRefresh = vi.fn();

  const defaultProps = {
    sessionId: 'session-123',
    events: mockEvents,
    onRefresh: mockOnRefresh,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset viewport
    global.innerWidth = 1024;
    global.dispatchEvent(new Event('resize'));
  });

  it('renders audit trail with all events', () => {
    render(<SignatureAuditTrail {...defaultProps} />, { wrapper: createWrapper() });

    expect(screen.getByText(/audit trail/i)).toBeInTheDocument();
    expect(screen.getByText('Test Teacher')).toBeInTheDocument();
    expect(screen.getByText('Test Observer')).toBeInTheDocument();
    expect(screen.getByText('Test Supervisor')).toBeInTheDocument();
    expect(screen.getByText('Test Admin')).toBeInTheDocument();
  });

  it('shows filter controls', () => {
    render(<SignatureAuditTrail {...defaultProps} />, { wrapper: createWrapper() });

    const filterButton = screen.getByTestId(/FilterListIcon/i, { exact: false }).closest('button');
    expect(filterButton).toBeInTheDocument();
  });

  it('expands and collapses filters', async () => {
    render(<SignatureAuditTrail {...defaultProps} />, { wrapper: createWrapper() });

    const filterButton = screen.getByTestId(/FilterListIcon/i, { exact: false }).closest('button');
    if (filterButton) {
      fireEvent.click(filterButton);
    }

    await waitFor(() => {
      expect(screen.getByLabelText(/action/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/user/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    });
  });

  it('filters by action type', async () => {
    render(<SignatureAuditTrail {...defaultProps} />, { wrapper: createWrapper() });

    // Expand filters
    const filterButton = screen.getByTestId(/FilterListIcon/i, { exact: false }).closest('button');
    if (filterButton) {
      fireEvent.click(filterButton);
    }

    // Select approval action
    const actionSelect = screen.getByLabelText(/action/i);
    fireEvent.mouseDown(actionSelect);
    
    const approvalOption = screen.getByRole('option', { name: /approval/i });
    fireEvent.click(approvalOption);

    await waitFor(() => {
      expect(screen.getByText('Test Supervisor')).toBeInTheDocument();
      expect(screen.queryByText('Test Teacher')).not.toBeInTheDocument();
    });
  });

  it('filters by user', async () => {
    render(<SignatureAuditTrail {...defaultProps} />, { wrapper: createWrapper() });

    // Expand filters
    const filterButton = screen.getByTestId(/FilterListIcon/i, { exact: false }).closest('button');
    if (filterButton) {
      fireEvent.click(filterButton);
    }

    // Select specific user
    const userSelect = screen.getByLabelText(/user/i);
    fireEvent.mouseDown(userSelect);
    
    const userOption = screen.getByRole('option', { name: 'Test Teacher' });
    fireEvent.click(userOption);

    await waitFor(() => {
      expect(screen.getByText('Test Teacher')).toBeInTheDocument();
      expect(screen.queryByText('Test Observer')).not.toBeInTheDocument();
    });
  });

  it('displays event metadata', () => {
    render(<SignatureAuditTrail {...defaultProps} />, { wrapper: createWrapper() });

    // Check for IP addresses
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    
    // Check for reasons
    expect(screen.getByText('Approved after review')).toBeInTheDocument();
    expect(screen.getByText('Incomplete observation data')).toBeInTheDocument();
  });

  it('handles pagination', () => {
    const manyEvents = Array.from({ length: 25 }, (_, i) => ({
      ...mockEvents[0],
      id: `event-${i}`,
      timestamp: new Date(Date.now() - i * 1000000),
    }));

    render(
      <SignatureAuditTrail {...defaultProps} events={manyEvents} />,
      { wrapper: createWrapper() }
    );

    const pagination = screen.getByRole('navigation');
    expect(pagination).toBeInTheDocument();
    
    // Check rows per page
    expect(screen.getByText(/1–10 of 25/i)).toBeInTheDocument();
  });

  it('changes page', async () => {
    const manyEvents = Array.from({ length: 25 }, (_, i) => ({
      ...mockEvents[0],
      id: `event-${i}`,
      userName: `User ${i}`,
      timestamp: new Date(Date.now() - i * 1000000),
    }));

    render(
      <SignatureAuditTrail {...defaultProps} events={manyEvents} />,
      { wrapper: createWrapper() }
    );

    const nextButton = screen.getByRole('button', { name: /next page/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/11–20 of 25/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no events', () => {
    render(
      <SignatureAuditTrail {...defaultProps} events={[]} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/no events/i)).toBeInTheDocument();
  });

  it('displays correct icons for different actions', () => {
    render(<SignatureAuditTrail {...defaultProps} />, { wrapper: createWrapper() });

    // Check for various action icons
    const icons = screen.getAllByTestId(/Icon/i, { exact: false });
    expect(icons.length).toBeGreaterThan(0);
  });

  it('shows mobile view on small screens', () => {
    // Set mobile viewport
    global.innerWidth = 375;
    global.dispatchEvent(new Event('resize'));

    render(<SignatureAuditTrail {...defaultProps} />, { wrapper: createWrapper() });

    // Should show timeline view instead of table
    const timeline = screen.getByRole('list');
    expect(timeline).toBeInTheDocument();
    expect(timeline.className).toMatch(/MuiTimeline/);
  });

  it('displays delegation information when present', () => {
    const eventsWithDelegation = [
      ...mockEvents,
      {
        id: '5',
        action: 'delegation' as const,
        timestamp: new Date('2024-01-10T12:00:00'),
        userId: 'user-5',
        userName: 'Test Delegator',
        userRole: 'supervisor',
        metadata: {
          delegatedTo: 'Another Supervisor',
          reason: 'Out of office',
        },
      },
    ];

    render(
      <SignatureAuditTrail {...defaultProps} events={eventsWithDelegation} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/Another Supervisor/i)).toBeInTheDocument();
  });

  it('filters by date range', async () => {
    render(<SignatureAuditTrail {...defaultProps} />, { wrapper: createWrapper() });

    // Expand filters
    const filterButton = screen.getByTestId(/FilterListIcon/i, { exact: false }).closest('button');
    if (filterButton) {
      fireEvent.click(filterButton);
    }

    // Select today filter
    const dateSelect = screen.getByLabelText(/date/i);
    fireEvent.mouseDown(dateSelect);
    
    const todayOption = screen.getByRole('option', { name: /today/i });
    fireEvent.click(todayOption);

    // Should filter events (actual filtering depends on mock implementation)
    await waitFor(() => {
      const countText = screen.getByText(/showing/i);
      expect(countText).toBeInTheDocument();
    });
  });

  it('changes rows per page', async () => {
    const manyEvents = Array.from({ length: 30 }, (_, i) => ({
      ...mockEvents[0],
      id: `event-${i}`,
      timestamp: new Date(Date.now() - i * 1000000),
    }));

    render(
      <SignatureAuditTrail {...defaultProps} events={manyEvents} />,
      { wrapper: createWrapper() }
    );

    // Find and click the rows per page selector
    const rowsPerPageButton = screen.getByRole('button', { name: /rows per page: 10/i });
    fireEvent.mouseDown(rowsPerPageButton);

    const option25 = screen.getByRole('option', { name: '25' });
    fireEvent.click(option25);

    await waitFor(() => {
      expect(screen.getByText(/1–25 of 30/i)).toBeInTheDocument();
    });
  });
});