import { render, screen, within } from '@testing-library/react';
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
import FormBuilderPage from '../pages/FormBuilderPage';
import ImprovementPlan from '../components/ImprovementPlan/PlanEditor';
import UserManagementDashboard from '../components/UserManagement/UserManagementDashboard';

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

describe('Enhanced Accessibility Tests', () => {
  describe('WCAG 2.1 Compliance', () => {
    it('should meet WCAG 2.1 AA standards for login page', async () => {
      const { container } = render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
          'label': { enabled: true },
          'frame-title': { enabled: true },
          'aria-allowed-attr': { enabled: true },
          'aria-required-attr': { enabled: true },
          'aria-required-children': { enabled: true },
          'aria-required-parent': { enabled: true },
          'aria-roles': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
          'aria-valid-attr': { enabled: true },
          'button-name': { enabled: true },
          'document-title': { enabled: true },
          'duplicate-id': { enabled: true },
          'html-has-lang': { enabled: true },
          'image-alt': { enabled: true },
          'input-button-name': { enabled: true },
          'link-name': { enabled: true },
          'list': { enabled: true },
          'listitem': { enabled: true },
          'meta-viewport': { enabled: true },
        }
      });

      expect(results).toHaveNoViolations();
    });

    it('should meet WCAG 2.1 AA standards for form builder page', async () => {
      const { container } = render(
        <TestWrapper>
          <FormBuilderPage />
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
          'label': { enabled: true },
          'aria-allowed-attr': { enabled: true },
          'aria-required-attr': { enabled: true },
          'aria-roles': { enabled: true },
          'button-name': { enabled: true },
          'image-alt': { enabled: true },
          'input-button-name': { enabled: true },
          'link-name': { enabled: true },
        }
      });

      expect(results).toHaveNoViolations();
    });

    it('should meet WCAG 2.1 AA standards for improvement plan editor', async () => {
      const mockPlan = {
        id: '1',
        sessionId: '1',
        goals: 'Improve teaching methods',
        timeline: '4 weeks',
        responsibleParty: 'Teacher and mentor',
        status: 'IN_PROGRESS',
        actions: [
          {
            id: '1',
            description: 'Research new teaching techniques',
            dueDate: '2025-08-01',
            assignedTo: 'Teacher',
            status: 'IN_PROGRESS',
          }
        ]
      };

      const { container } = render(
        <TestWrapper>
          <ImprovementPlan 
            plan={mockPlan}
            onSave={() => {}}
            readOnly={false}
          />
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
          'label': { enabled: true },
          'aria-allowed-attr': { enabled: true },
          'aria-required-attr': { enabled: true },
          'aria-roles': { enabled: true },
          'button-name': { enabled: true },
          'image-alt': { enabled: true },
          'input-button-name': { enabled: true },
          'link-name': { enabled: true },
        }
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation and Focus Management', () => {
    it('should have proper focus order in login form', async () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      // Get all focusable elements
      const username = screen.getByLabelText(/username/i);
      const password = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Check initial focus
      expect(document.activeElement).not.toBe(username);
      
      // Focus first element
      username.focus();
      expect(document.activeElement).toBe(username);
      
      // Tab to next element
      userEvent.tab();
      expect(document.activeElement).toBe(password);
      
      // Tab to submit button
      userEvent.tab();
      expect(document.activeElement).toBe(submitButton);
    });

    it('should trap focus in modal dialogs', async () => {
      render(
        <TestWrapper>
          <SignaturePanel
            onSignature={() => {}}
            signerRole="observer"
            disabled={false}
          />
        </TestWrapper>
      );

      // Find dialog elements
      const dialog = screen.getByRole('dialog');
      const closeButton = within(dialog).getByRole('button', { name: /close/i });
      const clearButton = within(dialog).getByRole('button', { name: /clear/i });
      const submitButton = within(dialog).getByRole('button', { name: /submit/i });
      
      // Focus should stay within dialog when tabbing
      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);
      
      userEvent.tab();
      expect(document.activeElement).toBe(clearButton);
      
      userEvent.tab();
      expect(document.activeElement).toBe(submitButton);
      
      userEvent.tab();
      // Focus should cycle back to first focusable element in dialog
      expect(document.activeElement).toBe(closeButton);
    });

    it('should support keyboard navigation in complex components', async () => {
      render(
        <TestWrapper>
          <ObservationsPage />
        </TestWrapper>
      );

      // Find filter controls
      const filterButton = screen.getByRole('button', { name: /filter/i });
      
      // Open filter panel with keyboard
      filterButton.focus();
      expect(document.activeElement).toBe(filterButton);
      
      userEvent.keyboard('{enter}');
      
      // Check if filter panel is open and focusable
      const filterPanel = screen.getByRole('region', { name: /filters/i });
      expect(filterPanel).toBeInTheDocument();
      
      // Find focusable elements in filter panel
      const subjectFilter = within(filterPanel).getByLabelText(/subject/i);
      expect(subjectFilter).toBeInTheDocument();
      
      // Should be able to focus filter controls
      subjectFilter.focus();
      expect(document.activeElement).toBe(subjectFilter);
    });
  });

  describe('Screen Reader Accessibility', () => {
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
      expect(h1Elements.length).toBe(1);

      // Headings should be in logical order (no skipping levels)
      const headingLevels = headings.map(h => parseInt(h.tagName.charAt(1)));
      for (let i = 1; i < headingLevels.length; i++) {
        const currentLevel = headingLevels[i];
        const previousLevel = headingLevels[i - 1];
        
        // Should not skip more than one level
        expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
      }
    });

    it('should have proper ARIA attributes on interactive elements', async () => {
      render(
        <TestWrapper>
          <AnalyticsDashboard />
        </TestWrapper>
      );

      // Check tabs for proper ARIA roles
      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();
      
      const tabs = within(tabList).getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);
      
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected');
        expect(tab).toHaveAttribute('tabindex');
        
        // Selected tab should have aria-selected="true"
        if (tab.getAttribute('aria-selected') === 'true') {
          expect(tab).toHaveAttribute('tabindex', '0');
        } else {
          expect(tab).toHaveAttribute('tabindex', '-1');
        }
      });
      
      // Check tab panels
      const tabPanels = screen.getAllByRole('tabpanel');
      expect(tabPanels.length).toBeGreaterThan(0);
      
      tabPanels.forEach(panel => {
        expect(panel).toHaveAttribute('aria-labelledby');
        expect(panel).toHaveAttribute('tabindex', '0');
      });
    });

    it('should have proper ARIA attributes on form controls', async () => {
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

      // Check form fields
      const formFields = screen.getAllByRole('textbox');
      formFields.forEach(field => {
        expect(field).toHaveAttribute('aria-invalid', 'false');
      });
      
      // Check radio groups
      const radioGroups = screen.getAllByRole('radiogroup');
      radioGroups.forEach(group => {
        expect(group).toHaveAttribute('aria-labelledby');
      });
      
      // Check buttons
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        if (button.hasAttribute('disabled')) {
          expect(button).toHaveAttribute('aria-disabled', 'true');
        }
      });
    });

    it('should announce form validation errors to screen readers', async () => {
      render(
        <TestWrapper>
          <ObservationForm
            formData={mockFormData}
            sessionData={{}}
            onSubmit={() => {}}
            onSave={() => {}}
            errors={{ 
              schoolName: 'School name is required',
              teacherName: 'Teacher name is required'
            }}
          />
        </TestWrapper>
      );

      // Check error messages are properly associated with inputs
      const schoolNameField = screen.getByLabelText(/school name/i);
      const schoolNameError = screen.getByText(/school name is required/i);
      
      expect(schoolNameField).toHaveAttribute('aria-invalid', 'true');
      expect(schoolNameField).toHaveAttribute('aria-describedby');
      
      const describedById = schoolNameField.getAttribute('aria-describedby');
      expect(schoolNameError).toHaveAttribute('id', describedById);
    });
  });

  describe('Color and Contrast Accessibility', () => {
    it('should have sufficient color contrast for all text elements', async () => {
      const { container } = render(
        <TestWrapper>
          <UserManagementDashboard />
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('should not rely solely on color to convey information', async () => {
      render(
        <TestWrapper>
          <AnalyticsDashboard />
        </TestWrapper>
      );

      // Status indicators should have text in addition to color
      const statusIndicators = screen.getAllByRole('status');
      statusIndicators.forEach(indicator => {
        // Should have text content, not just color
        expect(indicator.textContent).toBeTruthy();
      });
    });
  });

  describe('Form Accessibility', () => {
    it('should have properly labeled form controls', async () => {
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

      // All form controls should have labels
      const textInputs = screen.getAllByRole('textbox');
      textInputs.forEach(input => {
        expect(input).toHaveAccessibleName();
      });

      const selects = screen.getAllByRole('combobox');
      selects.forEach(select => {
        expect(select).toHaveAccessibleName();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toHaveAccessibleName();
      });

      const radioButtons = screen.getAllByRole('radio');
      radioButtons.forEach(radio => {
        expect(radio).toHaveAccessibleName();
      });
    });

    it('should group related form controls with fieldsets and legends', async () => {
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

      // Check for fieldsets
      const fieldsets = screen.getAllByRole('group');
      expect(fieldsets.length).toBeGreaterThan(0);
      
      fieldsets.forEach(fieldset => {
        // Each fieldset should have a legend or aria-label
        const legend = within(fieldset).queryByRole('legend');
        if (!legend) {
          expect(fieldset).toHaveAttribute('aria-label');
        }
      });
    });

    it('should provide clear error messages for form validation', async () => {
      render(
        <TestWrapper>
          <ObservationForm
            formData={mockFormData}
            sessionData={{}}
            onSubmit={() => {}}
            onSave={() => {}}
            errors={{
              schoolName: 'School name is required',
              teacherName: 'Teacher name is required',
            }}
          />
        </TestWrapper>
      );

      // Error messages should be visible
      expect(screen.getByText(/school name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/teacher name is required/i)).toBeInTheDocument();
      
      // Error messages should be associated with form controls
      const schoolNameField = screen.getByLabelText(/school name/i);
      expect(schoolNameField).toHaveAttribute('aria-invalid', 'true');
      expect(schoolNameField).toHaveAttribute('aria-describedby');
    });
  });

  describe('Mobile and Touch Accessibility', () => {
    it('should have adequate touch target sizes', async () => {
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
        const height = parseInt(styles.height);
        const width = parseInt(styles.width);
        
        // Touch targets should be at least 44px (iOS) or 48dp (Android)
        expect(height).toBeGreaterThanOrEqual(44);
        expect(width).toBeGreaterThanOrEqual(44);
      });
    });

    it('should support touch gestures for interactive elements', async () => {
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
      
      // Canvas should have touch event handlers
      expect(canvas).toHaveAttribute('ontouchstart');
      expect(canvas).toHaveAttribute('ontouchmove');
      expect(canvas).toHaveAttribute('ontouchend');
    });
  });

  describe('Internationalization and Localization Accessibility', () => {
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

    it('should properly display Khmer text without layout issues', async () => {
      // Switch to Khmer language
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

      // Check if Khmer text is rendered properly
      const khmerTextElements = screen.getAllByText(/[\u1780-\u17FF]/); // Khmer Unicode range
      expect(khmerTextElements.length).toBeGreaterThan(0);
      
      khmerTextElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        
        // Text should not be cut off
        expect(parseInt(styles.height)).toBeGreaterThan(0);
        
        // Font family should support Khmer script
        expect(styles.fontFamily).toMatch(/(Khmer|Hanuman|Battambang|Moul|system-ui)/i);
      });
    });

    it('should handle date formats correctly for Khmer locale', async () => {
      // Switch to Khmer language
      await i18n.changeLanguage('km');

      render(
        <TestWrapper>
          <ObservationForm
            formData={mockFormData}
            sessionData={{
              dateObserved: '2025-07-20',
            }}
            onSubmit={() => {}}
            onSave={() => {}}
          />
        </TestWrapper>
      );

      // Date should be formatted according to Khmer locale
      const dateField = screen.getByDisplayValue(/20.*07.*2025/);
      expect(dateField).toBeInTheDocument();
    });
  });

  describe('Dynamic Content Accessibility', () => {
    it('should announce dynamic content changes to screen readers', async () => {
      render(
        <TestWrapper>
          <AnalyticsDashboard />
        </TestWrapper>
      );

      // Find loading indicator
      const loadingIndicator = screen.getByRole('progressbar');
      expect(loadingIndicator).toBeInTheDocument();
      
      // Loading indicator should have aria-live attribute
      expect(loadingIndicator).toHaveAttribute('aria-live', 'polite');
    });

    it('should maintain focus when content changes', async () => {
      render(
        <TestWrapper>
          <ObservationsPage />
        </TestWrapper>
      );

      // Find filter button
      const filterButton = screen.getByRole('button', { name: /filter/i });
      filterButton.focus();
      expect(document.activeElement).toBe(filterButton);
      
      // Simulate click to open filter panel
      userEvent.click(filterButton);
      
      // Focus should be maintained or moved to the filter panel
      expect(document.activeElement).not.toBe(document.body);
    });
  });
});

// Mock form data for tests
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

// Mock userEvent for keyboard navigation tests
const userEvent = {
  tab: () => {
    const focusableElements = [
      ...Array.from(document.querySelectorAll('button:not([disabled])')),
      ...Array.from(document.querySelectorAll('input:not([disabled])')),
      ...Array.from(document.querySelectorAll('select:not([disabled])')),
      ...Array.from(document.querySelectorAll('textarea:not([disabled])')),
      ...Array.from(document.querySelectorAll('a[href]:not([disabled])')),
      ...Array.from(document.querySelectorAll('[tabindex="0"]')),
    ];
    
    const currentFocusIndex = focusableElements.findIndex(el => el === document.activeElement);
    const nextIndex = currentFocusIndex + 1 < focusableElements.length ? currentFocusIndex + 1 : 0;
    
    if (focusableElements[nextIndex]) {
      focusableElements[nextIndex].focus();
    }
  },
  
  click: (element) => {
    element.click();
  },
  
  keyboard: (input) => {
    if (input === '{enter}' && document.activeElement) {
      document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13 }));
    }
  }
};