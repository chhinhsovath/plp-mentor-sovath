import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Dashboard from '../Dashboard';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n/i18n';

// Mock the recharts library
vi.mock('recharts', () => {
  const OriginalModule = vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    LineChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="line-chart">{children}</div>
    ),
    Line: () => <div data-testid="line" />,
    BarChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="bar-chart">{children}</div>
    ),
    Bar: () => <div data-testid="bar" />,
    PieChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="pie-chart">{children}</div>
    ),
    Pie: () => <div data-testid="pie" />,
    Cell: () => <div data-testid="cell" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
    RadarChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="radar-chart">{children}</div>
    ),
    Radar: () => <div data-testid="radar" />,
    PolarGrid: () => <div data-testid="polar-grid" />,
    PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
    PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
    AreaChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="area-chart">{children}</div>
    ),
    Area: () => <div data-testid="area" />,
  };
});

describe('Dashboard Component', () => {
  const mockFilter = {
    timeRange: { preset: 'month' as const, startDate: '', endDate: '' },
  };

  const mockOnFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders dashboard with metrics section', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Dashboard initialFilter={mockFilter} onFilterChange={mockOnFilterChange} />
      </I18nextProvider>
    );

    // Check if metrics section is rendered
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0);
  });

  test('handles refresh button click', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Dashboard initialFilter={mockFilter} onFilterChange={mockOnFilterChange} />
      </I18nextProvider>
    );

    // Find and click refresh button
    const refreshButton = screen.getByLabelText(/refresh/i);
    fireEvent.click(refreshButton);

    // Wait for refresh to complete
    await waitFor(() => {
      expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0);
    });
  });

  test('toggles filter panel', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Dashboard initialFilter={mockFilter} onFilterChange={mockOnFilterChange} />
      </I18nextProvider>
    );

    // Find and click filter button
    const filterButton = screen.getByLabelText(/filter/i);
    fireEvent.click(filterButton);

    // Check if filter panel is shown
    expect(screen.getByText(/filter.title/i)).toBeInTheDocument();

    // Close filter panel
    const closeButton = screen.getByLabelText(/close/i);
    fireEvent.click(closeButton);
  });

  test('renders charts correctly', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Dashboard initialFilter={mockFilter} onFilterChange={mockOnFilterChange} />
      </I18nextProvider>
    );

    // Check if charts are rendered
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('line-chart').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThan(0);
  });
});