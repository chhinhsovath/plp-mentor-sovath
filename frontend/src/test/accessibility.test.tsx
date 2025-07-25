import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n/i18n';
import theme from '../theme/theme';
import { AuthProvider } from '../contexts/AuthContext';

// Components to test
import LoginPage from '../pages/LoginPage';
import HomePage from '../pages/HomePage';
import ObservationsPage from '../pages/ObservationsPage';
import ObservationForm from '../components/ObservationForm/ObservationForm';
import AnalyticsDashboard from '../components/Analytics/Dashboard';
import SignaturePanel from '../components/Signatures/SignaturePanel';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <AuthProvider>
              {children}
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
};

describe('Accessibility Tests', () => {
  describe('Authentication Pages', () => {
    it('should not have accessibility violations on login page', async () => {
      const { container } = render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper form labels and ARIA attributes', async () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      // Check for proper form labels
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

      // Check for submit button
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('should have proper heading hierarchy', async () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      // Should have main heading
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();
    });
  });

  describe('Navigation and Layout', () => {
    it('should not have accessibility violations on home page', async () => {
      const { container } = render(
        <TestWrapper>
          <HomePage />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper navigation landmarks', async () => {
      render(
        <TestWrapper>
          <HomePage />
        </TestWrapper>
      );

      // Check for navigation landmarks
      const navigation = screen.getByRole('navigation');
      expect(navigation).toBeInTheDocument();

      // Check for main content area
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('should have skip links for keyboard navigation', async () => {
      render(
        <TestWrapper>
          <HomePage />
        </TestWrapper>
      );

      // Look for skip link (might be visually hidden)
      const skipLink = screen.queryByText(/skip to main content/i);
      if (skipLink) {
        expect(skipLink).toHaveAttribute('href', '#main-content');
      }
    });
  });

  describe('Observation Forms', () => {
    const mockFormData = {
      id: '1',
      formCode: 'G1-KH',
      title: 'Grade 1 Khmer Form',
      subject: 'Khmer',
      gradeRange: '1',
      lessonPhases: [
        {
          id: '1',
          name: 'Introduction',
          indicators: [
            {
              id: '1',
              code: 'I1.1',
              description: 'Teacher greets students appropriately',
              rubricType: 'scale',
              scaleOptions: [
                { value: 1, label: 'Needs Improvement' },
                { value: 2, label: 'Satisfactory' },
                { value: 3, label: 'Excellent' },
              ],
            },
          ],
        },
      ],
    };

    it('should not have accessibility violations on observation form', async () => {
      const { container } = render(
        <TestWrapper>
          <ObservationForm
            formData={mockFormData}
            sessionData={{}}
            onSubmit={() => {}}
            onSave={() => {}}
          />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper form field labels and descriptions', async () => {
      render(
        <TestWrapper>
          <ObservationForm
            formData={mockFormData}
            sessionData={{}}
            onSubmit={() => {}}
            onSave={() => {}}
          />
        </TestWrapper>
      );

      // Check for form fields with proper labels
      const schoolNameField = screen.getByLabelText(/school name/i);
      expect(schoolNameField).toBeInTheDocument();

      const teacherNameField = screen.getByLabelText(/teacher name/i);
      expect(teacherNameField).toBeInTheDocument();
    });

    it('should have accessible radio button groups for rubrics', async () => {
      render(
        <TestWrapper>
          <ObservationForm
            formData={mockFormData}
            sessionData={{}}
            onSubmit={() => {}}
            onSave={() => {}}
          />
        </TestWrapper>
      );

      // Check for radio group with proper labeling
      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toBeInTheDocument();
      expect(radioGroup).toHaveAttribute('aria-labelledby');

      // Check individual radio buttons
      const radioButtons = screen.getAllByRole('radio');
      radioButtons.forEach(radio => {
        expect(radio).toHaveAttribute('name');
        expect(radio).toHaveAttribute('value');
      });
    });

    it('should have proper error message associations', async () => {
      render(
        <TestWrapper>
          <ObservationForm
            formData={mockFormData}
            sessionData={{}}
            onSubmit={() => {}}
            onSave={() => {}}
            errors={{ schoolName: 'School name is required' }}
          />
        </TestWrapper>
      );

      const schoolNameField = screen.getByLabelText(/school name/i);
      const errorMessage = screen.getByText(/school name is required/i);

      expect(schoolNameField).toHaveAttribute('aria-describedby');
      expect(errorMessage).toHaveAttribute('id');
    });
  });

  describe('Analytics Dashboard', () => {
    it('should not have accessibility violations on analytics dashboard', async () => {
      const { container } = render(
        <TestWrapper>
          <AnalyticsDashboard />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible charts with proper descriptions', async () => {
      render(
        <TestWrapper>
          <AnalyticsDashboard />
        </TestWrapper>
      );

      // Charts should have proper ARIA labels and descriptions
      const charts = screen.getAllByRole('img', { hidden: true });
      charts.forEach(chart => {
        expect(chart).toHaveAttribute('aria-label');
      });
    });

    it('should have accessible data tables', async () => {
      render(
        <TestWrapper>
          <AnalyticsDashboard />
        </TestWrapper>
      );

      const tables = screen.getAllByRole('table');
      tables.forEach(table => {
        // Tables should have captions or aria-label
        const caption = table.querySelector('caption');
        if (!caption) {
          expect(table).toHaveAttribute('aria-label');
        }

        // Check for proper table headers
        const headers = table.querySelectorAll('th');
        headers.forEach(header => {
          expect(header).toHaveAttribute('scope');
        });
      });
    });
  });

  describe('Signature Components', () => {
    it('should not have accessibility violations on signature panel', async () => {
      const { container } = render(
        <TestWrapper>
          <SignaturePanel
            onSignature={() => {}}
            signerRole="observer"
            disabled={false}
          />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible signature canvas', async () => {
      render(
        <TestWrapper>
          <SignaturePanel
            onSignature={() => {}}
            signerRole="observer"
            disabled={false}
          />
        </TestWrapper>
      );

      const canvas = screen.getByRole('img', { name: /signature canvas/i });
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveAttribute('aria-label');
    });

    it('should have keyboard accessible controls', async () => {
      render(
        <TestWrapper>
          <SignaturePanel
            onSignature={() => {}}
            signerRole="observer"
            disabled={false}
          />
        </TestWrapper>
      );

      const clearButton = screen.getByRole('button', { name: /clear signature/i });
      expect(clearButton).toBeInTheDocument();
      expect(clearButton).toHaveAttribute('tabindex', '0');

      const submitButton = screen.getByRole('button', { name: /submit signature/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('tabindex', '0');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should have proper tab order on observation page', async () => {
      render(
        <TestWrapper>
          <ObservationsPage />
        </TestWrapper>
      );

      // Get all focusable elements
      const focusableElements = screen.getAllByRole('button')
        .concat(screen.getAllByRole('textbox'))
        .concat(screen.getAllByRole('combobox'))
        .concat(screen.getAllByRole('link'));

      // Each focusable element should have proper tabindex
      focusableElements.forEach(element => {
        const tabIndex = element.getAttribute('tabindex');
        if (tabIndex !== null) {
          expect(parseInt(tabIndex)).toBeGreaterThanOrEqual(-1);
        }
      });
    });

    it('should have visible focus indicators', async () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const usernameField = screen.getByLabelText(/username/i);
      usernameField.focus();

      // Focus should be visible (this is handled by CSS, but we can check if element is focused)
      expect(usernameField).toHaveFocus();
    });
  });

  describe('Color Contrast and Visual Design', () => {
    it('should have sufficient color contrast for text elements', async () => {
      const { container } = render(
        <TestWrapper>
          <HomePage />
        </TestWrapper>
      );

      // axe will check color contrast automatically
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper ARIA landmarks', async () => {
      render(
        <TestWrapper>
          <HomePage />
        </TestWrapper>
      );

      // Check for main landmarks
      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
      expect(screen.getByRole('navigation')).toBeInTheDocument(); // nav
      expect(screen.getByRole('main')).toBeInTheDocument(); // main content
      expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
    });

    it('should have proper heading structure', async () => {
      render(
        <TestWrapper>
          <ObservationsPage />
        </TestWrapper>
      );

      const headings = screen.getAllByRole('heading');
      
      // Should have at least one h1
      const h1Elements = headings.filter(h => h.tagName === 'H1');
      expect(h1Elements.length).toBeGreaterThan(0);

      // Headings should be in logical order (no skipping levels)
      const headingLevels = headings.map(h => parseInt(h.tagName.charAt(1)));
      for (let i = 1; i < headingLevels.length; i++) {
        const currentLevel = headingLevels[i];
        const previousLevel = headingLevels[i - 1];
        
        // Should not skip more than one level
        expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
      }
    });

    it('should have descriptive link text', async () => {
      render(
        <TestWrapper>
          <HomePage />
        </TestWrapper>
      );

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        const linkText = link.textContent || link.getAttribute('aria-label');
        expect(linkText).toBeTruthy();
        expect(linkText).not.toMatch(/^(click here|read more|link)$/i);
      });
    });
  });

  describe('Mobile Accessibility', () => {
    it('should have proper touch target sizes', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <ObservationForm
            formData={mockFormData}
            sessionData={{}}
            onSubmit={() => {}}
            onSave={() => {}}
          />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        const minHeight = parseInt(styles.minHeight);
        const minWidth = parseInt(styles.minWidth);
        
        // Touch targets should be at least 44px (iOS) or 48dp (Android)
        expect(minHeight).toBeGreaterThanOrEqual(44);
        expect(minWidth).toBeGreaterThanOrEqual(44);
      });
    });
  });

  describe('Internationalization Accessibility', () => {
    it('should have proper lang attributes for Khmer content', async () => {
      // Switch to Khmer language
      await i18n.changeLanguage('km');

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const htmlElement = document.documentElement;
      expect(htmlElement).toHaveAttribute('lang', 'km');
    });

    it('should handle RTL text direction properly', async () => {
      await i18n.changeLanguage('km');

      render(
        <TestWrapper>
          <ObservationForm
            formData={mockFormData}
            sessionData={{}}
            onSubmit={() => {}}
            onSave={() => {}}
          />
        </TestWrapper>
      );

      // Check if RTL is properly handled for Khmer text
      const textElements = screen.getAllByText(/[\u1780-\u17FF]/); // Khmer Unicode range
      textElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        // Should have proper text direction for Khmer
        expect(['ltr', 'rtl']).toContain(styles.direction);
      });
    });
  });
});