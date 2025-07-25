import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import { I18nextProvider } from 'react-i18next';
import { SubmissionConfirmation } from '../index';
import { theme } from '../../../theme/theme';
import i18n from '../../../i18n/i18n';
import { ObservationSession } from '../../../types/observation';

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={theme}>
      <I18nextProvider i18n={i18n}>
        {children}
      </I18nextProvider>
    </ThemeProvider>
  );
};

const mockSession: ObservationSession = {
  id: 'session-123',
  observationDate: '2024-01-10',
  startTime: '09:00',
  endTime: '10:00',
  teacherName: 'Test Teacher',
  teacherId: 'teacher-1',
  observerName: 'Test Observer',
  observerId: 'observer-1',
  school: 'Test School',
  gradeLevel: 'Grade 4',
  subject: 'Mathematics',
  topic: 'Fractions',
  studentCount: 25,
  status: 'completed',
  formId: 'form-1',
  phases: [],
  notes: '',
  signatures: [],
  createdAt: '2024-01-10T08:00:00Z',
  updatedAt: '2024-01-10T10:00:00Z',
};

describe('SubmissionConfirmation', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn().mockResolvedValue(undefined);

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    onConfirm: mockOnConfirm,
    session: mockSession,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders confirmation dialog with session details', () => {
    render(<SubmissionConfirmation {...defaultProps} />, { wrapper: createWrapper() });

    expect(screen.getByText(/confirm submission/i)).toBeInTheDocument();
    expect(screen.getByText('Test Teacher')).toBeInTheDocument();
    expect(screen.getByText('Test Observer')).toBeInTheDocument();
    expect(screen.getByText('2024-01-10')).toBeInTheDocument();
  });

  it('displays validation errors when present', () => {
    const validationErrors = [
      'Missing indicator scores',
      'Observation duration too short',
    ];

    render(
      <SubmissionConfirmation
        {...defaultProps}
        validationErrors={validationErrors}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Missing indicator scores')).toBeInTheDocument();
    expect(screen.getByText('Observation duration too short')).toBeInTheDocument();
  });

  it('displays warnings when present', () => {
    const warnings = [
      'Some indicators have low scores',
      'No additional notes provided',
    ];

    render(
      <SubmissionConfirmation
        {...defaultProps}
        warnings={warnings}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Some indicators have low scores')).toBeInTheDocument();
    expect(screen.getByText('No additional notes provided')).toBeInTheDocument();
  });

  it('disables submit button when validation errors exist', () => {
    render(
      <SubmissionConfirmation
        {...defaultProps}
        validationErrors={['Error 1']}
      />,
      { wrapper: createWrapper() }
    );

    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).toBeDisabled();
  });

  it('shows submission progress when submitting', async () => {
    render(<SubmissionConfirmation {...defaultProps} />, { wrapper: createWrapper() });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  it('shows success message after successful submission', async () => {
    render(<SubmissionConfirmation {...defaultProps} />, { wrapper: createWrapper() });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/submission successful/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('displays reference number after submission', async () => {
    render(<SubmissionConfirmation {...defaultProps} />, { wrapper: createWrapper() });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/OBS-/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('allows copying reference number', async () => {
    render(<SubmissionConfirmation {...defaultProps} />, { wrapper: createWrapper() });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const copyButton = screen.getByTestId(/CopyIcon/i, { exact: false }).closest('button');
      if (copyButton) {
        fireEvent.click(copyButton);
      }
    }, { timeout: 3000 });

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('shows error message when submission fails', async () => {
    const mockFailingConfirm = vi.fn().mockRejectedValue(new Error('Network error'));

    render(
      <SubmissionConfirmation
        {...defaultProps}
        onConfirm={mockFailingConfirm}
      />,
      { wrapper: createWrapper() }
    );

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<SubmissionConfirmation {...defaultProps} />, { wrapper: createWrapper() });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('disables cancel button during submission', async () => {
    render(<SubmissionConfirmation {...defaultProps} />, { wrapper: createWrapper() });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });
  });

  it('shows submission steps during progress', async () => {
    render(<SubmissionConfirmation {...defaultProps} />, { wrapper: createWrapper() });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/validate/i)).toBeInTheDocument();
      expect(screen.getByText(/prepare/i)).toBeInTheDocument();
      expect(screen.getByText(/submit/i)).toBeInTheDocument();
      expect(screen.getByText(/complete/i)).toBeInTheDocument();
    });
  });

  it('displays next steps after successful submission', async () => {
    render(<SubmissionConfirmation {...defaultProps} />, { wrapper: createWrapper() });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/next steps/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows print and download buttons after submission', async () => {
    render(<SubmissionConfirmation {...defaultProps} />, { wrapper: createWrapper() });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /print/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles print action', async () => {
    const mockPrint = vi.fn();
    window.print = mockPrint;

    render(<SubmissionConfirmation {...defaultProps} />, { wrapper: createWrapper() });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const printButton = screen.getByRole('button', { name: /print/i });
      fireEvent.click(printButton);
    }, { timeout: 3000 });

    expect(mockPrint).toHaveBeenCalled();
  });

  it('closes dialog after viewing success message', async () => {
    render(<SubmissionConfirmation {...defaultProps} />, { wrapper: createWrapper() });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
    }, { timeout: 3000 });

    expect(mockOnClose).toHaveBeenCalled();
  });
});