import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { I18nextProvider } from 'react-i18next';
import { ObservationForm } from '../index';
import { ObservationForm as ObservationFormType } from '../../../types/observation';
import { theme } from '../../../theme/theme';
import i18n from '../../../i18n/i18n';

const mockForm: ObservationFormType = {
  id: '1',
  name: 'Primary School Observation Form',
  code: 'PSOF-001',
  description: 'Standard observation form for primary schools',
  gradeLevel: 'Grade 1',
  subject: 'Mathematics',
  isActive: true,
  lessonPhases: [
    {
      id: 'phase-1',
      name: 'Introduction',
      orderIndex: 1,
      indicators: [
        {
          id: 'ind-1',
          code: 'I.1',
          description: 'Teacher greets students',
          descriptionKh: 'គ្រូស្វាគមន៍សិស្ស',
          orderIndex: 1,
          phaseId: 'phase-1',
          rubrics: [
            {
              id: 'rub-1',
              level: 'excellent',
              levelValue: 4,
              description: 'Greets all students warmly',
              descriptionKh: 'ស្វាគមន៍សិស្សទាំងអស់យ៉ាងកក់ក្តៅ',
              indicatorId: 'ind-1',
            },
            {
              id: 'rub-2',
              level: 'good',
              levelValue: 3,
              description: 'Greets most students',
              descriptionKh: 'ស្វាគមន៍សិស្សភាគច្រើន',
              indicatorId: 'ind-1',
            },
          ],
        },
      ],
    },
  ],
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <I18nextProvider i18n={i18n}>
          {children}
        </I18nextProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('ObservationForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnSaveDraft = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form with all sections', () => {
    render(
      <ObservationForm
        form={mockForm}
        onSubmit={mockOnSubmit}
        onSaveDraft={mockOnSaveDraft}
        onCancel={mockOnCancel}
      />,
      { wrapper: createWrapper() }
    );

    // Check form title
    expect(screen.getByText('Primary School Observation Form')).toBeInTheDocument();

    // Check stepper is rendered
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('navigates through form steps', async () => {
    render(
      <ObservationForm
        form={mockForm}
        onSubmit={mockOnSubmit}
        onSaveDraft={mockOnSaveDraft}
        onCancel={mockOnCancel}
      />,
      { wrapper: createWrapper() }
    );

    // Initially on basic info step
    expect(screen.getByLabelText(/teacher/i)).toBeInTheDocument();

    // Navigate to next step
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    // Should show validation errors if fields are empty
    await waitFor(() => {
      expect(screen.getByLabelText(/teacher/i)).toBeInTheDocument();
    });
  });

  it('saves draft when save draft button is clicked', async () => {
    render(
      <ObservationForm
        form={mockForm}
        onSubmit={mockOnSubmit}
        onSaveDraft={mockOnSaveDraft}
        onCancel={mockOnCancel}
      />,
      { wrapper: createWrapper() }
    );

    const saveDraftButton = screen.getByRole('button', { name: /save draft/i });
    fireEvent.click(saveDraftButton);

    await waitFor(() => {
      expect(mockOnSaveDraft).toHaveBeenCalled();
    });
  });

  it('cancels form when cancel button is clicked', () => {
    render(
      <ObservationForm
        form={mockForm}
        onSubmit={mockOnSubmit}
        onSaveDraft={mockOnSaveDraft}
        onCancel={mockOnCancel}
      />,
      { wrapper: createWrapper() }
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('loads initial data when provided', () => {
    const initialData = {
      formId: '1',
      teacherId: 'teacher-1',
      schoolId: 'school-1',
      gradeLevel: 'Grade 1',
      subject: 'Mathematics',
      numberOfStudents: 30,
      numberOfFemaleStudents: 15,
      observationDate: '2025-07-19',
      startTime: '08:00',
      endTime: '09:00',
      responses: [],
      reflections: [],
    };

    render(
      <ObservationForm
        form={mockForm}
        initialData={initialData}
        onSubmit={mockOnSubmit}
        onSaveDraft={mockOnSaveDraft}
        onCancel={mockOnCancel}
      />,
      { wrapper: createWrapper() }
    );

    const numberOfStudentsInput = screen.getByLabelText(/number of students/i) as HTMLInputElement;
    expect(numberOfStudentsInput.value).toBe('30');
  });

  it('disables form during submission', () => {
    render(
      <ObservationForm
        form={mockForm}
        onSubmit={mockOnSubmit}
        onSaveDraft={mockOnSaveDraft}
        onCancel={mockOnCancel}
        isLoading={true}
      />,
      { wrapper: createWrapper() }
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeDisabled();
  });
});