import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import { I18nextProvider } from 'react-i18next';
import { RubricSelector } from '../index';
import { Indicator } from '../../../types/observation';
import { theme } from '../../../theme/theme';
import i18n from '../../../i18n/i18n';

const mockIndicator: Indicator = {
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
    {
      id: 'rub-3',
      level: 'satisfactory',
      levelValue: 2,
      description: 'Greets some students',
      descriptionKh: 'ស្វាគមន៍សិស្សខ្លះ',
      indicatorId: 'ind-1',
    },
    {
      id: 'rub-4',
      level: 'needs_improvement',
      levelValue: 1,
      description: 'Minimal greeting',
      descriptionKh: 'ការស្វាគមន៍តិចតួច',
      indicatorId: 'ind-1',
    },
  ],
};

const mockBinaryIndicator: Indicator = {
  ...mockIndicator,
  rubrics: [
    {
      id: 'rub-yes',
      level: 'excellent',
      levelValue: 1,
      description: 'Yes',
      descriptionKh: 'បាទ/ចាស',
      indicatorId: 'ind-2',
    },
    {
      id: 'rub-no',
      level: 'needs_improvement',
      levelValue: 0,
      description: 'No',
      descriptionKh: 'ទេ',
      indicatorId: 'ind-2',
    },
  ],
};

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={theme}>
      <I18nextProvider i18n={i18n}>
        {children}
      </I18nextProvider>
    </ThemeProvider>
  );
};

describe('RubricSelector', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all rubric options', () => {
    render(
      <RubricSelector
        indicator={mockIndicator}
        onChange={mockOnChange}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Greets all students warmly')).toBeInTheDocument();
    expect(screen.getByText('Greets most students')).toBeInTheDocument();
    expect(screen.getByText('Greets some students')).toBeInTheDocument();
    expect(screen.getByText('Minimal greeting')).toBeInTheDocument();
  });

  it('renders binary options as toggle buttons', () => {
    render(
      <RubricSelector
        indicator={mockBinaryIndicator}
        onChange={mockOnChange}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument();
  });

  it('calls onChange when a rubric is selected', () => {
    render(
      <RubricSelector
        indicator={mockIndicator}
        onChange={mockOnChange}
      />,
      { wrapper: createWrapper() }
    );

    const excellentOption = screen.getByLabelText(/greets all students warmly/i);
    fireEvent.click(excellentOption);

    expect(mockOnChange).toHaveBeenCalledWith('rub-1', 4);
  });

  it('shows selected rubric', () => {
    render(
      <RubricSelector
        indicator={mockIndicator}
        selectedRubricId="rub-2"
        selectedScore={3}
        onChange={mockOnChange}
      />,
      { wrapper: createWrapper() }
    );

    const goodOption = screen.getByLabelText(/greets most students/i) as HTMLInputElement;
    expect(goodOption.checked).toBe(true);
  });

  it('renders with error styling when error prop is true', () => {
    render(
      <RubricSelector
        indicator={mockIndicator}
        onChange={mockOnChange}
        error={true}
      />,
      { wrapper: createWrapper() }
    );

    const formControl = screen.getByRole('radiogroup').parentElement;
    expect(formControl).toHaveClass('Mui-error');
  });

  it('renders in vertical layout for mobile', () => {
    render(
      <RubricSelector
        indicator={mockIndicator}
        onChange={mockOnChange}
        layout="vertical"
      />,
      { wrapper: createWrapper() }
    );

    // Check that radio group is not in row mode
    const radioGroup = screen.getByRole('radiogroup');
    expect(radioGroup).not.toHaveClass('MuiFormGroup-row');
  });

  it('displays score chips with correct colors', () => {
    render(
      <RubricSelector
        indicator={mockIndicator}
        onChange={mockOnChange}
      />,
      { wrapper: createWrapper() }
    );

    // Check for score chips
    expect(screen.getByText('4 - Excellent')).toBeInTheDocument();
    expect(screen.getByText('3 - Good')).toBeInTheDocument();
    expect(screen.getByText('2 - Satisfactory')).toBeInTheDocument();
    expect(screen.getByText('1 - Needs Improvement')).toBeInTheDocument();
  });

  it('handles toggle button selection for binary indicators', () => {
    render(
      <RubricSelector
        indicator={mockBinaryIndicator}
        onChange={mockOnChange}
      />,
      { wrapper: createWrapper() }
    );

    const yesButton = screen.getByRole('button', { name: /yes/i });
    fireEvent.click(yesButton);

    expect(mockOnChange).toHaveBeenCalledWith('rub-yes', 1);
  });
});