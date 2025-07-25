import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import { I18nextProvider } from 'react-i18next';
import { ActivityScheduler } from '../index';
import { theme } from '../../../theme/theme';
import i18n from '../../../i18n/i18n';
import { ImprovementPlan, FollowUpActivity } from '../../../types/improvement';

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={theme}>
      <I18nextProvider i18n={i18n}>
        {children}
      </I18nextProvider>
    </ThemeProvider>
  );
};

const mockPlan: ImprovementPlan = {
  id: 'plan-123',
  sessionId: 'session-123',
  teacherId: 'teacher-1',
  teacherName: 'Test Teacher',
  observerId: 'observer-1',
  observerName: 'Test Observer',
  schoolId: 'school-1',
  schoolName: 'Test School',
  title: 'Test Improvement Plan',
  description: 'Test plan description',
  status: 'active',
  priority: 'medium',
  targetDate: '2024-06-30',
  createdDate: '2024-01-15',
  updatedDate: '2024-01-15',
  goals: [
    {
      id: 'goal-1',
      planId: 'plan-123',
      title: 'Improve teaching methods',
      description: 'Enhance classroom engagement',
      targetIndicators: [],
      measurementCriteria: 'Student feedback',
      targetValue: 80,
      currentValue: 50,
      status: 'in_progress',
      dueDate: '2024-03-31',
    },
  ],
  activities: [],
  resources: [],
  progress: [],
  approvals: [],
};

const mockActivities: FollowUpActivity[] = [
  {
    id: 'activity-1',
    planId: 'plan-123',
    goalId: 'goal-1',
    title: 'Classroom Observation',
    description: 'Observe senior teacher class',
    type: 'peer_observation',
    scheduledDate: '2024-02-15',
    duration: 60,
    location: 'Room 101',
    facilitator: 'Senior Teacher',
    participants: ['teacher-1'],
    status: 'scheduled',
    reminders: [
      {
        id: 'reminder-1',
        activityId: 'activity-1',
        type: 'email',
        scheduledDate: '2024-02-14',
        message: 'Reminder: Classroom observation tomorrow',
        recipients: ['teacher-1'],
        status: 'pending',
      },
    ],
  },
  {
    id: 'activity-2',
    planId: 'plan-123',
    title: 'Training Workshop',
    description: 'Active learning strategies',
    type: 'training',
    scheduledDate: '2024-02-20',
    duration: 120,
    location: 'Training Center',
    facilitator: 'Expert Trainer',
    participants: ['teacher-1', 'teacher-2'],
    status: 'scheduled',
    materials: [
      {
        id: 'material-1',
        activityId: 'activity-2',
        name: 'Training Guide',
        type: 'document',
        url: 'https://example.com/guide.pdf',
        description: 'Workshop materials',
      },
    ],
    reminders: [],
  },
  {
    id: 'activity-3',
    planId: 'plan-123',
    title: 'Self Study',
    description: 'Review teaching resources',
    type: 'self_study',
    scheduledDate: '2024-01-20',
    duration: 90,
    status: 'completed',
    reminders: [],
  },
];

describe('ActivityScheduler', () => {
  const mockOnActivityUpdate = vi.fn();
  const mockOnActivityDelete = vi.fn();
  const mockOnActivityAdd = vi.fn();
  const mockOnReminderUpdate = vi.fn();

  const defaultProps = {
    plan: mockPlan,
    activities: mockActivities,
    onActivityUpdate: mockOnActivityUpdate,
    onActivityDelete: mockOnActivityDelete,
    onActivityAdd: mockOnActivityAdd,
    onReminderUpdate: mockOnReminderUpdate,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders activity scheduler with all views', () => {
    render(<ActivityScheduler {...defaultProps} />, { wrapper: createWrapper() });

    expect(screen.getByText(/activities/i)).toBeInTheDocument();
    
    // View toggles
    expect(screen.getByTestId(/CalendarIcon/i, { exact: false })).toBeInTheDocument();
    expect(screen.getByTestId(/ListView/i, { exact: false })).toBeInTheDocument();
    expect(screen.getByTestId(/GridView/i, { exact: false })).toBeInTheDocument();
  });

  it('displays activities in list view by default', () => {
    render(<ActivityScheduler {...defaultProps} />, { wrapper: createWrapper() });

    // Switch to list view
    const listViewButton = screen.getByTestId(/ListView/i, { exact: false }).closest('button');
    if (listViewButton) fireEvent.click(listViewButton);

    expect(screen.getByText('Classroom Observation')).toBeInTheDocument();
    expect(screen.getByText('Training Workshop')).toBeInTheDocument();
    expect(screen.getByText('Self Study')).toBeInTheDocument();
  });

  it('filters activities by status', async () => {
    render(<ActivityScheduler {...defaultProps} />, { wrapper: createWrapper() });

    const filterSelect = screen.getByLabelText(/filter/i);
    fireEvent.mouseDown(filterSelect);

    const completedOption = screen.getByRole('option', { name: /completed/i });
    fireEvent.click(completedOption);

    await waitFor(() => {
      expect(screen.getByText('Self Study')).toBeInTheDocument();
      expect(screen.queryByText('Classroom Observation')).not.toBeInTheDocument();
    });
  });

  it('searches activities by text', async () => {
    render(<ActivityScheduler {...defaultProps} />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'workshop' } });

    await waitFor(() => {
      expect(screen.getByText('Training Workshop')).toBeInTheDocument();
      expect(screen.queryByText('Classroom Observation')).not.toBeInTheDocument();
    });
  });

  it('shows upcoming reminders alert', () => {
    render(<ActivityScheduler {...defaultProps} />, { wrapper: createWrapper() });

    // Switch to list view to see reminders
    const listViewButton = screen.getByTestId(/ListView/i, { exact: false }).closest('button');
    if (listViewButton) fireEvent.click(listViewButton);

    expect(screen.getByText(/upcoming reminders/i)).toBeInTheDocument();
  });

  it('allows starting scheduled activities', async () => {
    render(<ActivityScheduler {...defaultProps} />, { wrapper: createWrapper() });

    // Switch to list view
    const listViewButton = screen.getByTestId(/ListView/i, { exact: false }).closest('button');
    if (listViewButton) fireEvent.click(listViewButton);

    const startButton = screen.getAllByTestId(/StartIcon/i, { exact: false })[0].closest('button');
    if (startButton) fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockOnActivityUpdate).toHaveBeenCalledWith('activity-1', { status: 'in_progress' });
    });
  });

  it('allows completing in-progress activities', async () => {
    const inProgressActivities = mockActivities.map(a => 
      a.id === 'activity-1' ? { ...a, status: 'in_progress' as const } : a
    );

    render(
      <ActivityScheduler {...defaultProps} activities={inProgressActivities} />,
      { wrapper: createWrapper() }
    );

    // Switch to list view
    const listViewButton = screen.getByTestId(/ListView/i, { exact: false }).closest('button');
    if (listViewButton) fireEvent.click(listViewButton);

    const completeButton = screen.getByTestId(/CompleteIcon/i, { exact: false }).closest('button');
    if (completeButton) fireEvent.click(completeButton);

    await waitFor(() => {
      expect(mockOnActivityUpdate).toHaveBeenCalledWith('activity-1', { status: 'completed' });
    });
  });

  it('opens activity details dialog when clicked', async () => {
    render(<ActivityScheduler {...defaultProps} />, { wrapper: createWrapper() });

    // Switch to list view
    const listViewButton = screen.getByTestId(/ListView/i, { exact: false }).closest('button');
    if (listViewButton) fireEvent.click(listViewButton);

    const editButton = screen.getAllByTestId(/EditIcon/i, { exact: false })[0].closest('button');
    if (editButton) fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Classroom Observation')).toBeInTheDocument();
    });
  });

  it('allows adding new activities', async () => {
    render(<ActivityScheduler {...defaultProps} />, { wrapper: createWrapper() });

    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);

    // Fill form in dialog
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'New Activity' } });

    const descInput = screen.getByLabelText(/description/i);
    fireEvent.change(descInput, { target: { value: 'New activity description' } });

    const createButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockOnActivityAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Activity',
          description: 'New activity description',
        })
      );
    });
  });

  it('allows deleting activities', async () => {
    render(<ActivityScheduler {...defaultProps} />, { wrapper: createWrapper() });

    // Switch to list view
    const listViewButton = screen.getByTestId(/ListView/i, { exact: false }).closest('button');
    if (listViewButton) fireEvent.click(listViewButton);

    const deleteButton = screen.getAllByTestId(/DeleteIcon/i, { exact: false })[0].closest('button');
    if (deleteButton) fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockOnActivityDelete).toHaveBeenCalledWith('activity-1');
    });
  });

  it('switches between calendar, list, and grid views', () => {
    render(<ActivityScheduler {...defaultProps} />, { wrapper: createWrapper() });

    // Calendar view (default)
    expect(screen.getByRole('grid')).toBeInTheDocument(); // Calendar grid

    // Switch to list view
    const listViewButton = screen.getByTestId(/ListView/i, { exact: false }).closest('button');
    if (listViewButton) fireEvent.click(listViewButton);
    expect(screen.getByRole('list')).toBeInTheDocument();

    // Switch to grid view
    const gridViewButton = screen.getByTestId(/GridView/i, { exact: false }).closest('button');
    if (gridViewButton) fireEvent.click(gridViewButton);
    expect(screen.getAllByText('Classroom Observation')[0]).toBeInTheDocument();
  });

  it('displays activity materials count', () => {
    render(<ActivityScheduler {...defaultProps} />, { wrapper: createWrapper() });

    // Switch to grid view to see materials
    const gridViewButton = screen.getByTestId(/GridView/i, { exact: false }).closest('button');
    if (gridViewButton) fireEvent.click(gridViewButton);

    expect(screen.getByText(/materials.*1/i)).toBeInTheDocument();
  });

  it('manages reminders through reminder dialog', async () => {
    render(<ActivityScheduler {...defaultProps} />, { wrapper: createWrapper() });

    // Open activity details
    const listViewButton = screen.getByTestId(/ListView/i, { exact: false }).closest('button');
    if (listViewButton) fireEvent.click(listViewButton);

    const editButton = screen.getAllByTestId(/EditIcon/i, { exact: false })[0].closest('button');
    if (editButton) fireEvent.click(editButton);

    // Click manage reminders
    const reminderButton = await screen.findByText(/manage reminders/i);
    fireEvent.click(reminderButton);

    await waitFor(() => {
      expect(screen.getByText(/reminders/i)).toBeInTheDocument();
      expect(screen.getByText('Reminder: Classroom observation tomorrow')).toBeInTheDocument();
    });
  });

  it('disables actions in read-only mode', () => {
    render(<ActivityScheduler {...defaultProps} readOnly />, { wrapper: createWrapper() });

    expect(screen.queryByRole('button', { name: /add/i })).not.toBeInTheDocument();
    
    // Switch to list view
    const listViewButton = screen.getByTestId(/ListView/i, { exact: false }).closest('button');
    if (listViewButton) fireEvent.click(listViewButton);

    expect(screen.queryByTestId(/DeleteIcon/i)).not.toBeInTheDocument();
  });

  it('shows activity type icons correctly', () => {
    render(<ActivityScheduler {...defaultProps} />, { wrapper: createWrapper() });

    // Switch to list view
    const listViewButton = screen.getByTestId(/ListView/i, { exact: false }).closest('button');
    if (listViewButton) fireEvent.click(listViewButton);

    // Check for different activity type icons
    const listItems = screen.getAllByRole('listitem');
    expect(listItems.length).toBeGreaterThan(0);
  });
});