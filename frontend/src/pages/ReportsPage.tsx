import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Button,
  Table,
  Space,
  Typography,
  Tabs,
  Statistic,
  Badge,
  Tag,
  Progress,
  Alert,
  Dropdown,
  Menu,
  Divider,
  Modal,
  Form,
  Input,
  Radio,
  Checkbox,
  message,
  Skeleton,
  Spin,
  Empty
} from 'antd';
import {
  DownloadOutlined,
  PrinterOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FilterOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  FileTextOutlined,
  EyeOutlined,
  ExportOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { Line, Column, Pie, Area, Gauge, Bar } from '@ant-design/plots';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Option } = Select;

// Styled Components
const ReportsWrapper = styled.div`
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
`;

const FilterCard = styled(Card)`
  margin-bottom: 24px;
  .ant-card-body {
    padding: 16px;
  }
`;

const ReportCard = styled(Card)`
  height: 100%;
  .ant-card-head {
    background: #fafafa;
  }
`;

const ExportMenu = styled(Menu)`
  .ant-dropdown-menu-item {
    gap: 8px;
  }
`;

const StatCard = styled(Card)`
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.12);
  }
  
  .ant-statistic-title {
    color: #666;
    font-size: 14px;
  }
  
  .ant-statistic-content {
    font-size: 24px;
  }
`;

const ChartContainer = styled.div`
  padding: 16px;
  background: white;
  border-radius: 8px;
  margin-bottom: 16px;
`;

// Role-based report access configuration
const REPORT_ACCESS = {
  Administrator: ['all'],
  Zone: ['all'],
  Provincial: ['observation', 'teacher', 'student', 'attendance', 'performance', 'mission'],
  Department: ['observation', 'teacher', 'student', 'attendance', 'performance'],
  Cluster: ['observation', 'teacher', 'student', 'attendance'],
  Director: ['observation', 'teacher', 'student', 'attendance'],
  Teacher: ['observation']
};

// Loading component
const ChartLoadingSpinner = () => (
  <div style={{ textAlign: 'center', padding: '50px 0' }}>
    <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
  </div>
);

// Error boundary component
class ReportErrorBoundary extends React.Component<
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
    console.error('Report error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Alert
          message="មានបញ្ហាក្នុងការបង្ហាញរបាយការណ៍"
          description="សូមព្យាយាមម្តងទៀត ឬទាក់ទងផ្នែកបច្ចេកទេស"
          type="error"
          showIcon
        />
      );
    }

    return this.props.children;
  }
}

const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('observation');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedSchool, setSelectedSchool] = useState('all');
  const [loading, setLoading] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportForm] = Form.useForm();
  const [chartLoading, setChartLoading] = useState(true);

  // Data fetchers with caching
  const fetchObservationData = useCallback(async () => {
    // Simulate API call with delay
    await new Promise(resolve => setTimeout(resolve, 500));
    const data = [];
    for (let i = 0; i < 30; i++) {
      data.push({
        date: dayjs().subtract(i, 'day').format('DD/MM/YYYY'),
        observations: Math.floor(Math.random() * 50) + 20,
        schools: Math.floor(Math.random() * 15) + 5,
        mentors: Math.floor(Math.random() * 10) + 3
      });
    }
    return data.reverse();
  }, []);

  const fetchTeacherPerformance = useCallback(async () => {
    // Simulate API call with delay
    await new Promise(resolve => setTimeout(resolve, 300));
    const provinces = ['ភ្នំពេញ', 'កណ្តាល', 'កំពង់ចាម', 'សៀមរាប', 'បាត់ដំបង'];
    return provinces.map(province => ({
      province,
      excellent: Math.floor(Math.random() * 30) + 20,
      good: Math.floor(Math.random() * 40) + 30,
      average: Math.floor(Math.random() * 20) + 10,
      needsImprovement: Math.floor(Math.random() * 10) + 5
    }));
  }, []);

  const fetchStudentProgress = useCallback(async () => {
    // Simulate API call with delay
    await new Promise(resolve => setTimeout(resolve, 400));
    const subjects = ['គណិតវិទ្យា', 'ភាសាខ្មែរ', 'វិទ្យាសាស្ត្រ', 'សង្គមវិទ្យា', 'អង់គ្លេស'];
    return subjects.map(subject => ({
      subject,
      preTest: Math.floor(Math.random() * 30) + 40,
      postTest: Math.floor(Math.random() * 30) + 60,
      improvement: Math.floor(Math.random() * 20) + 10
    }));
  }, []);

  // React Query hooks for caching
  const { data: observationData = [], isLoading: observationLoading } = useQuery({
    queryKey: ['observationData', dateRange, selectedLocation],
    queryFn: fetchObservationData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: teacherData = [], isLoading: teacherLoading } = useQuery({
    queryKey: ['teacherPerformance', selectedLocation],
    queryFn: fetchTeacherPerformance,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  const { data: studentData = [], isLoading: studentLoading } = useQuery({
    queryKey: ['studentProgress', selectedSchool],
    queryFn: fetchStudentProgress,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  // Simulate chart loading
  useEffect(() => {
    const timer = setTimeout(() => setChartLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Check user access to reports
  const getUserReportAccess = () => {
    const userRole = user?.role || 'Teacher';
    const access = REPORT_ACCESS[userRole as keyof typeof REPORT_ACCESS] || ['observation'];
    return access.includes('all') ? 
      ['observation', 'teacher', 'student', 'attendance', 'performance', 'mission', 'financial'] : 
      access;
  };

  const allowedReports = getUserReportAccess();

  // Table pagination state
  const [tablePagination, setTablePagination] = useState({
    current: 1,
    pageSize: 10,
    total: 100
  });

  // Generate more sample data for pagination demo
  const generateTableData = useCallback((count: number) => {
    const mentors = ['សុខ សុភាព', 'ហេង សំណាង', 'ចាន់ ដារា', 'លី សុខា', 'ពៅ ច័ន្ទថា'];
    const schools = ['សាលាបឋមសិក្សា ភ្នំពេញថ្មី', 'សាលាបឋមសិក្សា កណ្តាល', 'សាលាបឋមសិក្សា កំពង់ចាម'];
    const subjects = ['គណិតវិទ្យា', 'ភាសាខ្មែរ', 'វិទ្យាសាស្ត្រ', 'សង្គមវិទ្យា', 'អង់គ្លេស'];
    const grades = ['ថ្នាក់ទី១', 'ថ្នាក់ទី២', 'ថ្នាក់ទី៣', 'ថ្នាក់ទី៤', 'ថ្នាក់ទី៥', 'ថ្នាក់ទី៦'];
    
    return Array.from({ length: count }, (_, i) => ({
      key: `${i + 1}`,
      date: dayjs().subtract(Math.floor(Math.random() * 30), 'day').format('DD/MM/YYYY'),
      mentor: mentors[Math.floor(Math.random() * mentors.length)],
      school: schools[Math.floor(Math.random() * schools.length)],
      teacher: mentors[Math.floor(Math.random() * mentors.length)],
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      grade: grades[Math.floor(Math.random() * grades.length)],
      score: Math.floor(Math.random() * 40) + 60,
      status: Math.random() > 0.2 ? 'completed' : 'pending'
    }));
  }, []);

  // Use React Query for table data
  const { data: fullTableData = [], isLoading: tableLoading } = useQuery({
    queryKey: ['tableData', selectedLocation, selectedSchool, dateRange],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return generateTableData(100);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Get paginated data
  const observationTableData = useMemo(() => {
    const start = (tablePagination.current - 1) * tablePagination.pageSize;
    const end = start + tablePagination.pageSize;
    return fullTableData.slice(start, end);
  }, [fullTableData, tablePagination]);

  const observationColumns = [
    {
      title: 'កាលបរិច្ឆេទ',
      dataIndex: 'date',
      key: 'date',
      sorter: true
    },
    {
      title: 'អ្នកណែនាំ',
      dataIndex: 'mentor',
      key: 'mentor'
    },
    {
      title: 'សាលារៀន',
      dataIndex: 'school',
      key: 'school'
    },
    {
      title: 'គ្រូបង្រៀន',
      dataIndex: 'teacher',
      key: 'teacher'
    },
    {
      title: 'មុខវិជ្ជា',
      dataIndex: 'subject',
      key: 'subject'
    },
    {
      title: 'ថ្នាក់',
      dataIndex: 'grade',
      key: 'grade'
    },
    {
      title: 'ពិន្ទុ',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => (
        <Progress 
          percent={score} 
          size="small" 
          strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f'}
        />
      )
    },
    {
      title: 'ស្ថានភាព',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'green' : 'orange'}>
          {status === 'completed' ? 'បានបញ្ចប់' : 'កំពុងដំណើរការ'}
        </Tag>
      )
    }
  ];

  // Memoized chart configurations
  const observationTrendConfig = useMemo(() => ({
    data: observationData,
    xField: 'date',
    yField: 'observations',
    smooth: true,
    point: {
      size: 5,
      shape: 'diamond'
    },
    label: {
      style: {
        fill: '#aaa'
      }
    },
    animation: {
      appear: {
        animation: 'path-in',
        duration: 800,
      },
    }
  }), [observationData]);

  const teacherPerformanceConfig = useMemo(() => ({
    data: teacherData,
    xField: 'province',
    yField: 'value',
    seriesField: 'type',
    isStack: true,
    color: ['#52c41a', '#1890ff', '#faad14', '#ff4d4f'],
    animation: {
      appear: {
        animation: 'scale-in-y',
        duration: 800,
      },
    }
  }), [teacherData]);

  const studentProgressConfig = useMemo(() => ({
    data: studentData,
    xField: 'subject',
    yField: 'value',
    seriesField: 'type',
    isGroup: true,
    columnStyle: {
      radius: [20, 20, 0, 0]
    },
    animation: {
      appear: {
        animation: 'scale-in-y',
        duration: 800,
      },
    }
  }), [studentData]);

  // Export functions with callbacks
  const handleExportExcel = useCallback(() => {
    try {
      setLoading(true);
      const ws = XLSX.utils.json_to_sheet(observationTableData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'របាយការណ៍');
      XLSX.writeFile(wb, `របាយការណ៍_${dayjs().format('YYYY-MM-DD')}.xlsx`);
      message.success('បានទាញយកជា Excel ដោយជោគជ័យ!');
    } catch (error) {
      message.error('មានបញ្ហាក្នុងការទាញយក Excel');
      console.error('Export Excel error:', error);
    } finally {
      setLoading(false);
    }
  }, [observationTableData]);

  const handleExportPDF = useCallback(async () => {
    const element = document.getElementById('report-content');
    if (!element) return;

    try {
      setLoading(true);
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      pdf.setFont('helvetica', 'normal');
      pdf.text('របាយការណ៍ PLP Mentor', pdfWidth / 2, 15, { align: 'center' });
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`របាយការណ៍_${dayjs().format('YYYY-MM-DD')}.pdf`);
      message.success('បានទាញយកជា PDF ដោយជោគជ័យ!');
    } catch (error) {
      message.error('មានបញ្ហាក្នុងការទាញយក PDF');
      console.error('Export PDF error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
    message.success('កំពុងបោះពុម្ព...');
  }, []);

  const exportMenuItems = [
    {
      key: 'excel',
      icon: <FileExcelOutlined style={{ color: '#52c41a' }} />,
      label: 'ទាញយកជា Excel',
      onClick: handleExportExcel
    },
    {
      key: 'pdf',
      icon: <FilePdfOutlined style={{ color: '#ff4d4f' }} />,
      label: 'ទាញយកជា PDF',
      onClick: handleExportPDF
    },
    {
      key: 'print',
      icon: <PrinterOutlined style={{ color: '#1890ff' }} />,
      label: 'បោះពុម្ព',
      onClick: handlePrint
    }
  ];

  // Summary statistics
  const summaryStats = {
    totalObservations: 1234,
    totalSchools: 45,
    totalTeachers: 678,
    totalStudents: 12450,
    avgScore: 78.5,
    completionRate: 89
  };

  const renderObservationReport = () => (
    <div id="report-content">
      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard>
            <Statistic
              title="ការសង្កេតសរុប"
              value={summaryStats.totalObservations}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </StatCard>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard>
            <Statistic
              title="សាលារៀន"
              value={summaryStats.totalSchools}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </StatCard>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard>
            <Statistic
              title="គ្រូបង្រៀន"
              value={summaryStats.totalTeachers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </StatCard>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard>
            <Statistic
              title="ពិន្ទុមធ្យម"
              value={summaryStats.avgScore}
              suffix="%"
              valueStyle={{ color: '#fa8c16' }}
            />
          </StatCard>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard>
            <Statistic
              title="អត្រាបញ្ចប់"
              value={summaryStats.completionRate}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </StatCard>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard>
            <Badge dot status="processing">
              <Statistic
                title="កំពុងដំណើរការ"
                value={23}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Badge>
          </StatCard>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <ReportCard title="និន្នាការការសង្កេត (៣០ ថ្ងៃចុងក្រោយ)">
            <ReportErrorBoundary>
              {chartLoading || observationLoading ? (
                <ChartLoadingSpinner />
              ) : observationData.length > 0 ? (
                <Line {...observationTrendConfig} height={300} />
              ) : (
                <Empty description="មិនមានទិន្នន័យ" />
              )}
            </ReportErrorBoundary>
          </ReportCard>
        </Col>
        <Col xs={24} lg={12}>
          <ReportCard title="ការសង្កេតតាមខេត្ត">
            <ReportErrorBoundary>
              {chartLoading ? (
                <ChartLoadingSpinner />
              ) : (
                <Pie
                  data={[
                    { province: 'ភ្នំពេញ', value: 35 },
                    { province: 'កណ្តាល', value: 28 },
                    { province: 'កំពង់ចាម', value: 22 },
                    { province: 'សៀមរាប', value: 18 },
                    { province: 'បាត់ដំបង', value: 15 },
                    { province: 'ផ្សេងៗ', value: 12 }
                  ]}
                  angleField="value"
                  colorField="province"
                  radius={0.8}
                  label={{
                    type: 'inner',
                    offset: '-30%',
                    content: ({ percent }) => `${(percent * 100).toFixed(0)}%`,
                    style: {
                      fontSize: 14,
                      textAlign: 'center'
                    }
                  }}
                  height={300}
                />
              )}
            </ReportErrorBoundary>
          </ReportCard>
        </Col>
      </Row>

      {/* Data Table */}
      <ReportCard 
        title="តារាងលម្អិតការសង្កេត"
        extra={
          <Space>
            <Button icon={<FilterOutlined />}>តម្រង</Button>
            <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
              <Button type="primary" icon={<ExportOutlined />}>
                ទាញយក
              </Button>
            </Dropdown>
          </Space>
        }
      >
        <Table
          columns={observationColumns}
          dataSource={observationTableData}
          loading={tableLoading || observationLoading}
          pagination={{
            ...tablePagination,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]} នៃ ${total} កំណត់ត្រា`,
            onChange: (page, pageSize) => {
              setTablePagination(prev => ({
                ...prev,
                current: page,
                pageSize: pageSize || 10
              }));
            }
          }}
          locale={{
            emptyText: (
              <Empty
                description="មិនមានទិន្នន័យ"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
          scroll={{ x: 1200 }}
        />
      </ReportCard>
    </div>
  );

  const renderTeacherReport = () => (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <ReportCard title="ដំណើរការលទ្ធផលគ្រូបង្រៀន">
            <ReportErrorBoundary>
              {chartLoading || teacherLoading ? (
                <ChartLoadingSpinner />
              ) : teacherData.length > 0 ? (
                <Column
                  data={teacherData.flatMap(item => [
                    { province: item.province, type: 'ល្អបំផុត', value: item.excellent },
                    { province: item.province, type: 'ល្អ', value: item.good },
                    { province: item.province, type: 'មធ្យម', value: item.average },
                    { province: item.province, type: 'ត្រូវកែលម្អ', value: item.needsImprovement }
                  ])}
                  {...teacherPerformanceConfig}
                  height={400}
                />
              ) : (
                <Empty description="មិនមានទិន្នន័យ" />
              )}
            </ReportErrorBoundary>
          </ReportCard>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <ReportCard title="ការវិភាគជំនាញគ្រូ">
            <ReportErrorBoundary>
              <Gauge
                percent={0.75}
                range={{
                  color: 'l(0) 0:#ff4d4f 0.5:#faad14 1:#52c41a'
                }}
                startAngle={180}
                endAngle={0}
                height={200}
                statistic={{
                  title: {
                    formatter: () => 'កម្រិតជំនាញមធ្យម',
                    style: { fontSize: '16px' }
                  },
                  content: {
                    formatter: () => '75%',
                    style: { fontSize: '24px' }
                  }
                }}
              />
            </ReportErrorBoundary>
          </ReportCard>
        </Col>
        <Col xs={24} md={12}>
          <ReportCard title="ការចូលរួមការបណ្តុះបណ្តាល">
            <ReportErrorBoundary>
              <Area
                data={[
                  { month: 'មករា', value: 65 },
                  { month: 'កុម្ភៈ', value: 72 },
                  { month: 'មីនា', value: 78 },
                  { month: 'មេសា', value: 83 },
                  { month: 'ឧសភា', value: 88 },
                  { month: 'មិថុនា', value: 92 }
                ]}
                xField="month"
                yField="value"
                smooth
                areaStyle={{
                  fill: 'l(270) 0:#ffffff 0.5:#7ec2f3 1:#1890ff'
                }}
                height={200}
              />
            </ReportErrorBoundary>
          </ReportCard>
        </Col>
      </Row>
    </div>
  );

  const renderStudentReport = () => (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Alert
            message="សមិទ្ធផលសិស្ស"
            description="ការវិភាគលទ្ធផលរៀនសូត្ររបស់សិស្សតាមមុខវិជ្ជា និងការរីកចម្រើន"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <ReportCard title="ការរីកចម្រើនតាមមុខវិជ្ជា">
            {studentLoading ? (
              <ChartLoadingSpinner />
            ) : studentData.length > 0 ? (
              <Column
                data={studentData.flatMap(item => [
                  { subject: item.subject, type: 'មុនសិក្សា', value: item.preTest },
                  { subject: item.subject, type: 'ក្រោយសិក្សា', value: item.postTest },
                  { subject: item.subject, type: 'ការរីកចម្រើន', value: item.improvement }
                ])}
                {...studentProgressConfig}
                height={400}
              />
            ) : (
              <Empty description="មិនមានទិន្នន័យ" />
            )}
          </ReportCard>
        </Col>
        <Col xs={24} lg={8}>
          <ReportCard title="សង្ខេបលទ្ធផល">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text type="secondary">សិស្សសរុប</Text>
                <Title level={3} style={{ margin: '8px 0' }}>12,450</Title>
                <Progress percent={100} showInfo={false} />
              </div>
              <Divider />
              <div>
                <Text type="secondary">សិស្សលទ្ធផលល្អ</Text>
                <Title level={3} style={{ margin: '8px 0', color: '#52c41a' }}>8,234</Title>
                <Progress percent={66} strokeColor="#52c41a" />
              </div>
              <Divider />
              <div>
                <Text type="secondary">សិស្សត្រូវជួយបន្ថែម</Text>
                <Title level={3} style={{ margin: '8px 0', color: '#faad14' }}>3,456</Title>
                <Progress percent={28} strokeColor="#faad14" />
              </div>
              <Divider />
              <div>
                <Text type="secondary">សិស្សលទ្ធផលទាប</Text>
                <Title level={3} style={{ margin: '8px 0', color: '#ff4d4f' }}>760</Title>
                <Progress percent={6} strokeColor="#ff4d4f" />
              </div>
            </Space>
          </ReportCard>
        </Col>
      </Row>
    </div>
  );

  const renderReportContent = () => {
    switch (activeTab) {
      case 'observation':
        return renderObservationReport();
      case 'teacher':
        return renderTeacherReport();
      case 'student':
        return renderStudentReport();
      case 'attendance':
        return (
          <Alert
            message="របាយការណ៍វត្តមាន"
            description="របាយការណ៍វត្តមានកំពុងត្រូវបានអភិវឌ្ឍ..."
            type="info"
            showIcon
          />
        );
      case 'performance':
        return (
          <Alert
            message="របាយការណ៍ដំណើរការ"
            description="របាយការណ៍ដំណើរការកំពុងត្រូវបានអភិវឌ្ឍ..."
            type="info"
            showIcon
          />
        );
      case 'mission':
        return (
          <Alert
            message="របាយការណ៍បេសកកម្ម"
            description="របាយការណ៍បេសកកម្មកំពុងត្រូវបានអភិវឌ្ឍ..."
            type="info"
            showIcon
          />
        );
      case 'financial':
        return (
          <Alert
            message="របាយការណ៍ហិរញ្ញវត្ថុ"
            description="របាយការណ៍ហិរញ្ញវត្ថុកំពុងត្រូវបានអភិវឌ្ឍ..."
            type="info"
            showIcon
          />
        );
      default:
        return null;
    }
  };

  const reportTabs = [
    { key: 'observation', label: 'ការសង្កេត', icon: <EyeOutlined /> },
    { key: 'teacher', label: 'គ្រូបង្រៀន', icon: <UserOutlined /> },
    { key: 'student', label: 'សិស្ស', icon: <TeamOutlined /> },
    { key: 'attendance', label: 'វត្តមាន', icon: <CalendarOutlined /> },
    { key: 'performance', label: 'ដំណើរការ', icon: <LineChartOutlined /> },
    { key: 'mission', label: 'បេសកកម្ម', icon: <EnvironmentOutlined /> },
    { key: 'financial', label: 'ហិរញ្ញវត្ថុ', icon: <BarChartOutlined /> }
  ].filter(tab => allowedReports.includes(tab.key));

  return (
    <ReportsWrapper>
      <Title level={2} style={{ marginBottom: 24 }}>
        <FileTextOutlined /> របាយការណ៍
      </Title>

      {/* Filter Section */}
      <FilterCard>
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
              <Text type="secondary">ទីតាំង</Text>
              <Select
                value={selectedLocation}
                onChange={setSelectedLocation}
                style={{ width: '100%' }}
                placeholder="ជ្រើសរើសទីតាំង"
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
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">សាលារៀន</Text>
              <Select
                value={selectedSchool}
                onChange={setSelectedSchool}
                style={{ width: '100%' }}
                placeholder="ជ្រើសរើសសាលា"
              >
                <Option value="all">ទាំងអស់</Option>
                <Option value="school1">សាលាបឋមសិក្សា ភ្នំពេញថ្មី</Option>
                <Option value="school2">សាលាបឋមសិក្សា កណ្តាល</Option>
                <Option value="school3">សាលាបឋមសិក្សា កំពង់ចាម</Option>
              </Select>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Button type="primary" icon={<FilterOutlined />}>
                អនុវត្តតម្រង
              </Button>
              <Button>កំណត់ឡើងវិញ</Button>
            </Space>
          </Col>
        </Row>
      </FilterCard>

      {/* Report Tabs */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={reportTabs.map(tab => ({
            key: tab.key,
            label: (
              <span>
                {tab.icon} {tab.label}
              </span>
            ),
            children: renderReportContent()
          }))}
        />
      </Card>

      {/* Export Modal */}
      <Modal
        title="ជម្រើសការទាញយករបាយការណ៍"
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        footer={null}
      >
        <Form form={exportForm} layout="vertical">
          <Form.Item name="format" label="ទម្រង់ឯកសារ">
            <Radio.Group>
              <Radio value="excel">Excel (.xlsx)</Radio>
              <Radio value="pdf">PDF</Radio>
              <Radio value="csv">CSV</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="includeCharts" valuePropName="checked">
            <Checkbox>រួមបញ្ចូលក្រាហ្វិក</Checkbox>
          </Form.Item>
          <Form.Item name="includeRawData" valuePropName="checked">
            <Checkbox>រួមបញ្ចូលទិន្នន័យដើម</Checkbox>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<DownloadOutlined />}>
                ទាញយក
              </Button>
              <Button onClick={() => setExportModalVisible(false)}>
                បោះបង់
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </ReportsWrapper>
  );
};

export default ReportsPage;