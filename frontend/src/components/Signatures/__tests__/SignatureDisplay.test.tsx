import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import { I18nextProvider } from 'react-i18next';
import { SignatureDisplay } from '../index';
import { theme } from '../../../theme/theme';
import i18n from '../../../i18n/i18n';
import { Signature } from '../../../types/observation';

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={theme}>
      <I18nextProvider i18n={i18n}>
        {children}
      </I18nextProvider>
    </ThemeProvider>
  );
};

const mockSignatures: Signature[] = [
  {
    id: '1',
    role: 'teacher',
    signerName: 'Test Teacher',
    signedDate: '2024-01-10T10:00:00Z',
    signatureData: 'data:image/png;base64,test1',
    ipAddress: '192.168.1.1',
  },
  {
    id: '2',
    role: 'observer',
    signerName: 'Test Observer',
    signedDate: '2024-01-10T11:00:00Z',
    signatureData: 'data:image/png;base64,test2',
    ipAddress: '192.168.1.2',
  },
];

// Mock date-fns format function
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    const d = new Date(date);
    if (formatStr === 'MMM d, yyyy h:mm a') {
      return 'Jan 10, 2024 10:00 AM';
    }
    return 'Jan 10, 2024';
  }),
}));

describe('SignatureDisplay', () => {
  const mockOnVerify = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    });
  });

  it('renders all signatures in standard view', () => {
    render(
      <SignatureDisplay signatures={mockSignatures} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Test Teacher')).toBeInTheDocument();
    expect(screen.getByText('Test Observer')).toBeInTheDocument();
  });

  it('renders signatures in compact view', () => {
    render(
      <SignatureDisplay signatures={mockSignatures} compact />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/signatures/i)).toBeInTheDocument();
    expect(screen.getByText('(2)')).toBeInTheDocument();
    expect(screen.getByText('Test Teacher')).toBeInTheDocument();
    expect(screen.getByText('Test Observer')).toBeInTheDocument();
  });

  it('shows validation status when enabled', () => {
    render(
      <SignatureDisplay signatures={mockSignatures} showValidation />,
      { wrapper: createWrapper() }
    );

    // Should show validation icons
    const validationIcons = screen.getAllByTestId(/VerifiedIcon|UnverifiedIcon/i, { exact: false });
    expect(validationIcons.length).toBeGreaterThan(0);
  });

  it('opens detail dialog when signature is clicked', async () => {
    render(
      <SignatureDisplay signatures={mockSignatures} />,
      { wrapper: createWrapper() }
    );

    const firstSignature = screen.getByText('Test Teacher').closest('[class*="MuiPaper-root"]');
    if (firstSignature) {
      fireEvent.click(firstSignature);
    }

    await waitFor(() => {
      expect(screen.getByText(/signature details/i)).toBeInTheDocument();
    });
  });

  it('displays signature details in dialog', async () => {
    render(
      <SignatureDisplay signatures={mockSignatures} />,
      { wrapper: createWrapper() }
    );

    const firstSignature = screen.getByText('Test Teacher').closest('[class*="MuiPaper-root"]');
    if (firstSignature) {
      fireEvent.click(firstSignature);
    }

    await waitFor(() => {
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
      expect(screen.getByAltText(/signature/i)).toBeInTheDocument();
    });
  });

  it('downloads signature when download button is clicked', async () => {
    render(
      <SignatureDisplay signatures={mockSignatures} />,
      { wrapper: createWrapper() }
    );

    // Create a mock for createElement and click
    const mockClick = vi.fn();
    const mockLink = { href: '', download: '', click: mockClick };
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

    const downloadButtons = screen.getAllByTestId(/DownloadIcon/i, { exact: false });
    const firstDownloadButton = downloadButtons[0].closest('button');
    
    if (firstDownloadButton) {
      fireEvent.click(firstDownloadButton);
    }

    expect(mockLink.href).toBe('data:image/png;base64,test1');
    expect(mockLink.download).toMatch(/signature_Test Teacher/);
    expect(mockClick).toHaveBeenCalled();
  });

  it('shows empty state when no signatures', () => {
    render(
      <SignatureDisplay signatures={[]} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/no signatures/i)).toBeInTheDocument();
  });

  it('displays role-specific styling', () => {
    render(
      <SignatureDisplay signatures={mockSignatures} />,
      { wrapper: createWrapper() }
    );

    const teacherChip = screen.getByText(/teacher/i);
    const observerChip = screen.getByText(/observer/i);

    expect(teacherChip).toBeInTheDocument();
    expect(observerChip).toBeInTheDocument();
  });

  it('calls onVerify when verify button is clicked', async () => {
    render(
      <SignatureDisplay 
        signatures={mockSignatures} 
        showValidation 
        onVerify={mockOnVerify} 
      />,
      { wrapper: createWrapper() }
    );

    // Open details dialog
    const firstSignature = screen.getByText('Test Teacher').closest('[class*="MuiPaper-root"]');
    if (firstSignature) {
      fireEvent.click(firstSignature);
    }

    await waitFor(() => {
      const verifyButton = screen.getByRole('button', { name: /verify/i });
      fireEvent.click(verifyButton);
    });

    expect(mockOnVerify).toHaveBeenCalledWith('1');
  });

  it('shows validation issues when present', () => {
    // Mock validation to return issues
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.9) // Make it invalid
      .mockReturnValueOnce(0.9); // With issues

    render(
      <SignatureDisplay signatures={mockSignatures} showValidation />,
      { wrapper: createWrapper() }
    );

    // Should show warning alerts for validation issues
    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeGreaterThan(0);
  });

  it('handles signatures without data gracefully', () => {
    const signaturesWithoutData = [
      {
        id: '3',
        role: 'supervisor',
        signerName: 'Test Supervisor',
        signedDate: '2024-01-10T12:00:00Z',
        // No signatureData
      },
    ];

    render(
      <SignatureDisplay signatures={signaturesWithoutData as Signature[]} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Test Supervisor')).toBeInTheDocument();
    // Should not show image
    expect(screen.queryByAltText(/signature/i)).not.toBeInTheDocument();
  });

  it('closes detail dialog when close button is clicked', async () => {
    render(
      <SignatureDisplay signatures={mockSignatures} />,
      { wrapper: createWrapper() }
    );

    // Open dialog
    const firstSignature = screen.getByText('Test Teacher').closest('[class*="MuiPaper-root"]');
    if (firstSignature) {
      fireEvent.click(firstSignature);
    }

    await waitFor(() => {
      expect(screen.getByText(/signature details/i)).toBeInTheDocument();
    });

    // Close dialog
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText(/signature details/i)).not.toBeInTheDocument();
    });
  });
});