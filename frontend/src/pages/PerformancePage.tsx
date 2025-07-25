import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Progress, 
  Select, 
  DatePicker, 
  Typography, 
  Space, 
  Tag,
  Tabs,
  Alert,
  Spin,
  Button,
  Tooltip,
  Input,
  Radio,
  Divider,
  message,
  Empty
} from 'antd'
import {
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  UserOutlined,
  BookOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SyncOutlined,
  DownloadOutlined,
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  DotChartOutlined,
  ExportOutlined,
  FileExcelOutlined,
  FilePdfOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { Line, Column, Pie, Area, Heatmap } from '@ant-design/charts'
import './PerformancePage.css'
import type { ColumnsType } from 'antd/es/table'
import analyticsService from '../services/analytics.service'
import { formatDate } from '../utils/dateUtils'
import type { PerformanceMetrics, TeacherPerformance, SchoolPerformance } from '../types/analytics'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { RangePicker } = DatePicker
// const { TabPane } = Tabs // Deprecated - using items prop instead
const { Search } = Input

interface PerformanceFilters {
  dateRange: [Date, Date] | null
  schoolId?: string
  teacherId?: string
  subject?: string
  grade?: string
  province?: string
  searchText?: string
}

interface ChartData {
  month: string
  score: number
  trend?: 'up' | 'down' | 'stable'
}

interface SubjectData {
  subject: string
  score: number
  target: number
  improvement: number
}

interface HeatmapData {
  school: string
  month: string
  value: number
}

type ChartType = 'line' | 'column' | 'area'

// Error boundary class for catching chart rendering errors
class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    console.error('Chart error boundary caught:', error)
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart error details:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {this.props.fallback || <Empty description="មិនអាចបង្ហាញបន្ទាត់ក្រាហ្វិក" />}
        </div>
      )
    }

    return this.props.children
  }
}

const PerformancePage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [teacherPerformance, setTeacherPerformance] = useState<TeacherPerformance[]>([])
  const [schoolPerformance, setSchoolPerformance] = useState<SchoolPerformance[]>([])
  const [filteredTeachers, setFilteredTeachers] = useState<TeacherPerformance[]>([])
  const [filteredSchools, setFilteredSchools] = useState<SchoolPerformance[]>([])
  const [filters, setFilters] = useState<PerformanceFilters>({
    dateRange: null
  })
  const [chartType, setChartType] = useState<ChartType>('line')
  const [activeTab, setActiveTab] = useState('overview')
  const [exportLoading, setExportLoading] = useState(false)

  // Table columns configuration
  const teacherColumns: ColumnsType<TeacherPerformance> = [
    {
      title: 'ឈ្មោះគ្រូបង្រៀន',
      dataIndex: 'teacherName',
      key: 'teacherName',
      width: 200,
      sorter: (a, b) => a.teacherName.localeCompare(b.teacherName),
    },
    {
      title: 'ឈ្មោះសាលារៀន',
      dataIndex: 'schoolName',
      key: 'schoolName',
      width: 180,
    },
    {
      title: 'មុខវិជ្ជា',
      dataIndex: 'subject',
      key: 'subject',
      width: 120,
      render: (subject: string) => <Tag color="blue">{subject}</Tag>,
    },
    {
      title: 'ការសង្កេតដែលបានបញ្ចប់',
      dataIndex: 'completedObservations',
      key: 'completedObservations',
      width: 100,
      align: 'center',
      sorter: (a, b) => a.completedObservations - b.completedObservations,
    },
    {
      title: 'ពិន្ទុមធ្យម',
      dataIndex: 'averageScore',
      key: 'averageScore',
      width: 100,
      align: 'center',
      render: (score: number) => `${score}%`,
      sorter: (a, b) => a.averageScore - b.averageScore,
    },
    {
      title: 'ទិន្នន័យ',
      dataIndex: 'trend',
      key: 'trend',
      width: 80,
      align: 'center',
      render: (trend: 'up' | 'down') => (
        trend === 'up' ? 
          <RiseOutlined style={{ color: '#52c41a' }} /> : 
          <FallOutlined style={{ color: '#ff4d4f' }} />
      ),
    },
    {
      title: 'ការសង្កេតចុងក្រោយ',
      dataIndex: 'lastObservation',
      key: 'lastObservation',
      width: 120,
      render: (date: Date) => formatDate(date),
      sorter: (a, b) => a.lastObservation.getTime() - b.lastObservation.getTime(),
    },
    {
      title: 'សកម្មភាព',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} size="small" />
        </Space>
      ),
    },
  ]

  const schoolColumns: ColumnsType<SchoolPerformance> = [
    {
      title: 'ឈ្មោះសាលារៀន',
      dataIndex: 'schoolName',
      key: 'schoolName',
      width: 200,
      sorter: (a, b) => a.schoolName.localeCompare(b.schoolName),
    },
    {
      title: 'ខេត្ត',
      dataIndex: 'province',
      key: 'province',
      width: 120,
      render: (province: string) => <Tag color="green">{province}</Tag>,
    },
    {
      title: 'គ្រូបង្រៀនសរុប',
      dataIndex: 'totalTeachers',
      key: 'totalTeachers',
      width: 100,
      align: 'center',
      sorter: (a, b) => a.totalTeachers - b.totalTeachers,
    },
    {
      title: 'ការសង្កេតសរុប',
      dataIndex: 'totalObservations',
      key: 'totalObservations',
      width: 120,
      align: 'center',
      sorter: (a, b) => a.totalObservations - b.totalObservations,
    },
    {
      title: 'អត្រាបញ្ចប់',
      dataIndex: 'completionRate',
      key: 'completionRate',
      width: 120,
      align: 'center',
      render: (rate: number) => (
        <Progress 
          percent={rate} 
          size="small" 
          status={rate > 80 ? 'success' : rate > 60 ? 'active' : 'exception'}
        />
      ),
      sorter: (a, b) => a.completionRate - b.completionRate,
    },
    {
      title: 'ពិន្ទុមធ្យម',
      dataIndex: 'averageScore',
      key: 'averageScore',
      width: 100,
      align: 'center',
      render: (score: number) => `${score}%`,
      sorter: (a, b) => a.averageScore - b.averageScore,
    },
    {
      title: 'សកម្មភាព',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} size="small" />
        </Space>
      ),
    },
  ]

  // Mock data generation
  const generateMockTeacherData = useCallback((): TeacherPerformance[] => {
    const teachers = [
      { name: 'លោកគ្រូ សុខា', school: 'សាលាបឋម អាកាស', subject: 'គណិតវិទ្យា' },
      { name: 'លោកគ្រូស្រី ចន្ទា', school: 'សាលាបឋម រស្មី', subject: 'ភាសាខ្មែរ' },
      { name: 'លោកគ្រូ ធារា', school: 'សាលាបឋម ភ្នំពេញ', subject: 'វិទ្យាសាស្ត្រ' },
      { name: 'លោកគ្រូស្រី សុផា', school: 'សាលាបឋម បាទដំបង', subject: 'សិក្សាសង្គម' },
      { name: 'លោកគ្រូ រតនា', school: 'សាលាបឋម កំពត', subject: 'ភាសាអង់គ្លេស' }
    ]

    return teachers.map((teacher, index) => ({
      id: `teacher-${index}`,
      teacherName: teacher.name,
      schoolName: teacher.school,
      subject: teacher.subject,
      completedObservations: Math.floor(Math.random() * 15) + 5,
      averageScore: Math.floor(Math.random() * 30) + 65,
      lastObservation: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      trend: Math.random() > 0.5 ? 'up' : 'down' as 'up' | 'down'
    }))
  }, [])

  const generateMockSchoolData = useCallback((): SchoolPerformance[] => {
    const schools = [
      'សាលាបឋម អាកាស', 'សាលាបឋម រស្មី', 'សាលាបឋម ភ្នំពេញ', 
      'សាលាបឋម បាទដំបង', 'សាលាបឋម កំពត', 'សាលាបឋម សៀមរាប'
    ]

    return schools.map((school, index) => ({
      id: `school-${index}`,
      schoolName: school,
      totalTeachers: Math.floor(Math.random() * 30) + 15,
      totalObservations: Math.floor(Math.random() * 100) + 50,
      completionRate: Math.floor(Math.random() * 40) + 60,
      averageScore: Math.floor(Math.random() * 35) + 60,
      province: ['ភ្នំពេញ', 'បាទដំបង', 'កំពត', 'សៀមរាប'][Math.floor(Math.random() * 4)]
    }))
  }, [])

  // Safe chart wrapper that handles renderer plugin errors
  const SafeChartWrapper: React.FC<{ 
    children: React.ReactNode; 
    fallback?: React.ReactNode;
    title: string;
  }> = ({ children, fallback, title }) => {
    const [showFallback, setShowFallback] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      // Temporarily disable charts due to @ant-design/charts renderer plugin issues
      // Show fallback content instead to prevent crashes
      setShowFallback(true)
    }, [])

    if (showFallback) {
      return (
        <div style={{ 
          height: 300, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          border: '1px dashed #d9d9d9',
          borderRadius: '6px',
          backgroundColor: '#fafafa'
        }}>
          <BarChartOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
          <Text type="secondary" style={{ fontSize: '16px', marginBottom: '8px' }}>
            {title}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ក្រាហ្វិកនឹងបង្ហាញនៅក្នុងការអាប់ដេតបន្ទាប់
          </Text>
        </div>
      )
    }

    return (
      <div ref={containerRef} style={{ height: 300, width: '100%' }}>
        <ChartErrorBoundary fallback={fallback || <Empty description="មិនអាចបង្ហាញបន្ទាត់ក្រាហ្វិក" />}>
          {children}
        </ChartErrorBoundary>
      </div>
    )
  }

  // Chart configuration helpers
  const renderChart = () => {
    return (
      <SafeChartWrapper title="ការវិភាគនិន្នាការ">
        <div>Chart content temporarily disabled</div>
      </SafeChartWrapper>
    )
  }

  const renderSubjectChart = () => {
    return (
      <SafeChartWrapper title="ការអនុវត្តតាមមុខវិជ្ជា">
        <div>Chart content temporarily disabled</div>
      </SafeChartWrapper>
    )
  }

  const renderRecentActivity = () => {
    return (
      <div style={{ height: 300, overflow: 'auto' }}>
        <Empty description="គ្មានសកម្មភាពថ្មីៗ" />
      </div>
    )
  }

  const renderBestPractices = () => {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {[1, 2, 3].map(i => (
          <Alert
            key={i}
            message={`ការអនុវត្តល្អទី ${i}`}
            description="លោកគ្រូបានប្រើប្រាស់វិធីសាស្ត្របង្រៀនថ្មីៗ"
            type="success"
            showIcon
          />
        ))}
      </Space>
    )
  }

  const renderImprovementAreas = () => {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {[1, 2, 3].map(i => (
          <Alert
            key={i}
            message={`ចំណុចត្រូវកែលម្អទី ${i}`}
            description="ត្រូវការការពង្រឹងបន្ថែមលើវិធីសាស្ត្របង្រៀន"
            type="warning"
            showIcon
          />
        ))}
      </Space>
    )
  }

  const renderProvinceComparison = () => {
    return (
      <SafeChartWrapper title="ការប្រៀបធៀបតាមខេត្ត">
        <div>Chart content temporarily disabled</div>
      </SafeChartWrapper>
    )
  }

  const renderRecommendations = () => {
    return (
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Paragraph>
          <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
          បន្តការប្រើប្រាស់វិធីសាស្ត្របង្រៀនដែលមានប្រសិទ្ធភាព
        </Paragraph>
        <Paragraph>
          <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
          ពង្រឹងការសហការរវាងគ្រូបង្រៀននិងអ្នកណែនាំ
        </Paragraph>
        <Paragraph>
          <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
          ផ្តោតលើការកែលម្អមុខវិជ្ជាដែលមានពិន្ទុទាប
        </Paragraph>
      </Space>
    )
  }

  const renderHeatmap = () => {
    const data: HeatmapData[] = []
    const schools = ['សាលា A', 'សាលា B', 'សាలា C', 'សាលា D']
    const months = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា']
    
    schools.forEach(school => {
      months.forEach(month => {
        data.push({
          school,
          month,
          value: Math.floor(Math.random() * 100)
        })
      })
    })

    const config = {
      data,
      xField: 'month',
      yField: 'school',
      colorField: 'value',
      height: 300,
      autoFit: true,
      renderer: 'canvas' as const,
      appendPadding: [10, 10, 10, 10],
      color: ['#174c83', '#7eb6d4', '#efefeb', '#efa759', '#9b4d16'],
      meta: {
        value: {
          min: 0,
          max: 100,
        },
      },
    }

    return (
      <SafeChartWrapper title="ផែនទីកំដៅនៃការអនុវត្ត">
        <div>Chart content temporarily disabled</div>
      </SafeChartWrapper>
    )
  }

  const renderTimeAnalysis = () => {
    return (
      <SafeChartWrapper title="ការវិភាគតាមពេលវេលា">
        <div>Chart content temporarily disabled</div>
      </SafeChartWrapper>
    )
  }

  const renderKeyMetrics = () => {
    return (
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Text type="secondary">ការសង្កេតការណ៍សរុប</Text>
          <Title level={3}>1,234</Title>
        </div>
        <div>
          <Text type="secondary">គ្រូបង្រៀនសកម្ម</Text>
          <Title level={3}>567</Title>
        </div>
        <div>
          <Text type="secondary">សាលារៀនចូលរួម</Text>
          <Title level={3}>89</Title>
        </div>
      </Space>
    )
  }

  const renderSubjectDistribution = () => {
    return (
      <SafeChartWrapper title="ការចែកចាយតាមមុខវិជ្ជា">
        <div>Chart content temporarily disabled</div>
      </SafeChartWrapper>
    )
  }

  // Tab items for the refactored Tabs component
  const tabItems = [
    {
      key: 'overview',
      label: 'ទិដ្ឋភាពទូទៅ',
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card 
              title="ការវិភាគនិន្នាការ" 
              variant="borderless"
              extra={
                <Tooltip title="ជ្រើសរើសរយៈពេលសម្រាប់ការវិភាគតាមខែ">
                  <Select 
                    defaultValue="6months" 
                    style={{ width: 120 }}
                    options={[
                      { value: '1month', label: 'ខែមុន' },
                      { value: '3months', label: '៣ខែមុន' },
                      { value: '6months', label: '៦ខែមុន' },
                      { value: '12months', label: 'ឆ្នាំមុន' }
                    ]}
                  />
                </Tooltip>
              }
            >
              {renderChart()}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card 
              title="ការអនុវត្តតាមមុខវិជ្ជា" 
              variant="borderless"
              extra={
                <Tooltip title="ការវិភាគតាមមុខវិជ្ជា">
                  <DotChartOutlined />
                </Tooltip>
              }
            >
              {renderSubjectChart()}
            </Card>
          </Col>
          <Col xs={24}>
            <Card
              title="សកម្មភាពថ្មីៗ"
              variant="borderless"
              extra={
                <Button type="text" icon={<SyncOutlined />} size="small">
                  ផ្ទុកឡើងវិញ
                </Button>
              }
            >
              {renderRecentActivity()}
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: 'teachers',
      label: 'គ្រូបង្រៀន',
      children: (
        <Card variant="borderless">
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Row gutter={16} align="middle">
              <Col flex="auto">
                <Search
                  placeholder="ស្វែងរកគ្រូបង្រៀន"
                  allowClear
                  enterButton={<SearchOutlined />}
                  size="large"
                  onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))}
                />
              </Col>
              <Col>
                <Select
                  placeholder="តម្រងតាមសាលារៀន"
                  style={{ width: 200 }}
                  allowClear
                  onChange={(value) => setFilters(prev => ({ ...prev, schoolId: value }))}
                  options={schoolPerformance.map(school => ({
                    value: school.id,
                    label: school.schoolName
                  }))}
                />
              </Col>
              <Col>
                <Select
                  placeholder="តម្រងតាមមុខវិជ្ជា"
                  style={{ width: 150 }}
                  allowClear
                  onChange={(value) => setFilters(prev => ({ ...prev, subject: value }))}
                  options={[
                    { value: 'គណិតវិទ្យា', label: 'គណិតវិទ្យា' },
                    { value: 'ភាសាខ្មែរ', label: 'ភាសាខ្មែរ' },
                    { value: 'វិទ្យាសាស្ត្រ', label: 'វិទ្យាសាស្ត្រ' },
                    { value: 'សិក្សាសង្គម', label: 'សិក្សាសង្គម' },
                    { value: 'ភាសាអង់គ្លេស', label: 'ភាសាអង់គ្លេស' }
                  ]}
                />
              </Col>
            </Row>
            <Table
              columns={teacherColumns}
              dataSource={filteredTeachers}
              rowKey="id"
              scroll={{ x: 'max-content' }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `សរុប ${total} ធាតុ`
              }}
            />
          </Space>
        </Card>
      )
    },
    {
      key: 'schools',
      label: 'សាលារៀន',
      children: (
        <Card variant="borderless">
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Row gutter={16} align="middle">
              <Col flex="auto">
                <Search
                  placeholder="ស្វែងរកសាលារៀន"
                  allowClear
                  enterButton={<SearchOutlined />}
                  size="large"
                />
              </Col>
              <Col>
                <Select
                  placeholder="តម្រងតាមខេត្ត"
                  style={{ width: 200 }}
                  allowClear
                  onChange={(value) => setFilters(prev => ({ ...prev, province: value }))}
                  options={[
                    { value: 'ភ្នំពេញ', label: 'ភ្នំពេញ' },
                    { value: 'បាទដំបង', label: 'បាទដំបង' },
                    { value: 'កំពត', label: 'កំពត' },
                    { value: 'សៀមរាប', label: 'សៀមរាប' }
                  ]}
                />
              </Col>
            </Row>
            <Table
              columns={schoolColumns}
              dataSource={filteredSchools}
              rowKey="id"
              scroll={{ x: 'max-content' }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `សរុប ${total} ធាតុ`
              }}
            />
          </Space>
        </Card>
      )
    },
    {
      key: 'insights',
      label: 'ការវិភាគស៊ីជម្រៅ',
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card
              title="ការអនុវត្តល្អបំផុត"
              variant="borderless"
              extra={<TrophyOutlined style={{ color: '#faad14' }} />}
            >
              {renderBestPractices()}
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card
              title="តំបន់ដែលត្រូវកែលម្អ"
              variant="borderless"
              extra={<WarningOutlined style={{ color: '#ff4d4f' }} />}
            >
              {renderImprovementAreas()}
            </Card>
          </Col>
          <Col xs={24}>
            <Card
              title="ការប្រៀបធៀបតាមខេត្ត"
              variant="borderless"
            >
              {renderProvinceComparison()}
            </Card>
          </Col>
          <Col xs={24}>
            <Card
              title="អនុសាសន៍"
              variant="borderless"
              extra={
                <Button type="primary" icon={<ExportOutlined />} size="small">
                  នាំចេញ
                </Button>
              }
            >
              {renderRecommendations()}
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: 'analytics',
      label: 'សារអនុវត្ត',
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Card
                title="ផែនទីកំដៅនៃការអនុវត្ត"
                variant="borderless"
                extra={
                  <Space>
                    <Select
                      defaultValue="month"
                      style={{ width: 120 }}
                      options={[
                        { value: 'week', label: 'តាមសប្ដាហ៍' },
                        { value: 'month', label: 'តាមខែ' },
                        { value: 'quarter', label: 'តាមត្រីមាស' }
                      ]}
                    />
                    <Button type="text" icon={<SyncOutlined />} />
                  </Space>
                }
              >
                {renderHeatmap()}
              </Card>
              <Card
                title="ការវិភាគតាមពេលវេលា"
                variant="borderless"
              >
                {renderTimeAnalysis()}
              </Card>
            </Space>
          </Col>
          <Col xs={24} lg={8}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Card
                title="សូចនាករសំខាន់ៗ"
                variant="borderless"
              >
                {renderKeyMetrics()}
              </Card>
              <Card
                title="ការចែកចាយតាមមុខវិជ្ជា"
                variant="borderless"
              >
                {renderSubjectDistribution()}
              </Card>
              <Card
                title="អត្រាបញ្ចប់"
                variant="borderless"
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Progress
                    percent={85}
                    status="active"
                    format={(percent) => `${percent}% បានបញ្ចប់`}
                  />
                  <Text type="secondary">
                    ការសង្កេតការណ៍ដែលបានគ្រោងទុក: 120
                  </Text>
                  <Text type="secondary">
                    បានបញ្ចប់: 102
                  </Text>
                </Space>
              </Card>
            </Space>
          </Col>
        </Row>
      )
    }
  ]

  useEffect(() => {
    fetchPerformanceData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [teacherPerformance, schoolPerformance, filters])


  const applyFilters = () => {
    let filteredTeachersData = [...teacherPerformance]
    let filteredSchoolsData = [...schoolPerformance]

    // Apply teacher filters
    if (filters.searchText) {
      filteredTeachersData = filteredTeachersData.filter(teacher =>
        teacher.teacherName.toLowerCase().includes(filters.searchText!.toLowerCase()) ||
        teacher.schoolName.toLowerCase().includes(filters.searchText!.toLowerCase())
      )
    }

    if (filters.schoolId) {
      filteredTeachersData = filteredTeachersData.filter(teacher => teacher.id === filters.schoolId)
    }

    if (filters.subject) {
      filteredTeachersData = filteredTeachersData.filter(teacher => teacher.subject === filters.subject)
    }

    // Apply school filters
    if (filters.province) {
      filteredSchoolsData = filteredSchoolsData.filter(school => school.province === filters.province)
    }

    setFilteredTeachers(filteredTeachersData)
    setFilteredSchools(filteredSchoolsData)
  }

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      setExportLoading(true)
      
      // Mock export functionality
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      message.success(`បាននាំចេញជា ${format.toUpperCase()} ដោយជោគជ័យ`)
    } catch (error) {
      console.error('Export error:', error)
      message.error('មានបញ្ហាក្នុងការនាំចេញ')
    } finally {
      setExportLoading(false)
    }
  }

  const clearAllFilters = () => {
    setFilters({
      dateRange: null,
      schoolId: undefined,
      teacherId: undefined,
      subject: undefined,
      grade: undefined,
      province: undefined,
      searchText: undefined
    })
  }

  const fetchPerformanceData = async () => {
    try {
      setLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockMetrics: PerformanceMetrics = {
        totalSessions: 1247,
        completedSessions: 1089,
        averageScore: 78.5,
        activeUsers: 156,
        improvementRate: 15.3,
        completionRate: 87.3
      }
      
      const teacherData = generateMockTeacherData()
      const schoolData = generateMockSchoolData()
      
      setMetrics(mockMetrics)
      setTeacherPerformance(teacherData)
      setSchoolPerformance(schoolData)
      setFilteredTeachers(teacherData)
      setFilteredSchools(schoolData)
    } catch (error) {
      console.error('Error fetching performance data:', error)
      message.error('មានបញ្ហាក្នុងការទាញទិន្នន័យ')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div style={{ padding: '24px' }}>
      {/* Header Cards */}
      <Card className="page-header-card" variant="borderless">
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Tooltip title="ចំនួនការសង្កេតសរុប">
              <Card variant="borderless" hoverable>
                <Statistic
                  title="ការសង្កេតសរុប"
                  value={metrics?.totalObservations || 0}
                  prefix={<BookOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Tooltip>
          </Col>
          <Col xs={12} sm={6}>
            <Tooltip title="ពិន្ទុមធ្យម">
              <Card variant="borderless" hoverable>
                <Statistic
                  title="ពិន្ទុមធ្យម"
                  value={metrics?.averageScore || 0}
                  suffix="%"
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Tooltip>
          </Col>
          <Col xs={12} sm={6}>
            <Tooltip title="អត្រាបញ្ចប់">
              <Card variant="borderless" hoverable>
                <Statistic
                  title="អត្រាបញ្ចប់"
                  value={metrics?.completionRate || 0}
                  suffix="%"
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Tooltip>
          </Col>
          <Col xs={12} sm={6}>
            <Tooltip title="អ្នកប្រើប្រាស់សកម្ម">
              <Card variant="borderless" hoverable>
                <Statistic
                  title="អ្នកប្រើប្រាស់សកម្ម"
                  value={metrics?.activeUsers || 0}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Tooltip>
          </Col>
        </Row>

        <Row style={{ marginTop: 16 }}>
          <Col span={24}>
            <Space wrap>
              <RangePicker
                placeholder={['ចាប់ពីថ្ងៃ', 'ដល់ថ្ងៃ']}
                onChange={(dates) => setFilters({ ...filters, dateRange: dates as [Date, Date] })}
              />
              <Select
                placeholder="ជ្រើសរើសមុខវិជ្ជា"
                style={{ width: 150 }}
                allowClear
                onChange={(value) => setFilters({ ...filters, subject: value })}
                options={[
                  { value: 'math', label: 'គណិតវិទ្យា' },
                  { value: 'khmer', label: 'ភាសាខ្មែរ' },
                  { value: 'science', label: 'វិទ្យាសាស្ត្រ' }
                ]}
              />
              <Space.Compact>
                <Tooltip title="នាំចេញជា Excel">
                  <Button
                    icon={<FileExcelOutlined />}
                    loading={exportLoading}
                    onClick={() => handleExport('excel')}
                  >
                    Excel
                  </Button>
                </Tooltip>
                <Tooltip title="នាំចេញជា PDF">
                  <Button
                    icon={<FilePdfOutlined />}
                    loading={exportLoading}
                    onClick={() => handleExport('pdf')}
                  >
                    PDF
                  </Button>
                </Tooltip>
              </Space.Compact>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Performance Tabs */}
      <Card style={{ marginTop: 16 }} loading={loading}>
        <Tabs 
          defaultActiveKey="overview" 
          onChange={setActiveTab}
          items={tabItems}
          tabBarExtraContent={
            activeTab === 'overview' && (
              <Space>
                <Text type="secondary">មើល:</Text>
                <Radio.Group 
                  value={chartType} 
                  onChange={(e) => setChartType(e.target.value)}
                  size="small"
                >
                  <Radio.Button value="line">
                    <LineChartOutlined />
                  </Radio.Button>
                  <Radio.Button value="column">
                    <BarChartOutlined />
                  </Radio.Button>
                  <Radio.Button value="area">
                    <PieChartOutlined />
                  </Radio.Button>
                </Radio.Group>
              </Space>
            )
          }
        />
      </Card>
    </div>
  )
}

export default PerformancePage