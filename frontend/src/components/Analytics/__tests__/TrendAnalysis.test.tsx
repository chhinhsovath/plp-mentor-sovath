import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import TrendAnalysis from '../TrendAnalysis';
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
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
    AreaChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="area-chart">{children}</div>
    ),
    Area: () => <div data-testid="area" />,
    Brush: () => <div data-testid="brush" />,
    ReferenceLine: () => <div data-testid="reference-line" />,
  };
});

describe('TrendAnalysis Component', () => {
  const mockData = [
    { date: '2024-01-01', observations: 10, avgScore: 3.2, completionRate: 85 },
    { date: '2024-02-01', observations: 15, avgScore: 3.4, completionRate: 87 },
    { date: '2024-03-01', observations: 12, avgScore: 3.3, completionRate: 86 },
    { date: '2024-04-01', observations: 18, avgScore: 3.5, completionRate: 90 },
    { date: '2024-05-01', observations: 20, avgScore: 3.6, completionRate: 92 },
  ];

  const mockMetrics = ['observations', 'avgScore', 'completionRate'];
  const mockOnMetricChange = vi.fn();
  const mockOnPeriodChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders trend analysis with data', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <TrendAnalysis
          data={mockData}
          metrics={mockMetrics}
          onMetricChange={mockOnMetricChange}
          onPeriodChange={mockOnPeriodChange}
        />
      </I18nextProvider>
    );

    // Check if chart is rendered
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  test('renders loading state correctly', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <TrendAnalysis
          data={mockData}
          metrics={mockMetrics}
          loading={true}
          onMetricChange={mockOnMetricChange}
          onPeriodChange={mockOnPeriodChange}
        />
      </I18nextProvider>
    );

    // Check if loading state is shown
    expect(screen.getByText(/common.loading/i)).toBeInTheDocument();
  });

  test('renders error state correctly', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <TrendAnalysis
          data={mockData}
          metrics={mockMetrics}
          error="Test error message"
          onMetricChange={mockOnMetricChange}
          onPeriodChange={mockOnPeriodChange}
        />
      </I18nextProvider>
    );

    // Check if error message is shown
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  test('changes chart type when buttons are clicked', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <TrendAnalysis
          data={mockData}
          metrics={mockMetrics}
          onMetricChange={mockOnMetricChange}
          onPeriodChange={mockOnPeriodChange}
        />
      </I18nextProvider>
    );

    // Initially, line chart should be rendered
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();

    // Find and click bar chart button
    const barChartButton = screen.getByLabelText(/chart.bar/i);
    fireEvent.click(barChartButton);

    // Bar chart should be rendered
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();

    // Find and click area chart button
    const areaChartButton = screen.getByLabelText(/chart.area/i);
    fireEvent.click(areaChartButton);

    // Area chart should be rendered
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  test('changes period when period buttons are clicked', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <TrendAnalysis
          data={mockData}
          metrics={mockMetrics}
          onMetricChange={mockOnMetricChange}
          onPeriodChange={mockOnPeriodChange}
        />
      </I18nextProvider>
    );

    // Find and click weekly period button
    const weeklyButton = screen.getByText(/trend.weekly/i);
    fireEvent.click(weeklyButton);

    // onPeriodChange should be called with 'weekly'
    expect(mockOnPeriodChange).toHaveBeenCalledWith('weekly');

    // Find and click monthly period button
    const monthlyButton = screen.getByText(/trend.monthly/i);
    fireEvent.click(monthlyButton);

    // onPeriodChange should be called with 'monthly'
    expect(mockOnPeriodChange).toHaveBeenCalledWith('monthly');
  });
});