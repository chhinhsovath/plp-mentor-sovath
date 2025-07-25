export interface DashboardMetrics {
  totalObservations: number;
  totalTeachers: number;
  totalSchools: number;
  totalMentors: number;
  avgObservationScore: number;
  improvementRate: number;
  activeImprovementPlans: number;
  completedActivities: number;
  pendingActivities: number;
  overallProgress: number;
}

export interface ObservationTrend {
  date: string;
  count: number;
  avgScore: number;
  completedCount: number;
  pendingCount: number;
}

export interface TeacherPerformance {
  teacherId: string;
  teacherName: string;
  schoolId: string;
  schoolName: string;
  totalObservations: number;
  avgScore: number;
  improvementRate: number;
  lastObservationDate: string;
  strengths: string[];
  areasForImprovement: string[];
  activePlans: number;
  completedPlans: number;
}

export interface SchoolPerformance {
  schoolId: string;
  schoolName: string;
  district: string;
  province: string;
  totalTeachers: number;
  totalObservations: number;
  avgScore: number;
  topPerformers: TeacherPerformance[];
  needsSupport: TeacherPerformance[];
  improvementTrend: number;
}

export interface IndicatorAnalysis {
  indicatorId: string;
  indicatorCode: string;
  indicatorDescription: string;
  avgScore: number;
  scoreDistribution: {
    excellent: number;
    good: number;
    satisfactory: number;
    needsImprovement: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  trendPercentage: number;
}

export interface SubjectAnalysis {
  subject: string;
  totalObservations: number;
  avgScore: number;
  topIndicators: IndicatorAnalysis[];
  weakIndicators: IndicatorAnalysis[];
  improvementRate: number;
}

export interface GradeLevelAnalysis {
  gradeLevel: string;
  totalObservations: number;
  avgScore: number;
  subjectBreakdown: SubjectAnalysis[];
  commonChallenges: string[];
  bestPractices: string[];
}

export interface TimeRangeFilter {
  startDate: string;
  endDate: string;
  preset?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

export interface DashboardFilter {
  timeRange: TimeRangeFilter;
  schoolIds?: string[];
  teacherIds?: string[];
  mentorIds?: string[];
  subjects?: string[];
  gradeLevels?: string[];
  provinces?: string[];
  districts?: string[];
  observationStatus?: ('draft' | 'completed' | 'approved')[];
  planStatus?: ('active' | 'completed' | 'cancelled')[];
}

export interface ReportConfig {
  id: string;
  name: string;
  type: 'summary' | 'detailed' | 'comparison' | 'trend' | 'custom';
  filters: DashboardFilter;
  sections: ReportSection[];
  format: 'pdf' | 'excel' | 'csv' | 'json';
  schedule?: ReportSchedule;
  recipients?: string[];
}

export interface ReportSection {
  id: string;
  type: 'metrics' | 'chart' | 'table' | 'text' | 'comparison';
  title: string;
  titleKh?: string;
  data?: any;
  config?: any;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  enabled: boolean;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'donut' | 'area' | 'scatter' | 'radar' | 'heatmap';
  title: string;
  titleKh?: string;
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  legend?: LegendConfig;
  colors?: string[];
  stacked?: boolean;
  showValues?: boolean;
  animation?: boolean;
}

export interface AxisConfig {
  label: string;
  labelKh?: string;
  type?: 'category' | 'value' | 'time';
  format?: string;
  min?: number;
  max?: number;
}

export interface LegendConfig {
  show: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  align: 'left' | 'center' | 'right';
}

export interface DataPoint {
  x: string | number | Date;
  y: number;
  label?: string;
  category?: string;
  metadata?: any;
}

export interface ChartSeries {
  name: string;
  nameKh?: string;
  data: DataPoint[];
  color?: string;
  type?: string;
}

export interface HeatmapData {
  x: string;
  y: string;
  value: number;
  label?: string;
}

export interface ComparisonData {
  category: string;
  current: number;
  previous: number;
  target?: number;
  change: number;
  changePercentage: number;
}

export interface DrillDownConfig {
  enabled: boolean;
  levels: DrillDownLevel[];
  onDrillDown?: (level: string, value: any) => void;
}

export interface DrillDownLevel {
  name: string;
  field: string;
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  chartType?: string;
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'png' | 'json';
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'A3' | 'Letter' | 'Legal';
  includeCharts?: boolean;
  includeRawData?: boolean;
  compression?: boolean;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  columns: number;
  spacing: number;
  responsive: boolean;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'map' | 'filter' | 'text';
  title: string;
  titleKh?: string;
  position: WidgetPosition;
  size: WidgetSize;
  config: any;
  refreshInterval?: number;
  interactive?: boolean;
}

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface AlertConfig {
  id: string;
  name: string;
  condition: AlertCondition;
  threshold: number;
  comparison: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
  actions: AlertAction[];
  enabled: boolean;
}

export interface AlertCondition {
  metric: string;
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  timeWindow: string;
  filters?: DashboardFilter;
}

export interface AlertAction {
  type: 'email' | 'sms' | 'push' | 'webhook';
  recipients: string[];
  message: string;
  messageKh?: string;
}

export interface BenchmarkData {
  category: string;
  value: number;
  benchmark: number;
  percentile: number;
  rank?: number;
  total?: number;
}