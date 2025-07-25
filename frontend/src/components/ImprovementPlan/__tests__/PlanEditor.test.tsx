import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import { I18nextProvider } from 'react-i18next';
import { PlanEditor } from '../index';
import { theme } from '../../../theme/theme';
import i18n from '../../../i18n/i18n';
import { ImprovementPlan, PlanTemplate } from '../../../types/improvement';
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
  formId: 'form-1',
  teacherId: 'teacher-1',
  teacherName: 'Test Teacher',
  observerId: 'observer-1',
  observerName: 'Test Observer',
  schoolId: 'school-1',
  schoolName: 'Test School',
  gradeLevel: 'Grade 4',
  subject: 'Mathematics',
  numberOfStudents: 25,
  numberOfFemaleStudents: 12,
  observationDate: '2024-01-15',
  startTime: '09:00',
  endTime: '10:00',
  status: 'completed',
  responses: [],
  reflections: [],
  signatures: [],
};

const mockTemplate: PlanTemplate = {
  id: 'template-1',
  name: 'Standard Improvement Template',
  nameKh: 'គម្រោងកែលម្អស្តង់ដារ',
  description: 'A standard template for improvement plans',
  descriptionKh: 'គម្រោងស្តង់ដារសម្រាប់ផែនការកែលម្អ',
  category: 'general',
  goals: [
    {
      title: 'Improve student engagement',
      description: 'Increase active participation in class',
      targetIndicators: [],
      measurementCriteria: 'Student participation rate',
      targetValue: 80,
      status: 'pending',
    },
  ],
  activities: [
    {
      title: 'Peer observation',
      description: 'Observe experienced teacher',
      type: 'peer_observation',
      duration: 60,
      status: 'scheduled',
    },
  ],
  isActive: true,
  createdBy: 'admin',
  createdDate: '2024-01-01',
};

describe('PlanEditor', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    onSave: mockOnSave,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders plan editor with basic form fields', () => {
    render(<PlanEditor {...defaultProps} />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/plan title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/target date/i)).toBeInTheDocument();
  });

  it('shows session information when provided', () => {
    render(<PlanEditor {...defaultProps} session={mockSession} />, { wrapper: createWrapper() });

    expect(screen.getByText('Test Teacher')).toBeInTheDocument();
    expect(screen.getByText('Test School')).toBeInTheDocument();
    expect(screen.getByText('2024-01-15')).toBeInTheDocument();
  });

  it('loads template when selected', async () => {
    render(
      <PlanEditor {...defaultProps} templates={[mockTemplate]} />,
      { wrapper: createWrapper() }
    );

    const templateSelect = screen.getByLabelText(/template/i);
    fireEvent.mouseDown(templateSelect);

    const templateOption = screen.getByText('Standard Improvement Template');
    fireEvent.click(templateOption);

    // Move to goals step
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Improve student engagement')).toBeInTheDocument();
    });
  });

  it('validates required fields before submission', async () => {
    render(<PlanEditor {...defaultProps} />, { wrapper: createWrapper() });

    // Try to submit without filling required fields
    const stepper = screen.getAllByRole('button', { name: /next/i });
    
    // Click through all steps to reach review
    for (let i = 0; i < 4; i++) {
      fireEvent.click(stepper[0]);
    }

    // Should show validation errors
    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });

  it('allows adding and editing goals', async () => {
    render(<PlanEditor {...defaultProps} />, { wrapper: createWrapper() });

    // Navigate to goals step
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    // Add goal button
    const addGoalButton = screen.getByRole('button', { name: /add goal/i });
    fireEvent.click(addGoalButton);

    // Fill goal form
    const goalTitleInput = screen.getByLabelText(/goal title/i);
    fireEvent.change(goalTitleInput, { target: { value: 'Test Goal' } });

    const goalDescInput = screen.getByLabelText(/description/i);
    fireEvent.change(goalDescInput, { target: { value: 'Test goal description' } });

    // Save goal
    const saveButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Test Goal')).toBeInTheDocument();
    });
  });

  it('allows adding and editing activities', async () => {
    render(<PlanEditor {...defaultProps} />, { wrapper: createWrapper() });

    // Navigate to activities step (skip basic info and goals)
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton); // To goals
    fireEvent.click(nextButton); // To activities

    // Add activity button
    const addActivityButton = screen.getByRole('button', { name: /add activity/i });
    fireEvent.click(addActivityButton);

    // Fill activity form
    const activityTitleInput = screen.getByLabelText(/activity title/i);
    fireEvent.change(activityTitleInput, { target: { value: 'Test Activity' } });

    const activityDescInput = screen.getByLabelText(/description/i);
    fireEvent.change(activityDescInput, { target: { value: 'Test activity description' } });

    // Save activity
    const saveButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Test Activity')).toBeInTheDocument();
    });
  });

  it('shows review summary before submission', async () => {
    render(<PlanEditor {...defaultProps} />, { wrapper: createWrapper() });

    // Fill basic info
    const titleInput = screen.getByLabelText(/plan title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Plan' } });

    const descInput = screen.getByLabelText(/description/i);
    fireEvent.change(descInput, { target: { value: 'Test plan description' } });

    // Navigate to review (last step)
    const nextButton = screen.getByRole('button', { name: /next/i });
    for (let i = 0; i < 4; i++) {
      fireEvent.click(nextButton);
    }

    // Check review content
    expect(screen.getByText('Test Plan')).toBeInTheDocument();
    expect(screen.getByText('Test plan description')).toBeInTheDocument();
  });

  it('calls onSave with plan data when submitted', async () => {
    render(<PlanEditor {...defaultProps} session={mockSession} />, { wrapper: createWrapper() });

    // Fill basic info
    const titleInput = screen.getByLabelText(/plan title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Plan' } });

    const descInput = screen.getByLabelText(/description/i);
    fireEvent.change(descInput, { target: { value: 'Test plan description' } });

    // Navigate through all steps to save
    const nextButton = screen.getByRole('button', { name: /next/i });
    for (let i = 0; i < 4; i++) {
      fireEvent.click(nextButton);
    }

    // Click save button
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Plan',
          description: 'Test plan description',
          sessionId: 'session-123',
          teacherId: 'teacher-1',
          teacherName: 'Test Teacher',
        })
      );
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<PlanEditor {...defaultProps} />, { wrapper: createWrapper() });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('allows navigation between steps', () => {
    render(<PlanEditor {...defaultProps} />, { wrapper: createWrapper() });

    // Should start at basic info
    expect(screen.getByText(/basic info/i)).toBeInTheDocument();

    // Navigate forward
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    // Should be at goals
    expect(screen.getByText(/goals/i)).toBeInTheDocument();

    // Navigate back
    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);

    // Should be back at basic info
    expect(screen.getByLabelText(/plan title/i)).toBeInTheDocument();
  });

  it('disables back button on first step', () => {
    render(<PlanEditor {...defaultProps} />, { wrapper: createWrapper() });

    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeDisabled();
  });

  it('handles existing plan editing', () => {
    const existingPlan: Partial<ImprovementPlan> = {
      id: 'plan-123',
      title: 'Existing Plan',
      description: 'Existing description',
      priority: 'high',
      status: 'active',
      goals: [],
      activities: [],
    };

    render(
      <PlanEditor {...defaultProps} existingPlan={existingPlan as ImprovementPlan} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByDisplayValue('Existing Plan')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing description')).toBeInTheDocument();
  });

  it('shows warnings when no goals or activities are added', async () => {
    render(<PlanEditor {...defaultProps} />, { wrapper: createWrapper() });

    // Fill basic info
    const titleInput = screen.getByLabelText(/plan title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Plan' } });

    const descInput = screen.getByLabelText(/description/i);
    fireEvent.change(descInput, { target: { value: 'Test plan description' } });

    // Navigate to review
    const nextButton = screen.getByRole('button', { name: /next/i });
    for (let i = 0; i < 4; i++) {
      fireEvent.click(nextButton);
    }

    // Should show warnings
    expect(screen.getByText(/no goals warning/i)).toBeInTheDocument();
    expect(screen.getByText(/no activities warning/i)).toBeInTheDocument();
  });
});