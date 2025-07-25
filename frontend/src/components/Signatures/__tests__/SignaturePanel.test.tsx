import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import { I18nextProvider } from 'react-i18next';
import { SignaturePanel } from '../index';
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

describe('SignaturePanel', () => {
  const mockOnSign = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    onSign: mockOnSign,
    onCancel: mockOnCancel,
    signerName: 'Test Teacher',
    signerRole: 'teacher',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock canvas context
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      lineCap: '',
      lineJoin: '',
      strokeStyle: '',
      lineWidth: 0,
      fillStyle: '',
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      stroke: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(4 * 100 * 100).fill(255),
      })),
      drawImage: vi.fn(),
    }));
    
    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,test');
  });

  it('renders signature panel with instructions', () => {
    render(<SignaturePanel {...defaultProps} />, { wrapper: createWrapper() });

    expect(screen.getByText(/digital signature/i)).toBeInTheDocument();
    expect(screen.getByText(/signing as/i)).toBeInTheDocument();
    expect(screen.getByText('Test Teacher')).toBeInTheDocument();
  });

  it('shows clear button when signature is drawn', async () => {
    render(<SignaturePanel {...defaultProps} />, { wrapper: createWrapper() });

    const canvas = screen.getByRole('img', { hidden: true }).parentElement?.querySelector('canvas');
    expect(canvas).toBeInTheDocument();

    // Simulate drawing
    if (canvas) {
      fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
      fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseUp(canvas);
    }

    const clearButton = screen.getByRole('button', { name: /clear/i });
    expect(clearButton).not.toBeDisabled();
  });

  it('calls onSign when signature is submitted', async () => {
    render(<SignaturePanel {...defaultProps} />, { wrapper: createWrapper() });

    const canvas = screen.getByRole('img', { hidden: true }).parentElement?.querySelector('canvas');
    
    // Simulate drawing
    if (canvas) {
      fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
      fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseUp(canvas);
    }

    const signButton = screen.getByRole('button', { name: /sign/i });
    fireEvent.click(signButton);

    await waitFor(() => {
      expect(mockOnSign).toHaveBeenCalledWith('data:image/png;base64,test');
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<SignaturePanel {...defaultProps} />, { wrapper: createWrapper() });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables sign button when canvas is empty', () => {
    render(<SignaturePanel {...defaultProps} />, { wrapper: createWrapper() });

    const signButton = screen.getByRole('button', { name: /sign/i });
    expect(signButton).toBeDisabled();
  });

  it('clears canvas when clear button is clicked', async () => {
    render(<SignaturePanel {...defaultProps} />, { wrapper: createWrapper() });

    const canvas = screen.getByRole('img', { hidden: true }).parentElement?.querySelector('canvas');
    
    // Simulate drawing
    if (canvas) {
      fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
      fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseUp(canvas);
    }

    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);

    await waitFor(() => {
      const signButton = screen.getByRole('button', { name: /sign/i });
      expect(signButton).toBeDisabled();
    });
  });

  it('shows existing signature in read-only mode', () => {
    render(
      <SignaturePanel
        {...defaultProps}
        existingSignature="data:image/png;base64,existing"
        readOnly
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByAltText(/signature/i)).toBeInTheDocument();
    expect(screen.getByText(/signed by/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign/i })).not.toBeInTheDocument();
  });

  it('supports touch events for mobile', () => {
    render(<SignaturePanel {...defaultProps} />, { wrapper: createWrapper() });

    const canvas = screen.getByRole('img', { hidden: true }).parentElement?.querySelector('canvas');
    
    if (canvas) {
      fireEvent.touchStart(canvas, {
        touches: [{ clientX: 50, clientY: 50 }],
      });
      fireEvent.touchMove(canvas, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      fireEvent.touchEnd(canvas);
    }

    const clearButton = screen.getByRole('button', { name: /clear/i });
    expect(clearButton).not.toBeDisabled();
  });

  it('shows quality warning for low quality signatures', async () => {
    // Mock low quality detection
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      lineCap: '',
      lineJoin: '',
      strokeStyle: '',
      lineWidth: 0,
      fillStyle: '',
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      stroke: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(4 * 100 * 100).fill(255), // All white = low quality
      })),
      drawImage: vi.fn(),
    }));

    render(<SignaturePanel {...defaultProps} />, { wrapper: createWrapper() });

    const canvas = screen.getByRole('img', { hidden: true }).parentElement?.querySelector('canvas');
    
    if (canvas) {
      fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
      fireEvent.mouseMove(canvas, { clientX: 51, clientY: 51 }); // Very small signature
      fireEvent.mouseUp(canvas);
    }

    const signButton = screen.getByRole('button', { name: /sign/i });
    fireEvent.click(signButton);

    await waitFor(() => {
      expect(screen.getByText(/low quality/i)).toBeInTheDocument();
    });
  });
});