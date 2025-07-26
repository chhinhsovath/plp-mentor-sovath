import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Button,
  Space,
  Typography,
  Statistic,
  Badge,
  Tag,
  Progress,
  Alert,
  Segmented,
  Tooltip,
  Divider,
  Timeline,
  List,
  Avatar,
  Rate,
  Skeleton,
  Spin
} from 'antd';
import {
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  DotChartOutlined,
  AreaChartOutlined,
  RadarChartOutlined,
  HeatMapOutlined,
  FundOutlined,
  RiseOutlined,
  FallOutlined,
  SyncOutlined,
  CalendarOutlined,
  UserOutlined,
  BookOutlined,
  EnvironmentOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { Line, Column, Pie, Area, Gauge, Bar, Scatter, Radar, Heatmap, Funnel } from '@ant-design/plots';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import CountUp from 'react-countup';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Styled Components
const AnalyticsWrapper = styled.div`
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
`;

const MetricCard = styled(Card)`
  height: 100%;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.12);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.color || '#1890ff'};
  }
`;

const ChartCard = styled(Card)`
  height: 100%;
  .ant-card-head {
    border-bottom: 2px solid #f0f0f0;
  }
`;

const TrendIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  color: ${props => props.trend === 'up' ? '#52c41a' : '#ff4d4f'};
  
  .anticon {
    margin-right: 4px;
  }
`;

const FilterSection = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
`;

const InsightCard = styled(Card)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  
  .ant-card-body {
    padding: 20px;
  }
  
  .ant-statistic-title {
    color: rgba(255,255,255,0.9);
  }
  
  .ant-statistic-content {
    color: white;
  }
`;

// Loading component
const ChartLoadingSpinner = () => (
  <div style={{ textAlign: 'center', padding: '50px 0' }}>
    <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
  </div>
);

// Error boundary component
class AnalyticsErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Analytics error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Alert
          message="មានបញ្ហាក្នុងការបង្ហាញទិន្នន័យ"
          description="សូមព្យាយាមម្តងទៀត ឬទាក់ទងផ្នែកបច្ចេកទេស"
          type="error"
          showIcon
        />
      );
    }

    return this.props.children;
  }
}

const AnalyticsDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('overview');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      setChartLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [viewMode, refreshKey]);

  // Memoized data generators
  const generateTimeSeriesData = useCallback((days: number) => {
    const data = [];
    for (let i = 0; i < days; i++) {
      const date = dayjs().subtract(days - i - 1, 'day').format('YYYY-MM-DD');
      data.push({
        date,
        observations: Math.floor(Math.random() * 100) + 50,
        missions: Math.floor(Math.random() * 50) + 20,
        teachers: Math.floor(Math.random() * 80) + 40,
        students: Math.floor(Math.random() * 500) + 200
      });
    }
    return data;
  }, []);

  const generateProvincePerformance = useCallback(() => {
    const provinces = [
      { name: 'ភ្នំពេញ', performance: 85, growth: 12, schools: 45 },
      { name: 'កណ្តាល', performance: 78, growth: 8, schools: 38 },
      { name: 'កំពង់ចាម', performance: 72, growth: 15, schools: 42 },
      { name: 'សៀមរាប', performance: 80, growth: -2, schools: 35 },
      { name: 'បាត់ដំបង', performance: 75, growth: 5, schools: 30 },
      { name: 'កំពត', performance: 68, growth: 18, schools: 25 },
      { name: 'តាកែវ', performance: 70, growth: 10, schools: 28 },
      { name: 'ព្រៃវែង', performance: 65, growth: 22, schools: 22 }
    ];
    return provinces;
  }, []);

  const generateSubjectAnalysis = useCallback(() => {
    return [
      { subject: 'គណិតវិទ្យា', score: 75, improvement: 8, observations: 234 },
      { subject: 'ភាសាខ្មែរ', score: 82, improvement: 5, observations: 256 },
      { subject: 'វិទ្យាសាស្ត្រ', score: 68, improvement: 12, observations: 198 },
      { subject: 'សង្គមវិទ្យា', score: 78, improvement: 3, observations: 187 },
      { subject: 'អង់គ្លេស', score: 65, improvement: 15, observations: 165 }
    ];
  }, []);

  // Key Metrics
  const keyMetrics = {
    totalObservations: 4567,
    totalMissions: 892,
    activeTeachers: 1234,
    activeStudents: 45678,
    avgScore: 76.5,
    completionRate: 89.2,
    growthRate: 15.3,
    satisfactionRate: 92.8
  };

  // Memoized data
  const timeSeriesData = useMemo(() => generateTimeSeriesData(30), [generateTimeSeriesData, refreshKey]);
  const provinceData = useMemo(() => generateProvincePerformance(), [generateProvincePerformance, selectedProvince]);
  const subjectData = useMemo(() => generateSubjectAnalysis(), [generateSubjectAnalysis]);

  // Memoized chart configurations
  const timeSeriesConfig = useMemo(() => ({
    data: timeSeriesData.flatMap(item => [
      { date: item.date, type: 'ការសង្កេត', value: item.observations },
      { date: item.date, type: 'បេសកកម្ម', value: item.missions },
      { date: item.date, type: 'គ្រូបង្រៀន', value: item.teachers }
    ]),
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    autoFit: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    tooltip: {
      shared: true,
    },
    legend: {
      position: 'top' as const,
    },
  }), [timeSeriesData]);

  // Province performance radar chart - removed due to API compatibility issues
  const radarConfig = useMemo(() => ({
    data: provinceData.flatMap(p => [
      { item: 'ការអនុវត្ត', province: p.name, value: p.performance },
      { item: 'ការកើនឡើង', province: p.name, value: Math.max(0, p.growth + 50) },
      { item: 'ចំនួនសាលា', province: p.name, value: (p.schools / 45) * 100 }
    ]),
    xField: 'item',
    yField: 'value',
    seriesField: 'province',
    meta: {
      value: {
        min: 0,
        max: 100,
      },
    },
    area: {},
    point: {
      size: 2,
    },
  }), [provinceData]);

  // Subject performance column chart
  const subjectConfig = useMemo(() => ({
    data: subjectData,
    xField: 'subject',
    yField: 'score',
    color: (datum: any) => {
      if (datum.score >= 80) return '#52c41a';
      if (datum.score >= 70) return '#1890ff';
      if (datum.score >= 60) return '#faad14';
      return '#ff4d4f';
    },
    label: {
      position: 'top' as const,
      style: {
        fill: '#000',
      },
    },
    columnStyle: {
      radius: [20, 20, 0, 0],
    },
  }), [subjectData]);

  // Funnel chart for conversion
  const funnelConfig = {
    data: [
      { stage: 'គ្រូចុះឈ្មោះ', value: 1500 },
      { stage: 'គ្រូសកម្ម', value: 1234 },
      { stage: 'គ្រូបានវាយតម្លៃ', value: 980 },
      { stage: 'គ្រូលទ្ធផលល្អ', value: 745 },
      { stage: 'គ្រូឆ្នើម', value: 230 }
    ],
    xField: 'stage',
    yField: 'value',
    shape: 'pyramid',
    label: {
      formatter: (datum) => `${datum.stage}: ${datum.value}`,
    },
  };

  // Heatmap data - memoized for performance
  const generateHeatmapData = useCallback(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const days = ['ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍', 'អាទិត្យ'];
    const data = [];
    
    days.forEach(day => {
      hours.forEach(hour => {
        data.push({
          day,
          hour: `${hour}:00`,
          value: Math.floor(Math.random() * 100)
        });
      });
    });
    
    return data;
  }, []);

  const heatmapData = useMemo(() => generateHeatmapData(), [generateHeatmapData, refreshKey]);
  
  const heatmapConfig = useMemo(() => ({
    data: heatmapData,
    xField: 'hour',
    yField: 'day',
    colorField: 'value',
    color: ['#f0f0f0', '#1890ff', '#0050b3'],
    sizeField: 'value',
    shape: 'square',
    label: {
      style: {
        fill: '#fff',
        shadowBlur: 2,
        shadowColor: 'rgba(0, 0, 0, .45)',
      },
    },
  }), [heatmapData]);

  // Top performers data
  const topPerformers = [
    { name: 'សុខ សុភាព', role: 'អ្នកណែនាំ', score: 95, trend: 'up', change: 5 },
    { name: 'ចាន់ ដារា', role: 'គ្រូបង្រៀន', score: 92, trend: 'up', change: 8 },
    { name: 'ហេង សំណាង', role: 'នាយកសាលា', score: 90, trend: 'down', change: -2 },
    { name: 'លី សុខា', role: 'អ្នកណែនាំ', score: 88, trend: 'up', change: 12 },
    { name: 'ពៅ ច័ន្ទថា', role: 'គ្រូបង្រៀន', score: 87, trend: 'up', change: 3 }
  ];

  // Recent insights
  const insights = [
    {
      type: 'success',
      title: 'ការកើនឡើងការសង្កេត',
      description: 'ការសង្កេតកើនឡើង 23% ក្នុងសប្តាហ៍នេះធៀបនឹងសប្តាហ៍មុន',
      time: '2 ម៉ោងមុន'
    },
    {
      type: 'warning',
      title: 'តំបន់ត្រូវការការយកចិត្តទុកដាក់',
      description: 'ខេត្តកំពត់មានអត្រាបញ្ចប់ទាបជាង 60%',
      time: '5 ម៉ោងមុន'
    },
    {
      type: 'info',
      title: 'គោលដៅសម្រេចបាន',
      description: 'សម្រេចបាន 89% នៃគោលដៅត្រីមាសនេះ',
      time: '1 ថ្ងៃមុន'
    }
  ];

  const renderOverviewTab = () => (
    <>
      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <MetricCard color="#1890ff">
            <Statistic
              title="ការសង្កេតសរុប"
              value={keyMetrics.totalObservations}
              prefix={<BarChartOutlined />}
              formatter={(value) => <CountUp end={value as number} duration={2} />}
            />
            <TrendIndicator trend="up">
              <RiseOutlined /> 23% ពីខែមុន
            </TrendIndicator>
          </MetricCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <MetricCard color="#52c41a">
            <Statistic
              title="បេសកកម្មបានបញ្ចប់"
              value={keyMetrics.totalMissions}
              prefix={<CheckCircleOutlined />}
              formatter={(value) => <CountUp end={value as number} duration={2} />}
            />
            <Progress percent={keyMetrics.completionRate} size="small" showInfo={false} />
          </MetricCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <MetricCard color="#722ed1">
            <Statistic
              title="គ្រូបង្រៀនសកម្ម"
              value={keyMetrics.activeTeachers}
              prefix={<UserOutlined />}
              formatter={(value) => <CountUp end={value as number} duration={2} />}
            />
            <TrendIndicator trend="up">
              <RiseOutlined /> 15% កំណើន
            </TrendIndicator>
          </MetricCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <MetricCard color="#fa8c16">
            <Statistic
              title="ពិន្ទុមធ្យម"
              value={keyMetrics.avgScore}
              suffix="%"
              prefix={<TrophyOutlined />}
              precision={1}
            />
            <Rate disabled defaultValue={4} style={{ fontSize: 14 }} />
          </MetricCard>
        </Col>
      </Row>

      {/* Time Series Chart */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <ChartCard 
            title="និន្នាការសកម្មភាព (៣០ ថ្ងៃចុងក្រោយ)"
            extra={
              <Space>
                <Tag color="blue">ការសង្កេត</Tag>
                <Tag color="green">បេសកកម្ម</Tag>
                <Tag color="purple">គ្រូបង្រៀន</Tag>
              </Space>
            }
          >
            <AnalyticsErrorBoundary>
              {chartLoading ? (
                <ChartLoadingSpinner />
              ) : (
                <Line {...timeSeriesConfig} height={350} />
              )}
            </AnalyticsErrorBoundary>
          </ChartCard>
        </Col>
      </Row>

      {/* Performance Analysis */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <ChartCard title="ការវិភាគតាមមុខវិជ្ជា">
            <AnalyticsErrorBoundary>
              {chartLoading ? (
                <ChartLoadingSpinner />
              ) : (
                <Column {...subjectConfig} height={300} />
              )}
            </AnalyticsErrorBoundary>
          </ChartCard>
        </Col>
        <Col xs={24} lg={12}>
          <ChartCard title="ដំណើរការបំលែងគ្រូបង្រៀន">
            <AnalyticsErrorBoundary>
              {chartLoading ? (
                <ChartLoadingSpinner />
              ) : (
                <Funnel {...funnelConfig} height={300} />
              )}
            </AnalyticsErrorBoundary>
          </ChartCard>
        </Col>
      </Row>
    </>
  );

  const renderPerformanceTab = () => (
    <>
      {/* Province Performance Comparison */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <ChartCard title="ការប្រៀបធៀបការអនុវត្តតាមខេត្ត">
            <AnalyticsErrorBoundary>
              {chartLoading ? (
                <ChartLoadingSpinner />
              ) : (
                <Bar
                  data={provinceData}
                  xField="performance"
                  yField="name"
                  seriesField="name"
                  legend={false}
                  label={{
                    position: 'right',
                    formatter: (datum) => `${datum.performance}%`,
                  }}
                  height={400}
                />
              )}
            </AnalyticsErrorBoundary>
          </ChartCard>
        </Col>
      </Row>

      {/* Top Performers */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="អ្នកដឹកនាំល្អបំផុត" extra={<TrophyOutlined style={{ color: '#faad14' }} />}>
            <List
              dataSource={topPerformers}
              renderItem={(item, index) => (
                <List.Item
                  actions={[
                    <TrendIndicator trend={item.trend}>
                      {item.trend === 'up' ? <RiseOutlined /> : <FallOutlined />}
                      {item.change}%
                    </TrendIndicator>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar style={{ backgroundColor: index === 0 ? '#ffd700' : '#1890ff' }}>
                        {index + 1}
                      </Avatar>
                    }
                    title={item.name}
                    description={item.role}
                  />
                  <div>
                    <Progress 
                      percent={item.score} 
                      size="small" 
                      strokeColor={item.score >= 90 ? '#52c41a' : '#1890ff'}
                    />
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <InsightCard>
            <Title level={4} style={{ color: 'white', marginBottom: 20 }}>
              ការយល់ដឹងសំខាន់ៗ
            </Title>
            <Timeline
              items={insights.map(insight => ({
                color: insight.type === 'success' ? 'green' : insight.type === 'warning' ? 'orange' : 'blue',
                children: (
                  <div>
                    <Text strong style={{ color: 'white' }}>{insight.title}</Text>
                    <br />
                    <Text style={{ color: 'rgba(255,255,255,0.8)' }}>{insight.description}</Text>
                    <br />
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{insight.time}</Text>
                  </div>
                )
              }))}
            />
          </InsightCard>
        </Col>
      </Row>
    </>
  );

  const renderActivityTab = () => (
    <>
      {/* Activity Heatmap */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <ChartCard 
            title="ផែនទីកំដៅសកម្មភាព"
            extra={<Text type="secondary">សកម្មភាពតាមម៉ោង និងថ្ងៃ</Text>}
          >
            <AnalyticsErrorBoundary>
              {chartLoading ? (
                <ChartLoadingSpinner />
              ) : (
                <Heatmap {...heatmapConfig} height={400} />
              )}
            </AnalyticsErrorBoundary>
          </ChartCard>
        </Col>
      </Row>

      {/* Scatter Plot - Correlation Analysis */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <ChartCard title="ទំនាក់ទំនងរវាងការសង្កេត និងលទ្ធផល">
            <Scatter
              data={Array.from({ length: 50 }, () => ({
                observations: Math.floor(Math.random() * 100),
                score: Math.floor(Math.random() * 100)
              }))}
              xField="observations"
              yField="score"
              sizeField={5}
              shape="circle"
              color="#1890ff"
              xAxis={{
                title: { text: 'ចំនួនការសង្កេត' }
              }}
              yAxis={{
                title: { text: 'ពិន្ទុមធ្យម' }
              }}
              height={300}
            />
          </ChartCard>
        </Col>
        <Col xs={24} lg={12}>
          <ChartCard title="ការចែកចាយតាមតំបន់">
            <Pie
              data={generateProvincePerformance().map(p => ({
                type: p.name,
                value: p.schools
              }))}
              angleField="value"
              colorField="type"
              radius={0.8}
              label={{
                type: 'outer',
                content: '{name} {percentage}'
              }}
              interactions={[{ type: 'pie-legend-active' }, { type: 'element-active' }]}
              height={300}
            />
          </ChartCard>
        </Col>
      </Row>
    </>
  );

  const renderComparisonTab = () => (
    <>
      {/* Year over Year Comparison */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <ChartCard title="ការប្រៀបធៀបឆ្នាំនឹងឆ្នាំ">
            <Column
              data={[
                { month: 'មករា', year: '2023', value: 65 },
                { month: 'មករា', year: '2024', value: 78 },
                { month: 'កុម្ភៈ', year: '2023', value: 72 },
                { month: 'កុម្ភៈ', year: '2024', value: 85 },
                { month: 'មីនា', year: '2023', value: 68 },
                { month: 'មីនា', year: '2024', value: 82 },
                { month: 'មេសា', year: '2023', value: 75 },
                { month: 'មេសា', year: '2024', value: 88 },
                { month: 'ឧសភា', year: '2023', value: 70 },
                { month: 'ឧសភា', year: '2024', value: 92 },
              ]}
              xField="month"
              yField="value"
              seriesField="year"
              isGroup={true}
              columnStyle={{
                radius: [20, 20, 0, 0],
              }}
              height={350}
            />
          </ChartCard>
        </Col>
      </Row>

      {/* Gauge Charts for KPIs */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <ChartCard title="អត្រាបញ្ចប់">
            <Gauge
              percent={0.89}
              range={{ color: 'l(0) 0:#ff4d4f 0.5:#faad14 1:#52c41a' }}
              indicator={{
                pointer: { style: { stroke: '#D0D0D0' } },
                pin: { style: { stroke: '#D0D0D0' } },
              }}
              statistic={{
                content: {
                  style: { fontSize: '24px', lineHeight: '24px' },
                  formatter: () => '89%',
                },
              }}
              height={200}
            />
          </ChartCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <ChartCard title="ការពេញចិត្ត">
            <Gauge
              percent={0.93}
              range={{ color: 'l(0) 0:#ff4d4f 0.5:#faad14 1:#52c41a' }}
              indicator={{
                pointer: { style: { stroke: '#D0D0D0' } },
                pin: { style: { stroke: '#D0D0D0' } },
              }}
              statistic={{
                content: {
                  style: { fontSize: '24px', lineHeight: '24px' },
                  formatter: () => '93%',
                },
              }}
              height={200}
            />
          </ChartCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <ChartCard title="ប្រសិទ្ធភាព">
            <Gauge
              percent={0.76}
              range={{ color: 'l(0) 0:#ff4d4f 0.5:#faad14 1:#52c41a' }}
              indicator={{
                pointer: { style: { stroke: '#D0D0D0' } },
                pin: { style: { stroke: '#D0D0D0' } },
              }}
              statistic={{
                content: {
                  style: { fontSize: '24px', lineHeight: '24px' },
                  formatter: () => '76%',
                },
              }}
              height={200}
            />
          </ChartCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <ChartCard title="កំណើន">
            <Gauge
              percent={0.15}
              range={{ color: 'l(0) 0:#ff4d4f 0.5:#faad14 1:#52c41a' }}
              indicator={{
                pointer: { style: { stroke: '#D0D0D0' } },
                pin: { style: { stroke: '#D0D0D0' } },
              }}
              statistic={{
                content: {
                  style: { fontSize: '24px', lineHeight: '24px' },
                  formatter: () => '+15%',
                },
              }}
              height={200}
            />
          </ChartCard>
        </Col>
      </Row>
    </>
  );

  if (loading) {
    return (
      <AnalyticsWrapper>
        <Skeleton active paragraph={{ rows: 10 }} />
      </AnalyticsWrapper>
    );
  }

  return (
    <AnalyticsWrapper>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <PieChartOutlined /> ផ្ទាំងគ្រប់គ្រងការវិភាគ
          </Title>
          <Text type="secondary">
            ទិដ្ឋភាពទូទៅនៃការអនុវត្ត និងការវិភាគទិន្នន័យ
          </Text>
        </Col>
        <Col>
          <Space>
            <Button 
              icon={<SyncOutlined spin={chartLoading} />}
              onClick={() => {
                setChartLoading(true);
                setRefreshKey(prev => prev + 1);
              }}
              disabled={chartLoading}
            >
              ធ្វើបច្ចុប្បន្នភាព
            </Button>
            <Button type="primary" icon={<LineChartOutlined />}>
              ទាញយករបាយការណ៍
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Filter Section */}
      <FilterSection>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">ជ្រើសរើសកាលបរិច្ឆេទ</Text>
              <RangePicker
                value={dateRange}
                onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
              />
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">ខេត្ត/រាជធានី</Text>
              <Select
                value={selectedProvince}
                onChange={setSelectedProvince}
                style={{ width: '100%' }}
                placeholder="ជ្រើសរើសខេត្ត"
              >
                <Option value="all">ទាំងអស់</Option>
                <Option value="phnom-penh">ភ្នំពេញ</Option>
                <Option value="kandal">កណ្តាល</Option>
                <Option value="kampong-cham">កំពង់ចាម</Option>
                <Option value="siem-reap">សៀមរាប</Option>
                <Option value="battambang">បាត់ដំបង</Option>
              </Select>
            </Space>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">ទិដ្ឋភាព</Text>
              <Segmented
                value={viewMode}
                onChange={setViewMode}
                options={[
                  { label: 'ទិដ្ឋភាពទូទៅ', value: 'overview', icon: <DotChartOutlined /> },
                  { label: 'ការអនុវត្ត', value: 'performance', icon: <BarChartOutlined /> },
                  { label: 'សកម្មភាព', value: 'activity', icon: <HeatMapOutlined /> },
                  { label: 'ការប្រៀបធៀប', value: 'comparison', icon: <FundOutlined /> }
                ]}
                block
              />
            </Space>
          </Col>
        </Row>
      </FilterSection>

      {/* Content based on view mode */}
      {viewMode === 'overview' && renderOverviewTab()}
      {viewMode === 'performance' && renderPerformanceTab()}
      {viewMode === 'activity' && renderActivityTab()}
      {viewMode === 'comparison' && renderComparisonTab()}

      {/* Quick Stats Footer */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Alert
            message="សមិទ្ធផលសំខាន់ៗប្រចាំសប្តាហ៍"
            description={
              <Space size="large">
                <span><CheckCircleOutlined /> ការសង្កេតកើនឡើង 23%</span>
                <span><TrophyOutlined /> 15 គ្រូទទួលបានពានរង្វាន់</span>
                <span><ThunderboltOutlined /> 92% អត្រាការពេញចិត្ត</span>
                <span><RiseOutlined /> គោលដៅសម្រេចបាន 89%</span>
              </Space>
            }
            type="success"
            showIcon
            closable
          />
        </Col>
      </Row>
    </AnalyticsWrapper>
  );
};

export default AnalyticsDashboardPage;