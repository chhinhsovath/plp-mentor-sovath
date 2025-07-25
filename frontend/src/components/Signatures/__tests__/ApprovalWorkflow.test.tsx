import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import { I18nextProvider } from 'react-i18next';
import { ApprovalWorkflow } from '../index';
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

const mockApprovers = [
  {
    id: '1',
    role: 'teacher',
    name: 'Test Teacher',
    email: 'teacher@example.com',
    status: 'signed' as const,
    signedAt: new Date('2024-01-10T10:00:00'),
    signatureId: 'sig-1',
  },
  {
    id: '2',
    role: 'observer',
    name: 'Test Observer',
    email: 'observer@example.com',
    status: 'pending' as const,
  },
  {
    id: '3',
    role: 'supervisor',
    name: 'Test Supervisor',
    email: 'supervisor@example.com',
    status: 'waiting' as const,
  },
];

describe('ApprovalWorkflow', () => {
  const mockOnApprove = vi.fn();
  const mockOnReject = vi.fn();
  const mockOnDelegate = vi.fn();

  const defaultProps = {
    sessionId: 'test-session-123',
    approvers: mockApprovers,
    currentUserId: '2',
    currentUserRole: 'observer',
    onApprove: mockOnApprove,
    onReject: mockOnReject,
    onDelegate: mockOnDelegate,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders approval workflow with all approvers', () => {
    render(<ApprovalWorkflow {...defaultProps} />, { wrapper: createWrapper() });

    expect(screen.getByText(/approval workflow/i)).toBeInTheDocument();
    expect(screen.getByText('Test Teacher')).toBeInTheDocument();
    expect(screen.getByText('Test Observer')).toBeInTheDocument();
    expect(screen.getByText('Test Supervisor')).toBeInTheDocument();
  });

  it('shows correct status for each approver', () => {
    render(<ApprovalWorkflow {...defaultProps} />, { wrapper: createWrapper() });

    // Check status chips
    const statusChips = screen.getAllByRole('button').filter(
      (el) => el.className.includes('MuiChip-root')
    );
    
    expect(statusChips).toHaveLength(3);
  });

  it('shows action buttons for current user with pending status', () => {
    render(<ApprovalWorkflow {...defaultProps} />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delegate/i })).toBeInTheDocument();
  });

  it('calls onApprove when approve button is clicked', async () => {
    render(<ApprovalWorkflow {...defaultProps} />, { wrapper: createWrapper() });

    const approveButton = screen.getByRole('button', { name: /approve/i });
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(mockOnApprove).toHaveBeenCalledWith('2');
    });
  });

  it('shows reject dialog when reject button is clicked', async () => {
    render(<ApprovalWorkflow {...defaultProps} />, { wrapper: createWrapper() });

    const rejectButton = screen.getByRole('button', { name: /reject/i });
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(screen.getByText(/rejection reason/i)).toBeInTheDocument();
    });
  });

  it('submits rejection with reason', async () => {
    render(<ApprovalWorkflow {...defaultProps} />, { wrapper: createWrapper() });

    const rejectButton = screen.getByRole('button', { name: /reject/i });
    fireEvent.click(rejectButton);

    const reasonInput = screen.getByLabelText(/reason/i);
    fireEvent.change(reasonInput, { target: { value: 'Incomplete observation' } });

    const confirmButton = screen.getByRole('button', { name: /confirm rejection/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnReject).toHaveBeenCalledWith('2', 'Incomplete observation');
    });
  });

  it('shows delegate dialog when delegate button is clicked', async () => {
    render(<ApprovalWorkflow {...defaultProps} />, { wrapper: createWrapper() });

    const delegateButton = screen.getByRole('button', { name: /delegate/i });
    fireEvent.click(delegateButton);

    await waitFor(() => {
      expect(screen.getByText(/delegate approval/i)).toBeInTheDocument();
    });
  });

  it('disables actions for users who have already signed', () => {
    const propsWithSignedUser = {
      ...defaultProps,
      currentUserId: '1',
      currentUserRole: 'teacher',
    };

    render(<ApprovalWorkflow {...propsWithSignedUser} />, { wrapper: createWrapper() });

    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument();
  });

  it('shows visual timeline with connecting lines', () => {
    render(<ApprovalWorkflow {...defaultProps} />, { wrapper: createWrapper() });

    const timeline = screen.getByRole('list');
    expect(timeline).toBeInTheDocument();
    
    // Check for timeline items
    const timelineItems = timeline.querySelectorAll('.MuiTimelineItem-root');
    expect(timelineItems).toHaveLength(3);
  });

  it('shows completion status when all approvers have signed', () => {
    const allSignedApprovers = mockApprovers.map(approver => ({
      ...approver,
      status: 'signed' as const,
      signedAt: new Date(),
      signatureId: `sig-${approver.id}`,
    }));

    render(
      <ApprovalWorkflow {...defaultProps} approvers={allSignedApprovers} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/all approvals completed/i)).toBeInTheDocument();
  });

  it('displays signature timestamp for signed approvers', () => {
    render(<ApprovalWorkflow {...defaultProps} />, { wrapper: createWrapper() });

    // Check if timestamp is displayed for signed approver
    const signedApprover = screen.getByText('Test Teacher').closest('.MuiTimelineContent-root');
    expect(signedApprover?.textContent).toMatch(/Jan 10, 2024/);
  });

  it('handles empty approvers list', () => {
    render(
      <ApprovalWorkflow {...defaultProps} approvers={[]} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/no approvers assigned/i)).toBeInTheDocument();
  });

  it('shows correct icon for each approval status', () => {
    render(<ApprovalWorkflow {...defaultProps} />, { wrapper: createWrapper() });

    // Check for status icons in timeline dots
    const timelineDots = screen.getAllByTestId(/timeline-dot/i, { exact: false });
    expect(timelineDots.length).toBeGreaterThan(0);
  });
});